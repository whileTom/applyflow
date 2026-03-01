"use client"

import type React from "react"
import { encodeToBase64 } from "@/lib/encoding"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History, Download, ArrowUpDown, Trash2, Copy, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StyleOptions {
  fontFamily?: string
  fontScale?: string
  colorScheme?: string
  nameHeaderAlignment?: string
  headerAlignment?: string
  margins?: string
  sectionSpacing?: string
  skillsStyle?: string
  bulletStyle?: string
  dividerStyle?: string
  nameSize?: string
  nameStyle?: string
  datePosition?: string
}

interface HistoryRecord {
  id: string
  job_title: string
  company_name: string
  job_description: string
  generated_resume_pdf: string
  generated_resume_docx?: string
  interview_guide_pdf: string | null
  model: string | null
  embellishment_level: number | null
  style_options: StyleOptions | null
  created_at: string
}

type SortField = "job_title" | "company_name" | "created_at" | "embellishment_level"
type SortDirection = "asc" | "desc"

interface HistoryDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function HistoryDialog({ open: externalOpen, onOpenChange: externalOnOpenChange }: HistoryDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resume-history")
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setHistory(data.history || [])
      }
    } catch (err) {
      setError("Failed to fetch history")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "created_at" ? "desc" : "asc")
    }
  }

  const sortedHistory = [...history].sort((a, b) => {
    let comparison = 0
    if (sortField === "created_at") {
      comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortField === "embellishment_level") {
      comparison = (a.embellishment_level || 0) - (b.embellishment_level || 0)
    } else {
      comparison = a[sortField].localeCompare(b[sortField])
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleDownloadPdf = (record: HistoryRecord) => {
    const byteCharacters = atob(record.generated_resume_pdf)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: "application/pdf",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${record.job_title.replace(/\s+/g, "_")}_${record.company_name.replace(/\s+/g, "_")}_resume.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadJobDescription = (record: HistoryRecord) => {
    const blob = new Blob([record.job_description], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${record.job_title.replace(/\s+/g, "_")}_${record.company_name.replace(/\s+/g, "_")}_job_description.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadInterviewGuide = (record: HistoryRecord) => {
    if (!record.interview_guide_pdf) {
      toast({
        title: "Interview guide not available",
        description: "No interview guide was generated for this resume.",
      })
      return
    }

    const byteCharacters = atob(record.interview_guide_pdf)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: "application/pdf",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${record.job_title.replace(/\s+/g, "_")}_${record.company_name.replace(/\s+/g, "_")}_interview_guide.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyStyle = (record: HistoryRecord) => {
    if (!record.style_options) {
      toast({
        title: "No style configuration",
        description: "This resume doesn't have style options saved.",
      })
      return
    }

    const encoded = encodeToBase64(JSON.stringify(record.style_options))
    navigator.clipboard.writeText(encoded)
    toast({
      title: "Style copied to clipboard",
      description: "You can paste this style code in the Resume Style card.",
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume from history?")) {
      return
    }

    try {
      const res = await fetch(`/api/resume-history?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete")
      }

      // Refresh the history
      fetchHistory()
      toast({
        title: "Resume deleted",
        description: "The resume has been removed from your history.",
      })
    } catch (err) {
      console.error("Failed to delete:", err)
      toast({
        title: "Failed to delete",
        description: "Could not delete the resume from history.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatStyleOption = (key: string, value: string) => {
    const labels: Record<string, string> = {
      fontFamily: "Font",
      fontScale: "Scale",
      colorScheme: "Color",
      nameHeaderAlignment: "Name Align",
      headerAlignment: "Section Align",
      margins: "Margins",
      sectionSpacing: "Spacing",
      skillsStyle: "Skills",
      bulletStyle: "Bullets",
      dividerStyle: "Dividers",
      nameSize: "Name Size",
      nameStyle: "Name Style",
      datePosition: "Date Pos",
    }
    return labels[key] || key
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? "text-primary" : "text-muted-foreground/50"}`} />
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl h-12 w-12 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 shadow-lg shadow-primary/5"
          >
            <History className="w-5 h-5 text-muted-foreground" />
            <span className="sr-only">History</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full rounded-3xl bg-card/95 backdrop-blur-xl border-border/50 overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Resume History
              </DialogTitle>
              <DialogDescription className="text-muted-foreground/80">
                View and download your previously generated resumes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button onClick={fetchHistory} variant="outline" className="mt-4 rounded-xl bg-transparent">
                Retry
              </Button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No resume history yet</p>
              <p className="text-sm mt-1">Your optimized resumes will appear here</p>
            </div>
          ) : (
            <div className="border border-border/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 border-b border-border/50 w-[20%]">
                        <SortButton field="job_title">Job Title</SortButton>
                      </th>
                      <th className="text-left p-4 border-b border-border/50 w-[15%]">
                        <SortButton field="company_name">Company</SortButton>
                      </th>
                      <th className="text-left p-4 border-b border-border/50 w-[15%]">
                        <SortButton field="created_at">Date</SortButton>
                      </th>
                      <th className="text-right p-4 border-b border-border/50 w-[37%]">Actions</th>
                      <th className="text-center p-4 border-b border-border/50 w-[8%]">Embellish</th>
                      <th className="text-center p-4 border-b border-border/50 w-[5%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map((record, index) => (
                      <>
                        <tr
                          key={record.id}
                          className={`hover:bg-muted/20 transition-colors ${
                            index !== sortedHistory.length - 1 && !expandedRows.has(record.id)
                              ? "border-b border-border/30"
                              : ""
                          }`}
                        >
                          <td className="p-4 font-medium">{record.job_title}</td>
                          <td className="p-4 text-muted-foreground">{record.company_name}</td>
                          <td className="p-4 text-muted-foreground text-sm">{formatDate(record.created_at)}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <Button
                                onClick={() => handleDownloadPdf(record)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl hover:bg-primary/10 hover:border-primary/50"
                                title="Download as PDF"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                              {record.interview_guide_pdf && (
                                <Button
                                  onClick={() => handleDownloadInterviewGuide(record)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl hover:bg-accent/10 hover:border-accent/50"
                                  title="Download Interview Guide"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Guide
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDownloadJobDescription(record)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl hover:bg-accent/10 hover:border-accent/50"
                                title="Download Job Description"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                JD
                              </Button>
                              {record.style_options && (
                                <Button
                                  onClick={() => handleCopyStyle(record)}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl hover:bg-accent/10 hover:border-accent/50"
                                  title="Copy Style Configuration"
                                >
                                  <Copy className="w-4 h-4 mr-1" />
                                  Style
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDelete(record.id)}
                                size="sm"
                                variant="outline"
                                className="rounded-xl hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {record.embellishment_level !== null ? (
                              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                {record.embellishment_level * 10}%
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpanded(record.id)}
                              className="h-6 w-6 p-0"
                            >
                              {expandedRows.has(record.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                        {expandedRows.has(record.id) && (
                          <tr key={`${record.id}-expanded`} className="bg-muted/10 border-b border-border/30">
                            <td colSpan={6} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">Style Configuration</h4>
                                  {record.style_options && (
                                    <Button
                                      onClick={() => handleCopyStyle(record)}
                                      size="sm"
                                      variant="outline"
                                      className="rounded-xl h-7"
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy Style Code
                                    </Button>
                                  )}
                                </div>
                                {record.style_options ? (
                                  <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(record.style_options).map(([key, value]) => (
                                      <div key={key} className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">
                                          {formatStyleOption(key, String(value))}:
                                        </span>
                                        <span className="font-medium capitalize">
                                          {String(value).replace(/-/g, " ")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    No style configuration saved for this resume.
                                  </p>
                                )}
                                {record.model && (
                                  <div className="text-xs text-muted-foreground">
                                    Model: <span className="font-medium">{record.model}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
