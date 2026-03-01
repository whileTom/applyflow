"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, Zap, Crown, CreditCard, Infinity } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { Checkout } from "@/components/checkout"
import Link from "next/link"
import Image from "next/image"
import Head from "next/head"

export default function PricingPage() {
  const [checkoutProduct, setCheckoutProduct] = useState<string | null>(null)
  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_")

  const getProductIcon = (productId: string) => {
    switch (productId) {
      case "credits-1":
        return CreditCard
      case "credits-10":
        return Zap
      case "credits-25":
        return Zap
      case "pro-monthly":
        return Crown
      case "pro-lifetime":
        return Infinity
      default:
        return Zap
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Head>
        <title>Pricing - ApplyFlow</title>
        <meta name="description" content="Simple, transparent pricing for ApplyFlow services." />
      </Head>
      <div className="container mx-auto py-16 px-4 max-w-7xl">
        {isTestMode && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
              Test Mode - Payments are simulated. Use card 4242 4242 4242 4242 to test.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-4">
          <Link href="/" className="inline-block">
            <div className="logo-shimmer" style={{ "--logo-mask": "url(/applyflow-logo.svg)" } as React.CSSProperties}>
              <Image
                src="/applyflow-logo.svg"
                alt="ApplyFlow"
                width={624}
                height={249}
                className="h-39 w-auto mx-auto transition-opacity hover:opacity-80"
                priority
              />
            </div>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with 3 free optimizations. Buy more credits or go unlimited.
          </p>
        </div>

        {/* Free Tier */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Get started with no commitment</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">$0</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {["3 resume optimizations", "PDF export", "Interview guide generation", "Basic AI model"].map(
                  (feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ),
                )}
              </ul>
              <Button asChild className="w-full rounded-xl h-11 bg-transparent" variant="outline">
                <Link href="/auth/sign-up">Get started free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {PRODUCTS.map((product) => {
            const Icon = getProductIcon(product.id)
            const isPopular = product.id === "credits-25"
            const isLifetime = product.id === "pro-lifetime"
            const isPro = product.id === "pro-monthly"

            return (
              <Card
                key={product.id}
                className={`rounded-3xl backdrop-blur-xl border-border/50 relative ${
                  isLifetime
                    ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 ring-2 ring-primary/20"
                    : isPopular
                      ? "bg-primary/5 border-primary/30 ring-2 ring-primary/20"
                      : isPro
                        ? "bg-accent/5 border-accent/30"
                        : "bg-card/50"
                }`}
              >
                {product.savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        isLifetime
                          ? "bg-gradient-to-r from-primary to-accent text-white"
                          : isPopular
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {product.savings}
                    </span>
                  </div>
                )}
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                      Best Value
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div
                    className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                      isLifetime
                        ? "bg-gradient-to-br from-primary/20 to-accent/20"
                        : isPopular
                          ? "bg-primary/20"
                          : isPro
                            ? "bg-accent/20"
                            : "bg-muted/50"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        isLifetime
                          ? "text-primary"
                          : isPopular
                            ? "text-primary"
                            : isPro
                              ? "text-accent"
                              : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <CardDescription className="text-xs">{product.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">${(product.priceInCents / 100).toFixed(2)}</span>
                    {product.isSubscription && <span className="text-muted-foreground text-sm">/month</span>}
                    {product.isLifetime && <span className="text-muted-foreground text-sm"> once</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 ${
                            isLifetime
                              ? "text-primary"
                              : isPopular
                                ? "text-primary"
                                : isPro
                                  ? "text-accent"
                                  : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Questions?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutProduct && (
        <Checkout
          productId={checkoutProduct}
          open={!!checkoutProduct}
          onOpenChange={(open) => !open && setCheckoutProduct(null)}
        />
      )}
    </div>
  )
}
