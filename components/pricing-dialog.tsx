"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Zap, Crown, CreditCard, Infinity } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import { Checkout } from "@/components/checkout"

interface PricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const [checkoutProduct, setCheckoutProduct] = useState<string | null>(null)

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

  if (checkoutProduct) {
    return (
      <Checkout
        productId={checkoutProduct}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutProduct(null)
            onOpenChange(false)
          }
        }}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Get More Credits</DialogTitle>
          <DialogDescription className="text-center">Choose a credit pack or go unlimited with Pro</DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
          {PRODUCTS.map((product) => {
            const Icon = getProductIcon(product.id)
            const isPopular = product.id === "credits-25"
            const isLifetime = product.id === "pro-lifetime"
            const isPro = product.id === "pro-monthly"

            return (
              <Card
                key={product.id}
                className={`rounded-2xl backdrop-blur-xl border-border/50 relative ${
                  isLifetime
                    ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 ring-2 ring-primary/20"
                    : isPopular
                      ? "bg-primary/5 border-primary/30"
                      : isPro
                        ? "bg-accent/5 border-accent/30"
                        : "bg-card/50"
                }`}
              >
                {product.savings && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
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
                <CardHeader className="text-center pb-2 pt-4">
                  <div
                    className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
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
                      className={`w-5 h-5 ${
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
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription className="text-xs">{product.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-2xl font-bold">${(product.priceInCents / 100).toFixed(2)}</span>
                    {product.isSubscription && <span className="text-muted-foreground text-xs">/month</span>}
                    {product.isLifetime && <span className="text-muted-foreground text-xs"> once</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <ul className="space-y-1.5">
                    {product.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check
                          className={`w-3 h-3 flex-shrink-0 ${
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
                  <Button
                    onClick={() => setCheckoutProduct(product.id)}
                    className={`w-full rounded-xl h-9 text-sm ${
                      isLifetime
                        ? "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                        : isPopular
                          ? "bg-primary hover:bg-primary/90"
                          : ""
                    }`}
                    variant={isLifetime || isPopular ? "default" : "outline"}
                  >
                    {product.isSubscription ? "Subscribe" : product.isLifetime ? "Get Lifetime" : "Buy"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
