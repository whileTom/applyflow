"use client"

import type React from "react"
import { useRef } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  AlertCircle,
  Upload,
  FileText,
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  Settings,
  LogOut,
  Crown,
  Zap,
  Star,
  History,
  UserIcon,
  Trash2,
} from "lucide-react"
import { HistoryDialog } from "./history-dialog"
import { ResumeStyleOptionsCard, getDefaultStyleOptions, type ResumeStyleOptions } from "./resume-style-options"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Checkout } from "./checkout"
import { PricingDialog } from "./pricing-dialog"
import type { User } from "@/types/user" // Declare the User variable
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileDialog } from "./profile-dialog"
import { encodeToBase64 } from "@/lib/encoding"
import { TutorialOverlay, PersistentGuide, useTutorial, type TutorialStep } from "@/components/tutorial-overlay"

interface DebugLog {
  timestamp: string
  type: "info" | "success" | "error" | "request" | "response"
  message: string
  data?: string
}

interface OptimizeResponse {
  optimizedResume?: string
  pdfBase64?: string
  interviewGuidePdfBase64?: string
  error?: string
  logs?: Array<{ type: string; message: string; data?: string }>
  debug?: {
    prompt: string
    resumeTextLength: number
    jobDescriptionLength: number
    responseLength?: number
    processingTime?: number
    model: string
    paragraphCount?: number
    extractedResumePreview: string
    skillsCount?: number
    experienceCount?: number
  }
  success?: boolean
  creditsRemaining?: number
  jobTitle?: string
  companyName?: string
}

const PAGE_LOAD_TIMESTAMP = Date.now()

// Resume optimizer tutorial steps
const optimizerTutorialSteps: TutorialStep[] = [
  {
    id: "upload-resume",
    targetSelector: "#resume-upload-section",
    title: "Step 1: Upload Your Resume",
    description:
      "First, upload your resume in .docx format. You can click the file input to select a file from your computer, or drag and drop it here.",
    position: "right",
    action: "upload",
    highlightPadding: 12,
  },
  {
    id: "paste-job-description",
    targetSelector: "#job-description-textarea",
    title: "Step 2: Paste the Job Description",
    description:
      "Copy and paste the full job description from the job posting. The more details you include, the better the AI can tailor your resume.",
    position: "right",
    action: "input",
    highlightPadding: 12,
  },
  {
    id: "optimize-button",
    targetSelector: "#optimize-button",
    title: "Step 3: Click Optimize",
    description:
      "Once you have uploaded your resume and pasted the job description, click this button to generate your tailored, ATS-friendly resume!",
    position: "top",
    action: "click",
    highlightPadding: 8,
  },
]

interface ResumeOptimizerProps {
  user?: User
  defaultResumeUrl?: string
  savedApiKey?: string
  subscriptionStatus?: string
  creditsRemaining?: number
  avatarUrl?: string | null
  userProfile?: {
    avatar_url: string | null
    full_name: string | null
    email: string
  } // Added userProfile prop
}

