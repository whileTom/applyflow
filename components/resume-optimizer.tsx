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
  error?: string
  debug?: {
    prompt: string
    resumeTextLength: number
    jobDescriptionLength: number
    responseLength?: number
    processingTime?: number
    model: string
    extractedResumePreview: string
  }
}

export function ResumeOptimizer() {
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [optimizedResume, setOptimizedResume] = useState("")
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
    clearLogs()

    addLog("info", "Starting resume optimization...")
    addLog("info", "Preparing request", `Job description: ${jobDescription.length} chars, File: ${resumeFile.name}`)

    try {
      const formData = new FormData()
      formData.append("jobDescription", jobDescription)
      formData.append("resume", resumeFile)
      formData.append("apiKey", apiKey)

      addLog("request", "Sending request to /api/optimize-resume")
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
        addLog("info", "Document processed", `Extracted ${data.debug.resumeTextLength} characters from resume`)
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
        addLog("success", "Resume optimized successfully", `Output: ${data.optimizedResume.length} characters`)
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
    const blob = new Blob([optimizedResume], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "optimized-resume.txt"
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Resume Optimizer</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tailor your resume to match any job description using AI. Upload your resume and paste the job description to
          get started.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Google Gemini API Key
          </CardTitle>
          <CardDescription>
            Enter your Google Gemini API key. Get one at{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Google AI Studio
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              type={showApiKey ? "text" : "password"}
              placeholder="Enter your API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Description
              </CardTitle>
              <CardDescription>Paste the job description you want to tailor your resume for</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>Upload your resume in .docx format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {resumeFile ? (
                        <span className="font-medium text-primary">{resumeFile.name}</span>
                      ) : (
                        <>
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">.docx files only</p>
                  </div>
                  <input id="resume-upload" type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
                </Label>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handleOptimize}
                  disabled={isLoading || !jobDescription.trim() || !resumeFile || !apiKey.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Optimize Resume
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Optimized Resume</CardTitle>
                <CardDescription>Your AI-optimized resume will appear here</CardDescription>
              </div>
              {optimizedResume && (
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Optimizing your resume...</p>
                <p className="text-sm">This may take a moment</p>
              </div>
            ) : optimizedResume ? (
              <div className="bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">{optimizedResume}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>Your optimized resume will appear here</p>
                <p className="text-sm">Upload a resume and add a job description to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Output Panel */}
      <Card className="mt-6">
        <CardHeader className="cursor-pointer" onClick={() => setShowDebugPanel(!showDebugPanel)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              <CardTitle>Debug Output</CardTitle>
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
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
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
              {showDebugPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          <CardDescription>View detailed information about the API request and response</CardDescription>
        </CardHeader>

        {showDebugPanel && (
          <CardContent className="space-y-4">
            {/* Log Output */}
            <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto">
              {debugLogs.length === 0 ? (
                <p className="text-zinc-500">Logs will appear here when you optimize a resume...</p>
              ) : (
                <div className="space-y-1">
                  {debugLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                      <span className={`shrink-0 ${getLogColor(log.type)}`}>{getLogPrefix(log.type)}</span>
                      <span className="text-zinc-300">{log.message}</span>
                      {log.data && <span className="text-zinc-500 break-all">- {log.data}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Sent */}
            {promptSent && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Prompt Sent to Gemini</Label>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto">
                  <pre className="text-green-400 whitespace-pre-wrap">{promptSent}</pre>
                </div>
              </div>
            )}

            {/* Raw Response */}
            {rawResponse && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Raw Response from Gemini</Label>
                <div className="bg-zinc-950 rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto">
                  <pre className="text-blue-400 whitespace-pre-wrap">{rawResponse}</pre>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
