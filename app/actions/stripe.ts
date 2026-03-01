"use server"

import { stripe } from "@/lib/stripe"
import { PRODUCTS } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

async function ensureUserProfile(supabaseAdmin: ReturnType<typeof createAdminClient>, userId: string, email?: string) {
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, credits_remaining, subscription_status, stripe_customer_id")
    .eq("id", userId)
    .single()

  if (!profile) {
    // Check if user exists in old 'users' table and migrate data
    const { data: oldUser } = await supabaseAdmin.from("users").select("*").eq("id", userId).single()

    const newProfile = {
      id: userId,
      email: email || oldUser?.email,
      full_name: oldUser?.full_name || null,
      credits_remaining: oldUser?.credits_remaining ?? 3,
      subscription_status: oldUser?.subscription_status || "free",
      stripe_customer_id: oldUser?.stripe_customer_id || null,
      default_resume_url: oldUser?.default_resume_url || null,
      google_api_key: oldUser?.google_api_key || null,
    }

    await supabaseAdmin.from("user_profiles").insert(newProfile)
    return newProfile
  }

  return profile
}

export async function startCheckoutSession(productId: string, returnUrl: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("You must be logged in to make a purchase")
  }

  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const profile = await ensureUserProfile(supabaseAdmin, user.id, user.email)

  let stripeCustomerId = profile?.stripe_customer_id

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })
    stripeCustomerId = customer.id

    await supabaseAdmin.from("user_profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    ui_mode: "embedded",
    return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          ...(product.isSubscription && {
            recurring: {
              interval: "month",
            },
          }),
        },
        quantity: 1,
      },
    ],
    mode: product.isSubscription ? "subscription" : "payment",
    metadata: {
      product_id: product.id,
      user_id: user.id,
      credits: product.credits?.toString() || "0",
    },
  })

  return session.client_secret
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const profile = await ensureUserProfile(supabaseAdmin, user.id, user.email)

  return {
    subscription_status: profile?.subscription_status || "free",
    credits_remaining: profile?.credits_remaining ?? 3,
  }
}

export async function verifyAndFulfillOrder(sessionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("You must be logged in")
  }

  // Retrieve the session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (!session) {
    throw new Error("Session not found")
  }

  // Verify the session belongs to this user
  if (session.metadata?.user_id !== user.id) {
    throw new Error("Unauthorized")
  }

  // Check if payment was successful
  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed")
  }

  // Use admin client to bypass RLS
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Check if this session has already been fulfilled
  const { data: existingFulfillment } = await supabaseAdmin
    .from("order_fulfillments")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .single()

  if (existingFulfillment) {
    // Already fulfilled, return success
    return { success: true, alreadyFulfilled: true }
  }

  const credits = Number.parseInt(session.metadata?.credits || "0", 10)
  const productId = session.metadata?.product_id

  const profile = await ensureUserProfile(supabaseAdmin, user.id, user.email)

  if (credits > 0) {
    // One-time credit purchase
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        credits_remaining: (profile?.credits_remaining || 0) + credits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error updating credits:", updateError)
      throw new Error("Failed to update credits")
    }
  } else if (productId === "pro-monthly") {
    // Subscription purchase
    await supabaseAdmin
      .from("user_profiles")
      .update({
        subscription_status: "pro",
        subscription_id: session.subscription as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
  }

  // Record fulfillment to prevent double-fulfillment
  await supabaseAdmin.from("order_fulfillments").insert({
    stripe_session_id: sessionId,
    user_id: user.id,
    product_id: productId,
    credits_added: credits,
    fulfilled_at: new Date().toISOString(),
  })

  return { success: true, credits, productId }
}
