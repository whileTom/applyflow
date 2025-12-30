"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  const [resumeExpanded, setResumeExpanded] = useState(false)
  const [defaultResume, setDefaultResume] = useState<{ name: string; data: string } | null>(null)
  const [useDefaultResume, setUseDefaultResume] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [promptSent, setPromptSent] = useState("")
  const [rawResponse, setRawResponse] = useState("")

  useEffect(() => {
    const loadDefaultResume = async () => {
      const saved = localStorage.getItem("defaultResume")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setDefaultResume(parsed)
        } catch {
          localStorage.removeItem("defaultResume")
        }
      } else {
        // Try to load from public/resume folder
        try {
          const response = await fetch("/resume/default-resume.docx")
          if (response.ok) {
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
            )
            setDefaultResume({ name: "default-resume.docx", data: base64 })
          }
        } catch {
          // No default resume available
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
    const arrayBuffer = await resumeFile.arrayBuffer()
    const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""))
    const saved = { name: resumeFile.name, data: base64 }
    localStorage.setItem("defaultResume", JSON.stringify(saved))
    setDefaultResume(saved)
    addLog("success", "Resume saved as default", resumeFile.name)
  }

  const clearDefaultResume = () => {
    localStorage.removeItem("defaultResume")
    setDefaultResume(null)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-10 px-4 max-w-7xl">
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

        <div className="space-y-4 mb-8">
          <Collapsible open={apiKeyExpanded} onOpenChange={setApiKeyExpanded}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl shadow-lg shadow-primary/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                        <Settings className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">API Key Settings</CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                          {savedApiKey
                            ? "Saved API key configured"
                            : apiKey.trim()
                              ? "Custom API key entered (not saved)"
                              : "Using default API key (click to use your own)"}
                        </CardDescription>
                      </div>
                    </div>
                    {apiKeyExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    Optionally enter your own Google Gemini API key. Get one at{" "}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                    >
                      Google AI Studio
                    </a>
                  </p>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="Leave empty to use default key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-12 rounded-2xl h-12 bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl hover:bg-primary/10"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showApiKey ? "Hide" : "Show"} API key</span>
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
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
                        Clear Saved
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={resumeExpanded} onOpenChange={setResumeExpanded}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl shadow-lg shadow-primary/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-accent/10 ring-1 ring-accent/20">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">Default Resume</CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                          {defaultResume
                            ? `Saved: ${defaultResume.name}`
                            : "Save a resume to use as default (click to expand)"}
                        </CardDescription>
                      </div>
                    </div>
                    {resumeExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Save a resume to quickly use it for multiple job descriptions without re-uploading.
                  </p>

                  {defaultResume ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={loadDefaultResume}
                        variant="outline"
                        className="flex-1 rounded-2xl h-11 border-accent/30 hover:bg-accent/10 hover:border-accent/50 bg-transparent"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Use "{defaultResume.name}"
                      </Button>
                      <Button
                        onClick={clearDefaultResume}
                        variant="outline"
                        className="rounded-2xl h-11 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 text-destructive bg-transparent"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Default
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
                      <p className="text-sm text-muted-foreground/70">
                        Upload a resume below and click "Save as Default" to save it here
                      </p>
                    </div>
                  )}

                  {resumeFile && !useDefaultResume && (
                    <Button
                      onClick={saveAsDefault}
                      variant="outline"
                      className="w-full rounded-2xl h-11 border-primary/30 hover:bg-primary/10 hover:border-primary/50 bg-transparent"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save "{resumeFile.name}" as Default
                    </Button>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
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
                  className="min-h-[200px] resize-none rounded-2xl bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl shadow-primary/5">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Upload Resume</CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                      Upload your resume in .docx format
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                </div>
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
