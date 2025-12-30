"use client"

import type React from "react"

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
import { History, Download, ArrowUpDown, Trash2 } from "lucide-react"

interface HistoryRecord {
  id: string
  job_title: string
  company_name: string
  job_description: string
  generated_resume_docx: string
  created_at: string
}

type SortField = "job_title" | "company_name" | "created_at"
type SortDirection = "asc" | "desc"

export function HistoryDialog() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

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
    } else {
      comparison = a[sortField].localeCompare(b[sortField])
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const handleDownload = (record: HistoryRecord) => {
    const byteCharacters = atob(record.generated_resume_docx)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${record.job_title.replace(/\s+/g, "_")}_${record.company_name.replace(/\s+/g, "_")}_resume.docx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/resume-history?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.error) {
        console.error("Failed to delete:", data.error)
      } else {
        setHistory(history.filter((r) => r.id !== id))
      }
    } catch (err) {
      console.error("Delete error:", err)
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
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full rounded-3xl bg-card/95 backdrop-blur-xl border-border/50 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Resume History
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            View and download your previously generated resumes
          </DialogDescription>
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
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 border-b border-border/50">
                      <SortButton field="job_title">Job Title</SortButton>
                    </th>
                    <th className="text-left p-4 border-b border-border/50">
                      <SortButton field="company_name">Company Name</SortButton>
                    </th>
                    <th className="text-left p-4 border-b border-border/50">
                      <SortButton field="created_at">Date Generated</SortButton>
                    </th>
                    <th className="text-right p-4 border-b border-border/50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHistory.map((record, index) => (
                    <tr
                      key={record.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        index !== sortedHistory.length - 1 ? "border-b border-border/30" : ""
                      }`}
                    >
                      <td className="p-4 font-medium">{record.job_title}</td>
                      <td className="p-4 text-muted-foreground">{record.company_name}</td>
                      <td className="p-4 text-muted-foreground text-sm">{formatDate(record.created_at)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleDownload(record)}
                            size="sm"
                            variant="outline"
                            className="rounded-xl hover:bg-primary/10 hover:border-primary/50"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            onClick={() => handleDelete(record.id)}
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
