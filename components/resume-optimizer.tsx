"use client"

import type React from "react"
import { useRef } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  Eye,
  EyeOff,
  Info,
  ChevronDown,
  ChevronRight,
  Settings,
  Save,
  Trash2,
  Key,
} from "lucide-react"

interface DebugLog {
  timestamp: string
  type: "info" | "success" | "error" | "request" | "response"
  message: string
  data?: string
}

interface OptimizeResponse {
  optimizedResume?: string
  docxBase64?: string
  error?: string
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
}

const GOOGLE_DRIVE_DOC_ID = "1Fug64SHhgdp99G7mhp07uu7X76xAWV4otudRiBwdQ5M"

export function ResumeOptimizer() {
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [optimizedResume, setOptimizedResume] = useState("")
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false)
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null)
  const [uploadExpanded, setUploadExpanded] = useState(false)
  const [defaultResume, setDefaultResume] = useState<{ name: string; data: string } | null>(null)
  const [useDefaultResume, setUseDefaultResume] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [promptSent, setPromptSent] = useState("")
  const [rawResponse, setRawResponse] = useState("")
  const [optionsOpen, setOptionsOpen] = useState(false)
  const dialogFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadDefaultResume = async () => {
      const saved = localStorage.getItem("defaultResume")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setDefaultResume(parsed)
          const binary = atob(parsed.data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          const file = new File([bytes], parsed.name, {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          })
          setResumeFile(file)
          setUseDefaultResume(true)
          addLog("info", "Using saved default resume", parsed.name)
        } catch {
          localStorage.removeItem("defaultResume")
        }
      }
    }
    loadDefaultResume()

    const savedKey = localStorage.getItem("geminiApiKey")
    if (savedKey) {
      setSavedApiKey(savedKey)
      setApiKey(savedKey)
    }
  }, [])

  const saveAsDefault = async () => {
    if (!resumeFile) return

    try {
      addLog("info", "Uploading resume as global default...", resumeFile.name)

      const formData = new FormData()
      formData.append("resume", resumeFile)

      const response = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload resume")
      }

      // Also save locally for quick access
      const arrayBuffer = await resumeFile.arrayBuffer()
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""))
      const saved = { name: resumeFile.name, data: base64 }
      localStorage.setItem("defaultResume", JSON.stringify(saved))
      setDefaultResume(saved)

      addLog("success", "Resume saved as global default for all users", resumeFile.name)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addLog("error", "Failed to save default resume", errorMessage)
      setError(`Failed to save default resume: ${errorMessage}`)
    }
  }

  const clearDefaultResume = () => {
    localStorage.removeItem("defaultResume")
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

  const loadFromGoogleDrive = async () => {
    try {
      addLog("info", "Fetching resume from Google Drive...")
      const exportUrl = `https://docs.google.com/document/d/${GOOGLE_DRIVE_DOC_ID}/export?format=docx`
      const response = await fetch(exportUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch from Google Drive: ${response.status}`)
      }

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)

      // Convert to base64 for storage
      let binary = ""
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64Data = btoa(binary)

      const fileName = "google-drive-resume.docx"
      const file = new File([blob], fileName, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      setResumeFile(file)
      setDefaultResume({ name: fileName, data: base64Data })
      setUseDefaultResume(true)
      addLog("success", "Loaded resume from Google Drive", fileName)
    } catch (error) {
      addLog("error", "Failed to load from Google Drive", error instanceof Error ? error.message : "Unknown error")
    }
  }

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("geminiApiKey", apiKey.trim())
      setSavedApiKey(apiKey.trim())
      addLog("success", "API key saved to browser storage")
    }
  }

  const clearSavedApiKey = () => {
    localStorage.removeItem("geminiApiKey")
    setSavedApiKey(null)
    setApiKey("")
    addLog("info", "Saved API key cleared")
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
    setDocxBlob(null)
    clearLogs()

    addLog("info", "Starting resume optimization...")
    addLog("info", "Preparing request", `Job description: ${jobDescription.length} chars, File: ${resumeFile.name}`)

    try {
      const formData = new FormData()
      formData.append("jobDescription", jobDescription)
      formData.append("resume", resumeFile)
      if (apiKey.trim()) {
        formData.append("apiKey", apiKey)
      }

      addLog("request", "Sending request to /api/optimize-resume")
      addLog("info", "Parsing DOCX XML structure for semantic rewrite...")
      const startTime = Date.now()

      const response = await fetch("/api/optimize-resume", {
        method: "POST",
        body: formData,
      })

      const elapsed = Date.now() - startTime
      addLog("info", `Response received in ${elapsed}ms`, `Status: ${response.status} ${response.statusText}`)

      const data: OptimizeResponse = await response.json()

      if (data.debug) {
        setPromptSent(data.debug.prompt)
        addLog("info", "Document XML parsed", `Extracted ${data.debug.paragraphCount || 0} paragraphs`)
        if (data.debug.skillsCount !== undefined) {
          addLog("info", "Skills extracted", `${data.debug.skillsCount} individual skills`)
        }
        if (data.debug.experienceCount !== undefined) {
          addLog("info", "Experience entries", `${data.debug.experienceCount} positions`)
        }
        addLog("info", "Text extracted", `${data.debug.resumeTextLength} characters from resume`)
        addLog("info", "Model used", data.debug.model)
        if (data.debug.processingTime) {
          addLog("info", "AI processing time", `${data.debug.processingTime}ms`)
        }
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

      if (data.docxBase64) {
        const binaryString = atob(data.docxBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })
        setDocxBlob(blob)
        addLog("success", "DOCX generated", `Preserved formatting in ${(blob.size / 1024).toFixed(2)} KB file`)
        addLog("info", "Semantic rewrite complete - formatting preserved from original document")
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
    if (!docxBlob) return

    const url = URL.createObjectURL(docxBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `optimized-resume-${new Date().toISOString().split("T")[0]}.docx`
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

  const handleDialogFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".docx")) {
      addLog("error", "Invalid file type", "Please upload a .docx file")
      return
    }

    try {
      addLog("info", "Processing default resume upload...", file.name)

      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""))
      const saved = { name: file.name, data: base64 }
      localStorage.setItem("defaultResume", JSON.stringify(saved))
      setDefaultResume(saved)

      // Also set as current file
      setResumeFile(file)
      setUseDefaultResume(true)

      addLog("success", "Default resume saved successfully", file.name)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      addLog("error", "Failed to save default resume", errorMessage)
    }

    // Reset input
    if (dialogFileInputRef.current) {
      dialogFileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-10 px-4 max-w-7xl">
        <div className="flex justify-end mb-4">
          <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl h-12 w-12 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 shadow-lg shadow-primary/5"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="sr-only">Options</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-3xl bg-card/95 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Options</DialogTitle>
                <DialogDescription className="text-muted-foreground/80">
                  Configure your API key and default resume settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* API Key Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">API Key</h4>
                      <p className="text-xs text-muted-foreground/70">
                        {savedApiKey
                          ? "Saved API key configured"
                          : apiKey.trim()
                            ? "Custom key entered (not saved)"
                            : "Using default API key"}
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg hover:bg-primary/10 h-7 w-7"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={saveApiKey}
                      disabled={!apiKey.trim() || apiKey.trim() === savedApiKey}
                      className="rounded-xl bg-transparent"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Key
                    </Button>
                    {savedApiKey && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSavedApiKey}
                        className="rounded-xl text-destructive hover:text-destructive bg-transparent"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground/60">
                    Get an API key at{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div className="h-px bg-border/50" />

                {/* Default Resume Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Default Resume</h4>
                      <p className="text-xs text-muted-foreground/70">
                        {defaultResume ? `Saved: ${defaultResume.name}` : "No default resume saved"}
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={dialogFileInputRef}
                    onChange={handleDialogFileUpload}
                    accept=".docx"
                    className="hidden"
                  />

                  <Button
                    onClick={() => dialogFileInputRef.current?.click()}
                    variant="outline"
                    className="w-full rounded-xl h-10 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent justify-start"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Default Resume
                  </Button>

                  <Button
                    onClick={loadFromGoogleDrive}
                    variant="outline"
                    className="w-full rounded-xl h-10 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Load from Google Drive
                  </Button>

                  {defaultResume ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          loadDefaultResume()
                          setOptionsOpen(false)
                        }}
                        variant="outline"
                        className="w-full rounded-xl h-10 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Use "{defaultResume.name}"
                      </Button>
                      <Button
                        onClick={clearDefaultResume}
                        variant="outline"
                        className="w-full rounded-xl h-10 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive bg-transparent justify-start"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Default Resume
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-border/50 bg-muted/20 text-center">
                      <p className="text-xs text-muted-foreground/70">No default resume saved yet</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mb-5 shadow-lg shadow-primary/20 ring-1 ring-primary/20">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-3">
            Resume Optimizer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Tailor your resume to match any job description using AI. Upload your resume and paste the job description
            to get started.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-3">
            Your original DOCX formatting is preserved through semantic XML rewriting.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <Card className="rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
              <CardHeader className="pb-4">
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
              <CardContent>
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-[200px] rounded-2xl bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 resize-none overflow-y-auto"
                />
              </CardContent>
            </Card>

            {/* Upload Resume Card */}
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
              {/* Collapsible header with click handler */}
              <CardHeader
                className="bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer hover:from-primary/10 hover:to-accent/10 transition-colors"
                onClick={() => setUploadExpanded(!uploadExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Upload Resume</CardTitle>
                      <CardDescription className="text-muted-foreground/80">
                        {resumeFile ? resumeFile.name : "Upload your resume in .docx format"}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${uploadExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </CardHeader>
              {uploadExpanded && (
                <CardContent className="pt-5">
                  <div className="space-y-5">
                    <Label
                      htmlFor="resume-upload"
                      className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-primary/20 rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-3 rounded-2xl bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                          <Upload className="w-7 h-7 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {resumeFile ? (
                            <span className="font-semibold text-primary">{resumeFile.name}</span>
                          ) : (
                            <>
                              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">.docx files only</p>
                      </div>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </Label>

                    {error && (
                      <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
              <CardContent className="pt-0">
                {error && !uploadExpanded && (
                  <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                <Button
                  onClick={handleOptimize}
                  disabled={isLoading || !jobDescription.trim() || !resumeFile}
                  className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:shadow-none"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Optimize Resume
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Optimized Resume</CardTitle>
                  <CardDescription className="text-muted-foreground/80">
                    Your AI-optimized resume will appear here
                  </CardDescription>
                </div>
                {docxBlob && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/40 bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download DOCX
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <div className="p-4 rounded-3xl bg-primary/10 mb-5 animate-pulse">
                    <Sparkles className="w-10 h-10 animate-spin text-primary" />
                  </div>
                  <p className="font-medium">Optimizing your resume...</p>
                  <p className="text-sm text-muted-foreground/70">Parsing XML structure and preserving formatting</p>
                </div>
              ) : optimizedResume ? (
                <div className="bg-muted/30 rounded-2xl p-5 max-h-[500px] overflow-y-auto border border-border/30">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/90">{optimizedResume}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed border-primary/10 rounded-2xl bg-muted/10">
                  <div className="p-4 rounded-3xl bg-primary/5 mb-4">
                    <FileText className="w-12 h-12 text-primary/40" />
                  </div>
                  <p className="font-medium">Your optimized resume will appear here</p>
                  <p className="text-sm text-muted-foreground/70">
                    Upload a resume and add a job description to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                  <Info className="w-5 h-5 text-accent" />
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
                  {showDebugPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </div>
            <CardDescription className="text-muted-foreground/80">
              View detailed information about XML parsing, AI request, and response
            </CardDescription>
          </CardHeader>

          {showDebugPanel && (
            <CardContent className="space-y-5 pt-2">
              <div className="bg-background/80 rounded-2xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-border/30">
                {debugLogs.length === 0 ? (
                  <p className="text-muted-foreground/50">Logs will appear here when you optimize a resume...</p>
                ) : (
                  <div className="space-y-1.5">
                    {debugLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-muted-foreground/50 shrink-0">{log.timestamp}</span>
                        <span className={`shrink-0 font-semibold ${getLogColor(log.type)}`}>
                          {getLogPrefix(log.type)}
                        </span>
                        <span className="text-foreground/80">{log.message}</span>
                        {log.data && <span className="text-muted-foreground/60 break-all">- {log.data}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {promptSent && (
                <div>
                  <Label className="text-sm font-medium mb-3 block text-primary">Prompt Sent to Gemini</Label>
                  <div className="bg-background/80 rounded-2xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-primary/20">
                    <pre className="text-emerald-400 whitespace-pre-wrap">{promptSent}</pre>
                  </div>
                </div>
              )}

              {rawResponse && (
                <div>
                  <Label className="text-sm font-medium mb-3 block text-accent">Raw Response from Gemini</Label>
                  <div className="bg-background/80 rounded-2xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-accent/20">
                    <pre className="text-sky-400 whitespace-pre-wrap">{rawResponse}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