export function ResumeOptimizer({
  user,
  defaultResumeUrl,
  savedApiKey: initialApiKey,
  subscriptionStatus = "free",
  creditsRemaining: initialCredits = 0,
  avatarUrl: initialAvatarUrl = null,
  userProfile, // Destructure userProfile
}: ResumeOptimizerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [optimizedResume, setOptimizedResume] = useState("")
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [interviewGuideBlob, setInterviewGuideBlob] = useState<Blob | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [apiKey, setApiKey] = useState(initialApiKey || "")
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false)
  const [uploadExpanded, setUploadExpanded] = useState(false)
  const [defaultResume, setDefaultResume] = useState<{ name: string; data: string } | null>(null)
  const [useDefaultResume, setUseDefaultResume] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [promptSent, setPromptSent] = useState("")
  const [rawResponse, setRawResponse] = useState("")
  const [optionsOpen, setOptionsOpen] = useState(false)
  const dialogFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash")
  const [embellishmentLevel, setEmbellishmentLevel] = useState(10)
  const [styleOptions, setStyleOptions] = useState<ResumeStyleOptions>(getDefaultStyleOptions())
  const [checkoutProduct, setCheckoutProduct] = useState<string | null>(null)
  const [credits, setCredits] = useState(initialCredits)
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null)
  const [interviewGuidePdf, setInterviewGuidePdf] = useState<string | null>(null)
  const [extractedJobTitle, setExtractedJobTitle] = useState<string | null>(null)
  const [extractedCompanyName, setExtractedCompanyName] = useState<string | null>(null)
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [savedResumes, setSavedResumes] = useState<Array<{ id: string; name: string; is_default: boolean }>>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [historyOpen, setHistoryOpen] = useState(false) // State for history dialog
  const [profileOpen, setProfileOpen] = useState(false) // Added profile dialog state
  const isPro = subscriptionStatus === "pro"
  const canOptimize = isPro || credits > 0

  // Tutorial state
  const { showTutorial, completeTutorial, hasCompletedTutorial } = useTutorial("optimizer-tutorial-completed")

  // Persistent guide state - shows after tutorial or for returning users
  const [currentGuideStep, setCurrentGuideStep] = useState<number>(0)
  const showPersistentGuide = hasCompletedTutorial && !isLoading && !optimizedResume

  // Update persistent guide based on what's filled in
  useEffect(() => {
    if (!showPersistentGuide) return

    if (!resumeFile) {
      setCurrentGuideStep(0) // "Upload your resume"
    } else if (!jobDescription.trim()) {
      setCurrentGuideStep(1) // "Paste the job description"
    } else {
      setCurrentGuideStep(2) // "Click optimize"
    }
  }, [showPersistentGuide, resumeFile, jobDescription])

  const fetchSavedResumes = async () => {
    try {
      const res = await fetch("/api/user-resumes")
      const data = await res.json()
      if (data.resumes) {
        setSavedResumes(data.resumes)
        const defaultResumeFromDb = data.resumes.find((r: { is_default: boolean }) => r.is_default)
        if (defaultResumeFromDb && !resumeFile) {
          loadSavedResume(defaultResumeFromDb.id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch saved resumes:", err)
    }
  }

  useEffect(() => {
    if (defaultResumeUrl) {
      loadFromUrl(defaultResumeUrl)
    }

    const savedModel = localStorage.getItem("selectedModel")
    if (savedModel) {
      setSelectedModel(savedModel)
    }

    const savedEmbellishment = localStorage.getItem("embellishmentLevel")
    if (savedEmbellishment) {
      setEmbellishmentLevel(Number.parseInt(savedEmbellishment, 10))
    }

    fetchSavedResumes()
  }, [defaultResumeUrl])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("/api/user/profile")
        const data = await res.json()
        if (data.profile?.avatar_url) {
          console.log("[v0] User profile avatar fetched:", data.profile.avatar_url)
          setAvatarUrl(data.profile.avatar_url)
        }
      } catch (err) {
        console.error("[v0] Failed to fetch user profile avatar:", err)
      }
    }

    if (user && !avatarUrl) {
      fetchUserProfile()
    }
  }, [user, avatarUrl])

  const loadFromUrl = async (url: string) => {
    try {
      addLog("info", "Fetching resume from URL...")
      const fetchUrl = url.includes("?") ? `${url}&t=${PAGE_LOAD_TIMESTAMP}` : `${url}?t=${PAGE_LOAD_TIMESTAMP}`
      const response = await fetch(fetchUrl, { cache: "no-store" })

      if (!response.ok) {
        throw new Error(`Failed to fetch resume: ${response.status}`)
      }

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)

      let binary = ""
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Data = encodeToBase64(binary)

      const fileName = "default-resume.docx"
      const file = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      setResumeFile(file)
      setDefaultResume({ name: fileName, data: base64Data })
      setUseDefaultResume(true)
      addLog("success", "Loaded resume from URL", fileName)
    } catch (error) {
      addLog("error", "Failed to load resume from URL", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const clearDefaultResume = () => {
    setDefaultResume(null)
    setResumeFile(null)
    setUseDefaultResume(false)
    addLog("info", "Default resume cleared")
  }

  const loadDefaultResume = () => {
    if (!defaultResume) return
    const binaryString = atob(defaultResume.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    const file = new File([blob], defaultResume.name, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    setResumeFile(file)
    setUseDefaultResume(true)
    addLog("info", "Using default resume", defaultResume.name)
  }

  const addLog = (type: DebugLog["type"], message: string, data?: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
    setDebugLogs((prev) => [...prev, { timestamp, type, message, data }])
  }

  const clearLogs = () => {
    setDebugLogs([])
    setPromptSent("")
    setRawResponse("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".docx")) {
        setError("Please upload a .docx file")
        addLog("error", "Invalid file type", `File "${file.name}" is not a .docx file`)
        return
      }
      setResumeFile(file)
      setError("")
      addLog("info", "File selected", `Name: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB`)
    }
  }

  const handleOptimize = async () => {
    if (!canOptimize) {
      setError("You need credits or a Pro subscription to optimize resumes")
      return
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description")
      return
    }

    if (!resumeFile) {
      setError("Please upload a resume file")
      return
    }

    setIsLoading(true)
    setError("")
    setOptimizedResume("")
    setPdfBlob(null)
    setInterviewGuideBlob(null)
    clearLogs()

    addLog("info", "Starting resume optimization...")
    addLog("info", "Preparing request", `Job description: ${jobDescription.length} chars, File: ${resumeFile.name}`)
    addLog("info", "Embellishment level", `${embellishmentLevel} (${embellishmentLevel * 10}%)`)

    try {
      const formData = new FormData()
      formData.append("jobDescription", jobDescription)
      formData.append("resume", resumeFile)
      formData.append("model", selectedModel)
      formData.append("embellishmentLevel", embellishmentLevel.toString())
      formData.append("styleOptions", JSON.stringify(styleOptions))
      if (styleOptions.includePhoto && avatarUrl) {
        console.log("[v0] Including avatar in resume generation:", avatarUrl)
        formData.append("avatarUrl", avatarUrl)
      }
      if (apiKey.trim()) {
        formData.append("apiKey", apiKey.trim())
      }

      addLog("request", "Sending request to /api/optimize-resume")
      const startTime = Date.now()

      const response = await fetch("/api/optimize-resume", {
        method: "POST",
        body: formData,
      })

      const elapsed = Date.now() - startTime
      addLog("info", `Response received in ${elapsed}ms`, `Status: ${response.status}`)

      const contentType = response.headers.get("content-type")
      let data: OptimizeResponse

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // Response is not JSON - likely a server error
        const textResponse = await response.text()
        addLog("error", "Server returned non-JSON response", textResponse.substring(0, 200))
        throw new Error(`Server error: ${textResponse.substring(0, 100)}`)
      }

      if (data.logs && data.logs.length > 0) {
        for (const serverLog of data.logs) {
          const logType = serverLog.type as DebugLog["type"]
          addLog(logType, `[SERVER] ${serverLog.message}`, serverLog.data)
        }
      }

      if (data.debug) {
        setPromptSent(data.debug.prompt)
        if (data.debug.extractedResumePreview) {
          addLog("info", "Resume preview (first 500 chars)", data.debug.extractedResumePreview)
        }
      }

      if (!response.ok) {
        addLog("error", "Request failed", data.error || "Unknown error")
        throw new Error(data.error || "Failed to optimize resume")
      }

      if (data.optimizedResume) {
        setOptimizedResume(data.optimizedResume)
        setRawResponse(data.optimizedResume)
        addLog("success", "AI rewrite completed", `Output: ${data.optimizedResume.length} characters`)
      }

      if (data.pdfBase64) {
        const binaryString = atob(data.pdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: "application/pdf",
        })
        setPdfBlob(blob)
        addLog("success", "PDF generated", `Created ${(blob.size / 1024).toFixed(2)} KB file`)
      }

      if (data.interviewGuidePdfBase64) {
        const binaryString = atob(data.interviewGuidePdfBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: "application/pdf",
        })
        setInterviewGuideBlob(blob)
        addLog("success", "Interview guide generated", `Created ${(blob.size / 1024).toFixed(2)} KB file`)
      }

      if (data.success) {
        setGeneratedPdf(data.pdfBase64)
        setInterviewGuidePdf(data.interviewGuidePdfBase64)
        setExtractedJobTitle(data.jobTitle)
        setExtractedCompanyName(data.companyName)
        if (data.creditsRemaining !== undefined && data.creditsRemaining >= 0) {
          setCredits(data.creditsRemaining)
        }
      }

      if (!isPro && credits > 0) {
        setCredits((prev) => prev - 1)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMsg)
      addLog("error", "Optimization failed", errorMsg)
    } finally {
      setIsLoading(false)
      addLog("info", "Request completed")
    }
  }

  const handleDownload = () => {
    if (!pdfBlob) return

    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `optimized-resume-${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadInterviewGuide = () => {
    if (!interviewGuideBlob) return

    const url = URL.createObjectURL(interviewGuideBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interview-guide-${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLogColor = (type: DebugLog["type"]) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "request":
        return "text-blue-400"
      case "response":
        return "text-purple-400"
      default:
        return "text-zinc-400"
    }
  }

  const getLogPrefix = (type: DebugLog["type"]) => {
    switch (type) {
      case "success":
        return "[SUCCESS]"
      case "error":
        return "[ERROR]"
      case "request":
        return "[REQUEST]"
      case "response":
        return "[RESPONSE]"
      default:
        return "[INFO]"
    }
  }

  const loadSavedResume = async (id: string) => {
    setLoadingResumes(true)
    try {
      const res = await fetch(`/api/user-resumes/${id}`)
      const data = await res.json()
      if (data.resume) {
        setDefaultResume({ name: data.resume.name, data: data.resume.file_data })
        setUseDefaultResume(true)
        addLog("success", "Resume loaded", data.resume.name)
        toast({
          title: "Resume loaded",
          description: `Loaded "${data.resume.name}" for optimization.`,
        })
      }
    } catch (err) {
      console.error("Failed to load resume:", err)
      toast({
        title: "Failed to load resume",
        description: "Could not load the selected resume.",
        variant: "destructive",
      })
    } finally {
      setLoadingResumes(false)
    }
  }

  const saveResumeToDatabase = async (name: string, fileData: string, setAsDefault = false) => {
    try {
      const res = await fetch("/api/user-resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fileData, setAsDefault }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh saved resumes list
        const listRes = await fetch("/api/user-resumes")
        const listData = await listRes.json()
        if (listData.resumes) {
          setSavedResumes(listData.resumes)
        }
        toast({
          title: "Resume saved",
          description: `"${name}" has been saved to your account.`,
        })
      }
    } catch (err) {
      console.error("Failed to save resume:", err)
    }
  }

  const handleDialogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".docx")) {
      addLog("error", "Invalid file type", "Please upload a .docx file")
      return
    }

    try {
      addLog("info", "Processing resume upload...", file.name)

      const arrayBuffer = await file.arrayBuffer()
      const base64 = encodeToBase64(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
      )
      const saved = { name: file.name, data: base64 }
      setDefaultResume(saved)
      setResumeFile(file)
      setUseDefaultResume(true)

      // Save to database
      await saveResumeToDatabase(file.name, base64, true)

      addLog("success", "Resume loaded successfully", file.name)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addLog("error", "Failed to load resume", errorMessage)
    }

    if (dialogFileInputRef.current) {
      dialogFileInputRef.current.value = ""
    }
  }

  const getEmbellishmentLabel = (level: number) => {
    if (level === 0) return "Pure Enhancement"
    if (level <= 2) return "Minor Polish"
    if (level <= 4) return "Light Embellishment"
    if (level <= 6) return "Moderate Enhancement"
    if (level <= 8) return "Heavy Embellishment"
    if (level <= 10) return "Maximum Creativity"
    if (level === 11) return "Extreme Fabrication"
    return "Full Fabrication"
  }

  const handleEmbellishmentChange = (value: number[]) => {
    const level = value[0]
    setEmbellishmentLevel(level)
    localStorage.setItem("embellishmentLevel", level.toString())
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh() // Added profile refresh handler
  }

  const handleProfileUpdate = async () => {
    try {
      const res = await fetch("/api/user/profile")
      const data = await res.json()
      if (data.profile?.avatar_url) {
        console.log("[v0] Avatar updated from profile:", data.profile.avatar_url)
        setAvatarUrl(data.profile.avatar_url)
      }
    } catch (err) {
      console.error("[v0] Failed to refresh avatar:", err)
    }
  }

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel)
    localStorage.setItem("selectedModel", newModel)
    addLog("info", "Model changed", `Switched to ${newModel}`)
  }

  const toggleDefaultResume = async (resumeId: string, currentIsDefault: boolean) => {
    const newIsDefault = !currentIsDefault

    // Optimistically update UI immediately
    setSavedResumes((prevResumes) =>
      prevResumes.map((resume) => ({
        ...resume,
        is_default: resume.id === resumeId ? newIsDefault : false,
      })),
    )

    // Show toast notification immediately
    toast({
      title: newIsDefault ? "Default resume set" : "Default removed",
      description: newIsDefault
        ? "This resume will be used by default for future optimizations"
        : "This resume is no longer your default",
    })

    // Fire API request asynchronously in the background
    fetch("/api/user-resumes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: resumeId,
        setAsDefault: newIsDefault,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update default resume")
        }
      })
      .catch((error) => {
        console.error("Error toggling default resume:", error)
        // Revert optimistic update on error
        fetchSavedResumes()
        toast({
          title: "Error",
          description: "Failed to update default resume. Changes reverted.",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
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
              {/* Credits indicator */}
              {user && (
                <>
                  {isPro ? (
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-xs"
                      onClick={() => setShowPricingDialog(true)}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {credits} credits
                    </Button>
                  )}
                </>
              )}

              {/* Resume History button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHistoryOpen(true)}
                className="rounded-2xl h-10 w-10 sm:h-12 sm:w-12 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 shadow-lg shadow-primary/5"
              >
                <History className="w-4 h-4 sm:w-5 h-5 text-muted-foreground" />
                <span className="sr-only">Resume History</span>
              </Button>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl || "/placeholder.svg"}
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
                    <p className="text-sm font-medium">{userProfile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="cursor-pointer">
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

      <div className="container mx-auto py-6 sm:py-10 px-4 max-w-7xl">
        {/* Options Dialog */}
        <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl bg-card/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Options</DialogTitle>
              <DialogDescription className="text-muted-foreground/80">
                Configure your API key and resume settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <AlertCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">API Key</h4>
                    <p className="text-xs text-muted-foreground/70">
                      {apiKey.trim() ? "Custom API key configured" : "Using default API key"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Leave empty to use default key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-12 rounded-xl h-11 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg hover:bg-primary/10 hover:border-primary/50 shadow-lg shadow-primary/5"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <>
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  For permanent API key storage, go to{" "}
                  <Link href="/settings" className="text-primary hover:underline">
                    Settings
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Resume</h4>
                    <p className="text-xs text-muted-foreground/70">
                      {defaultResume
                        ? `Using: ${defaultResume.name}`
                        : defaultResumeUrl
                          ? "Loading from your default URL..."
                          : "No default resume configured"}
                    </p>
                  </div>
                </div>

                <input
                  type="file"
                  accept=".docx"
                  ref={dialogFileInputRef}
                  onChange={handleDialogFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => dialogFileInputRef.current?.click()}
                    variant="outline"
                    className="w-full rounded-xl h-10 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent justify-start"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Resume
                  </Button>

                  {savedResumes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Saved Resumes</Label>
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                        {savedResumes.map((resume) => (
                          <div key={resume.id} className="flex items-center gap-2">
                            <Button
                              onClick={() => toggleDefaultResume(resume.id, resume.is_default)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 hover:bg-transparent"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  resume.is_default ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/50"
                                }`}
                              />
                            </Button>
                            <Button
                              onClick={() => loadSavedResume(resume.id)}
                              variant="outline"
                              disabled={loadingResumes}
                              className={`flex-1 rounded-xl h-9 text-xs justify-start bg-transparent ${
                                resume.is_default ? "border-primary/50 bg-primary/5" : "border-border/50"
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 mr-2" />
                              {resume.name}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {defaultResumeUrl && (
                    <Button
                      onClick={() => loadFromUrl(defaultResumeUrl)}
                      variant="outline"
                      className="w-full rounded-xl h-10 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent justify-start"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reload from Default URL
                    </Button>
                  )}

                  {defaultResume && (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={clearDefaultResume}
                        variant="outline"
                        className="w-full rounded-xl h-10 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 bg-transparent justify-start text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Current Resume
                      </Button>
                    </div>
                  )}
                </div>

                {!defaultResumeUrl && savedResumes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Set a default resume URL in{" "}
                    <Link href="/settings" className="text-primary hover:underline">
                      Settings
                    </Link>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">AI Model</h4>
                    <p className="text-xs text-muted-foreground/70">Select the Gemini model to use for optimization</p>
                  </div>
                </div>

                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                    <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash Preview</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">
                  Different models offer varying speed, quality, and cost trade-offs.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Embellishment Level Card */}
        <Card className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
          <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-foreground">Embellishment Level</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Adjust how much AI enhances your resume content
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 text-foreground border border-primary/20">
                    {getEmbellishmentLabel(embellishmentLevel)}
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Enhancements</p>
                    <p className="text-lg font-semibold text-primary">{embellishmentLevel * 10}%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground">Pure Enhancement</span>
                  <span className="text-xs text-muted-foreground">Full Fabrication</span>
                </div>
                <Slider
                  value={[embellishmentLevel]}
                  onValueChange={handleEmbellishmentChange}
                  min={0}
                  max={11}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between px-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((tick) => (
                    <div
                      key={tick}
                      className={`h-1.5 w-px ${embellishmentLevel === tick ? "bg-primary" : "bg-muted-foreground/20"}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {getEmbellishmentDescription(embellishmentLevel)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Left Column - Job Description + Current Resume */}
          <div className="space-y-4 sm:space-y-6">
            {/* Job Description Card */}
            <Card className="rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border-border/50 shadow-xl shadow-primary/5">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <Upload className="w-5 h-5 text-accent" />
                  </div>
                  Job Description
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Paste the job description you want to tailor your resume for
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <Textarea
                  id="job-description-textarea"
                  placeholder={`Paste full job description text here...

Position Title: Associate Operations Specialist

CoreDynamics Corp is seeking a dedicated professional to join our regional team. In this role, you will be responsible for supporting daily business activities and ensuring that internal processes are executed according to company standards.

Beyond daily tasks, you will be expected to analyze performance data and provide regular reports to management regarding project status. You will help identify areas for procedural improvement and assist in the implementation of new corporate initiatives.

Required Skills:
• Proficiency in standard office software and data entry
• Strong verbal and written communication abilities
• Capacity for critical thinking and problem-solving
• Effective time management and task prioritization
• Ability to work both independently and within a team
`}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-[250px] sm:h-[300px] rounded-xl sm:rounded-2xl bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 resize-none whitespace-pre-wrap"
                />
              </CardContent>
            </Card>

            {/* Current Resume Card */}
            <Card
              id="resume-upload-section"
              className="rounded-2xl sm:rounded-3xl border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5"
            >
              <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        Current Resume
                        {defaultResume?.is_default && <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
                      </h3>
                      <p className="text-sm text-muted-foreground/80">
                        {resumeFile ? resumeFile.name : "Upload your resume in .docx format"}
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".docx"
                      onChange={handleFileChange}
                      className="w-auto max-w-[200px] rounded-xl border-border/50 hidden sm:block"
                    />
                  </div>

                  {/* Mobile file input */}
                  <Input
                    type="file"
                    accept=".docx"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border-border/50 sm:hidden"
                  />
                </div>

                {error && (
                  <div className="mt-4 p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>
<CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6 [&_button]:!w-full">
  <Button
    id="optimize-button"
    onClick={handleOptimize}
    disabled={isLoading || !jobDescription.trim() || !resumeFile || !canOptimize}
    className="!w-full h-10 sm:h-11 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5b6fc9] via-[#4a7fc9] to-[#00bcd4] hover:from-[#5062b8] hover:via-[#3d6fb8] hover:to-[#00a3b8] shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : !canOptimize ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Get Credits to Continue
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Optimize Resume
                      {!isPro && credits !== null && ` (${credits} credits)`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results + Resume Style */}
          <div className="space-y-4 sm:space-y-6">
            {/* Optimized Resume Card */}
            <Card className="rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border-border/50 shadow-xl shadow-primary/5">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <CardTitle className="text-lg">Optimized Resume</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      {pdfBlob ? "Your resume is ready to download" : "Your AI-optimized resume will appear here"}
                    </CardDescription>
                  </div>
                  {pdfBlob && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button
                        onClick={handleDownload}
                        className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Resume PDF
                      </Button>
                      {interviewGuideBlob && (
                        <Button
                          onClick={handleDownloadInterviewGuide}
                          variant="outline"
                          className="border-primary/30 hover:bg-primary/10 font-semibold py-3 rounded-xl transition-all duration-300 bg-transparent"
                        >
                          <FileText className="w-5 h-5 mr-2" />
                          Interview Guide
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Resume Style Options Card */}
            <ResumeStyleOptionsCard
              value={styleOptions}
              onChange={setStyleOptions}
              hasHeadshot={!!avatarUrl}
              onToast={(message) => {
                toast({ title: message })
                addLog("info", message)
              }}
            />
          </div>
        </div>

        {/* Debug Output Card */}
        <Card className="rounded-2xl sm:rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
          <CardHeader className="px-4 sm:px-6">
            <div
              className="flex items-center justify-between cursor-pointer rounded-xl p-2 -m-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-colors"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <AlertCircle className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="text-lg">Debug Output</CardTitle>
                <span className="text-xs bg-primary/10 px-3 py-1 rounded-full text-primary font-medium">
                  {debugLogs.length} logs
                </span>
              </div>
              <div className="flex items-center gap-3">
                {debugLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearLogs()
                    }}
                    className="text-xs rounded-xl hover:bg-destructive/10 hover:text-destructive"
                  >
                    Clear
                  </Button>
                )}
                <div className="p-1 rounded-lg bg-muted/50">
                  {showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
            <CardDescription className="text-muted-foreground/80 mt-2">
              View detailed information about XML parsing, AI request, and response
            </CardDescription>
          </CardHeader>

          {showDebugPanel && (
            <CardContent className="space-y-5 pt-2 px-4 sm:px-6">
              <div className="bg-background/80 rounded-2xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-border/30">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground/50">Logs will appear here when you optimize a resume...</p>
                ) : (
                  <div className="space-y-1.5">
                    {debugLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-muted-foreground/50 shrink-0">{log.timestamp}</span>
                        <span className={`shrink-0 ${getLogColor(log.type)}`}>{getLogPrefix(log.type)}</span>
                        <span className="text-foreground">{log.message}</span>
                        {log.data && (
                          <span className="text-muted-foreground/70 whitespace-pre-wrap break-all">{log.data}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Checkout Modal */}
        {checkoutProduct && (
          <Checkout
            productId={checkoutProduct}
            open={!!checkoutProduct}
            onOpenChange={(open) => !open && setCheckoutProduct(null)}
          />
        )}

        {/* Pricing Dialog */}
        {showPricingDialog && <PricingDialog open={showPricingDialog} onOpenChange={setShowPricingDialog} />}

        {/* History Dialog */}
        <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />

        {user && (
          <ProfileDialog
            open={profileOpen}
            onOpenChange={setProfileOpen}
            user={user}
            profile={
              userProfile
                ? {
                    id: user.id,
                    email: user.email || "",
                    full_name: userProfile.full_name,
                    subscription_status: subscriptionStatus,
                    credits_remaining: credits, // Fixed: use credits state instead of creditsRemaining
                    default_resume_url: defaultResumeUrl || null,
                    google_api_key: null,
                    avatar_url: userProfile.avatar_url,
                  }
                : null
            }
            onProfileUpdate={handleProfileUpdate}
          />
        )}

        {/* Tutorial Overlay */}
        <TutorialOverlay
          steps={optimizerTutorialSteps}
          isActive={showTutorial}
          onComplete={completeTutorial}
          onSkip={completeTutorial}
          storageKey="optimizer-tutorial-completed"
        />

        {/* Persistent Guide - shows subtle hints after tutorial is completed */}
        {showPersistentGuide && currentGuideStep === 0 && (
          <PersistentGuide
            targetSelector="#resume-upload-section"
            message="Upload your resume"
            isVisible={true}
            position="bottom"
          />
        )}
        {showPersistentGuide && currentGuideStep === 1 && (
          <PersistentGuide
            targetSelector="#job-description-textarea"
            message="Paste the job description"
            isVisible={true}
            position="bottom"
          />
        )}
        {showPersistentGuide && currentGuideStep === 2 && (
          <PersistentGuide
            targetSelector="#optimize-button"
            message="Click to optimize!"
            isVisible={true}
            position="top"
          />
        )}
      </div>
    </div>
  )
}

// Helper function for embellishment descriptions
function getEmbellishmentDescription(level: number): string {
  const descriptions: Record<number, string> = {
    0: "Only enhances grammar, structure, and formatting without adding content.",
    1: "Minor improvements to phrasing while staying completely true to original content.",
    2: "Enhances descriptions with stronger action verbs while maintaining factual accuracy.",
    3: "Adds context and detail to existing experiences based on standard practices.",
    4: "Expands bullet points with reasonable inferences about responsibilities.",
    5: "Moderately enhances accomplishments with plausible metrics and outcomes.",
    6: "Creates impressive but believable achievements aligned with role level.",
    7: "Significantly embellishes with industry-standard accomplishments and skills.",
    8: "Creates compelling narratives that go beyond original experiences.",
    9: "Extensively fabricates impressive qualifications matching the job perfectly.",
    10: "Maximum creativity while maintaining core truthfulness of background.",
    11: "Complete creative license - creates the perfect resume for the job, preserving only personal details.",
  }
  return descriptions[level] || ""
}
