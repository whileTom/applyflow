"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  FileUp,
  Loader2,
  Sparkles,
  Download,
  FileText,
  Briefcase,
  Key,
  Eye,
  EyeOff,
  Terminal,
  ChevronDown,
  ChevronUp,
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
  structuredData?: Record<string, unknown>
  error?: string
  debug?: {
    prompt: string
    resumeTextLength: number
    jobDescriptionLength: number
    responseLength?: number
    processingTime?: number
    totalTime?: number
    model: string
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
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(true)
  const [promptSent, setPromptSent] = useState("")
  const [rawResponse, setRawResponse] = useState("")

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
    if (!apiKey.trim()) {
      setError("Please enter your Google Gemini API key")
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
    setDocxBlob(null)
    clearLogs()

    addLog("info", "Starting resume optimization...")
    addLog("info", "Preparing request", `Job description: ${jobDescription.length} chars, File: ${resumeFile.name}`)

    try {
      const formData = new FormData()
      formData.append("jobDescription", jobDescription)
      formData.append("resume", resumeFile)
      formData.append("apiKey", apiKey)

      addLog("request", "Sending request to /api/optimize-resume")
      addLog("info", "Extracting text and generating structured resume data...")
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
        addLog("info", "Resume text extracted", `${data.debug.resumeTextLength} characters`)
        addLog("info", "Model used", data.debug.model)
        if (data.debug.processingTime) {
          addLog("info", "AI processing time", `${data.debug.processingTime}ms`)
        }
        if (data.debug.totalTime) {
          addLog("info", "Total processing time", `${data.debug.totalTime}ms`)
        }
        if (data.debug.skillsCount !== undefined) {
          addLog("info", "Skills extracted", `${data.debug.skillsCount} individual skills`)
        }
        if (data.debug.experienceCount !== undefined) {
          addLog("info", "Experience entries", `${data.debug.experienceCount} positions`)
        }
      }

      if (!response.ok) {
        addLog("error", "Request failed", data.error || "Unknown error")
        throw new Error(data.error || "Failed to optimize resume")
      }

      if (data.optimizedResume) {
        setOptimizedResume(data.optimizedResume)
        setRawResponse(data.structuredData ? JSON.stringify(data.structuredData, null, 2) : data.optimizedResume)
        addLog("success", "AI optimization completed", `Output: ${data.optimizedResume.length} characters`)
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
        addLog("success", "Professional DOCX generated", `${(blob.size / 1024).toFixed(2)} KB file ready for download`)
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
        return "text-emerald-400"
      case "error":
        return "text-rose-400"
      case "request":
        return "text-sky-400"
      case "response":
        return "text-violet-400"
      default:
        return "text-slate-400"
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
        {/* Header with glow effect */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/30 mb-5 shadow-lg shadow-primary/20 ring-1 ring-primary/20">
            <Sparkles className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-3 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
            Resume Optimizer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Tailor your resume to match any job description using AI. Upload your resume and paste the job description
            to get started.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Generates a clean, professionally formatted DOCX with optimized content.
          </p>
        </div>

        {/* API Key Card */}
        <Card className="mb-8 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Key className="w-5 h-5 text-primary" />
              </div>
              Google Gemini API Key
            </CardTitle>
            <CardDescription>
              Enter your Google Gemini API key. Get one at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                Google AI Studio
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-12 rounded-xl bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-primary/10"
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
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Job Description Card */}
            <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                    <Briefcase className="w-5 h-5 text-accent" />
                  </div>
                  Job Description
                </CardTitle>
                <CardDescription>Paste the job description you want to tailor your resume for</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] resize-none rounded-xl bg-input/50 border-border/50 focus:border-accent/50 focus:ring-accent/20 transition-all"
                />
              </CardContent>
            </Card>

            {/* Upload Card */}
            <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  Upload Resume
                </CardTitle>
                <CardDescription>Upload your resume in .docx format</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-5">
                  <Label
                    htmlFor="resume-upload"
                    className="group flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border/50 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors mb-3">
                        <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resumeFile ? (
                          <span className="font-medium text-primary">{resumeFile.name}</span>
                        ) : (
                          <>
                            <span className="font-medium text-foreground">Click to upload</span> or drag and drop
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
                    <div className="flex items-center gap-2 text-sm text-rose-400 bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/20">
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleOptimize}
                    disabled={isLoading || !jobDescription.trim() || !resumeFile || !apiKey.trim()}
                    className="w-full rounded-xl h-12 text-base font-medium bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25 disabled:shadow-none transition-all duration-300"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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

          {/* Output Card */}
          <Card className="h-fit rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-accent/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/5 pointer-events-none" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Optimized Resume</CardTitle>
                  <CardDescription>Your AI-optimized resume will appear here</CardDescription>
                </div>
                {docxBlob && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="rounded-xl border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all bg-transparent"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download DOCX
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <Loader2 className="w-10 h-10 animate-spin text-primary relative" />
                  </div>
                  <p className="mt-5 font-medium">Optimizing your resume...</p>
                  <p className="text-sm text-muted-foreground/70">
                    Generating structured data and building professional DOCX
                  </p>
                </div>
              ) : optimizedResume ? (
                <div className="bg-muted/30 rounded-2xl p-5 max-h-[500px] overflow-y-auto border border-border/30">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/90 leading-relaxed">
                    {optimizedResume}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed border-border/30 rounded-2xl bg-muted/10">
                  <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                    <FileText className="w-12 h-12 opacity-40" />
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

        {/* Debug Panel */}
        <Card className="mt-8 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5 overflow-hidden">
          <CardHeader
            className="cursor-pointer relative hover:bg-muted/20 transition-colors"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted/50 ring-1 ring-border/50">
                  <Terminal className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Debug Output</CardTitle>
                <span className="text-xs bg-muted/50 px-3 py-1 rounded-full text-muted-foreground ring-1 ring-border/30">
                  {debugLogs.length} logs
                </span>
              </div>
              <div className="flex items-center gap-2">
                {debugLogs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearLogs()
                    }}
                    className="text-xs rounded-lg hover:bg-rose-500/10 hover:text-rose-400"
                  >
                    Clear
                  </Button>
                )}
                <div className="p-1 rounded-lg bg-muted/30">
                  {showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
            <CardDescription>
              View detailed information about AI request, structured response, and DOCX generation
            </CardDescription>
          </CardHeader>

          {showDebugPanel && (
            <CardContent className="space-y-5">
              <div className="bg-slate-950/80 rounded-xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-slate-800/50">
                {debugLogs.length === 0 ? (
                  <p className="text-slate-500">Logs will appear here when you optimize a resume...</p>
                ) : (
                  <div className="space-y-1.5">
                    {debugLogs.map((log, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                        <span className={`shrink-0 font-semibold ${getLogColor(log.type)}`}>
                          {getLogPrefix(log.type)}
                        </span>
                        <span className="text-slate-300">{log.message}</span>
                        {log.data && <span className="text-slate-500 break-all">- {log.data}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {promptSent && (
                <div>
                  <Label className="text-sm font-medium mb-2 block text-muted-foreground">Prompt Sent to Gemini</Label>
                  <div className="bg-slate-950/80 rounded-xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-emerald-900/30">
                    <pre className="text-emerald-400/90 whitespace-pre-wrap">{promptSent}</pre>
                  </div>
                </div>
              )}

              {rawResponse && (
                <div>
                  <Label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Structured JSON Response from Gemini
                  </Label>
                  <div className="bg-slate-950/80 rounded-xl p-4 font-mono text-xs max-h-[300px] overflow-y-auto border border-sky-900/30">
                    <pre className="text-sky-400/90 whitespace-pre-wrap">{rawResponse}</pre>
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
