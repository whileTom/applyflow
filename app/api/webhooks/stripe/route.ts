import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

// Use service role for webhook handling (bypasses RLS)
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event

  try {
    // In production, you'd verify with a webhook secret
    // For now, we'll parse the event directly
    event = JSON.parse(body)
  } catch (err) {
    console.error("[Stripe Webhook] Error parsing event:", err)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const productId = session.metadata?.product_id
        const credits = Number.parseInt(session.metadata?.credits || "0", 10)

        if (!userId) break

        if (credits > 0) {
          // Add credits for one-time purchase
          const { data: profile } = await supabaseAdmin
            .from("user_profiles")
            .select("credits_remaining")
            .eq("id", userId)
            .single()

          await supabaseAdmin
            .from("user_profiles")
            .update({
              credits_remaining: (profile?.credits_remaining || 0) + credits,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
        } else {
          // Subscription purchase
          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: "pro",
              subscription_id: session.subscription,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          const status = subscription.status === "active" ? "pro" : "cancelled"
          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: profile } = await supabaseAdmin
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (profile) {
          await supabaseAdmin
            .from("user_profiles")
            .update({
              subscription_status: "free",
              subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profile.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
