"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sparkles,
  Settings,
  LogOut,
  CreditCard,
  Crown,
  Zap,
  History,
  FileText,
  TrendingUp,
  Clock,
  ChevronRight,
  UserIcon,
  BarChart3,
  Download,
  MousePointer2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Checkout } from "@/components/checkout"
import { HistoryDialog } from "@/components/history-dialog"
import { ProfileDialog } from "@/components/profile-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TutorialOverlay, useTutorial, type TutorialStep } from "@/components/tutorial-overlay"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  credits_remaining: number
  default_resume_url: string | null
  avatar_url: string | null
}

interface ResumeHistoryItem {
  id: string
  job_title: string | null
  company_name: string | null
  created_at: string
}

interface DashboardContentProps {
  user: User
  profile: UserProfile | null
}

// Dashboard tutorial steps
const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    targetSelector: "#optimize-cta-card",
    title: "Welcome to ApplyFlow!",
    description:
      "Let's get you started with your first resume optimization. This is the main action button - click here to begin creating your tailored resume.",
    position: "bottom",
    action: "click",
    highlightPadding: 12,
  },
]

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const [checkoutProduct, setCheckoutProduct] = useState<string | null>(null)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ResumeHistoryItem[]>([])
  const [totalOptimizations, setTotalOptimizations] = useState(0)

  // Tutorial state
  const { showTutorial, completeTutorial } = useTutorial("dashboard-tutorial-completed")

  const supabase = createClient()

  useEffect(() => {
    async function fetchRecentActivity() {
      const { data, count } = await supabase
        .from("resume_history")
        .select("id, job_title, company_name, created_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (data) {
        setRecentActivity(data)
        setTotalOptimizations(count || 0)
      }
    }
    fetchRecentActivity()
  }, [user.id, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleProfileUpdate = () => {
    router.refresh()
  }

  const isPro = profile?.subscription_status === "pro"
  const credits = profile?.credits_remaining ?? 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="logo-shimmer" style={{ "--logo-mask": "url(/logo-no-text.svg)" } as React.CSSProperties}>
                <Image
                  src="/logo-no-text.svg"
                  alt="ApplyFlow"
                  width={546}
                  height={218}
                  className="h-10 sm:h-12 w-auto"
                />
              </div>
            </Link>

            {/* Right side controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url || "/placeholder.svg"}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryDialogOpen(true)} className="cursor-pointer">
                    <History className="w-4 h-4 mr-2" />
                    Resume History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Here&apos;s an overview of your resume optimization activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {/* Plan Status */}
          <Card className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  {isPro ? <Crown className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />}
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{isPro ? "Pro" : "Free"}</p>
              <p className="text-xs text-muted-foreground mt-1">{isPro ? "Unlimited access" : "Limited features"}</p>
            </CardContent>
          </Card>

          {/* Credits */}
          <Card className="col-span-1 bg-card/50 border-border/50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{isPro ? "∞" : credits}</p>
              <p className="text-xs text-muted-foreground mt-1">{isPro ? "Unlimited" : "Remaining"}</p>
            </CardContent>
          </Card>

          {/* Total Optimizations */}
          <Card className="col-span-1 bg-card/50 border-border/50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-chart-3/20">
                  <BarChart3 className="w-4 h-4 text-chart-3" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{totalOptimizations}</p>
              <p className="text-xs text-muted-foreground mt-1">Resumes created</p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="col-span-1 bg-card/50 border-border/50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-chart-4/20">
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold">
                {
                  recentActivity.filter((a) => {
                    const date = new Date(a.created_at)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">Optimizations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary CTA - Highlighted for new users */}
            <Link href="/app" className="block mb-4">
              <Card
                id="optimize-cta-card"
                className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border-primary/40 overflow-hidden relative cursor-pointer hover:border-primary/60 transition-all hover:shadow-xl hover:shadow-primary/20 group animate-cta-glow"
              >
                <div className="absolute inset-0 bg-[url('/abstract-gradient-mesh.jpg')] opacity-5" />
                {/* Animated glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
                <CardContent className="p-6 sm:p-8 relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-4">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                        AI-Powered
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        Optimize Your Resume
                      </h2>
                      <p className="text-muted-foreground text-sm sm:text-base max-w-md">
                        Upload your resume and job description to get a tailored, ATS-friendly version in seconds.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <MousePointer2 className="w-5 h-5 animate-bounce" />
                      <span>Start Optimizing</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Quick Actions Grid */}
            <div className="mt-6 sm:mt-8">
              <h3 className="text-lg font-semibold mb-4 mt-4 sm:mt-0">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card
                  className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => setHistoryDialogOpen(true)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <History className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          Resume History
                        </h4>
                        <p className="text-sm text-muted-foreground">View and download past optimizations</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <Link href="/settings">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors">
                          <Settings className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            Account Settings
                          </h4>
                          <p className="text-sm text-muted-foreground">Manage profile and preferences</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>

                <Card
                  className="group cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 sm:col-span-2 bg-gradient-to-r from-primary/5 to-accent/5"
                  onClick={() => router.push("/plans")}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/20 group-hover:bg-primary/30 transition-colors">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          View All Plans
                        </h4>
                        <p className="text-sm text-muted-foreground">Compare all available packages and features</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Credits */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() => setHistoryDialogOpen(true)}
                  >
                    View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.job_title || "Resume Optimization"}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.company_name || "No company specified"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No optimizations yet</p>
                    <Button asChild size="sm" variant="outline" className="rounded-lg bg-transparent">
                      <Link href="/app">Create your first resume</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credits Card (for free users) */}
            {!isPro && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-4xl font-bold">{credits}</span>
                      <span className="text-muted-foreground text-sm mb-1">remaining</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                        style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <Button className="w-full rounded-lg" size="sm" onClick={() => setCheckoutProduct("credits-10")}>
                      <Zap className="w-4 h-4 mr-2" />
                      Buy 10 Credits
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full rounded-lg bg-transparent"
                      size="sm"
                      onClick={() => setCheckoutProduct("pro-monthly")}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pro Badge (for pro users) */}
            {isPro && (
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Pro Member</h4>
                      <p className="text-xs text-muted-foreground">Unlimited access</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Unlimited resume optimizations</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Download className="w-4 h-4 text-primary" />
                      <span>PDF & DOCX downloads</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Interview guides included</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutProduct && (
        <Checkout
          productId={checkoutProduct}
          open={!!checkoutProduct}
          onOpenChange={(open) => !open && setCheckoutProduct(null)}
        />
      )}

      {/* History Dialog */}
      <HistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={user}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={dashboardTutorialSteps}
        isActive={showTutorial}
        onComplete={completeTutorial}
        onSkip={completeTutorial}
        storageKey="dashboard-tutorial-completed"
      />
    </div>
  )
}
