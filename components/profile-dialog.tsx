"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Save,
  Loader2,
  UserIcon,
  Key,
  FileText,
  Eye,
  EyeOff,
  Check,
  Camera,
  Trash2,
  Upload,
  Cpu,
  Star,
} from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractGoogleDriveDocId } from "@/lib/extract-doc-id"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  credits_remaining: number
  default_resume_url: string | null
  google_api_key: string | null
  avatar_url: string | null
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  profile: UserProfile | null
  onProfileUpdate?: () => void
}

export function ProfileDialog({ open, onOpenChange, user, profile, onProfileUpdate }: ProfileDialogProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [resumeUrl, setResumeUrl] = useState(profile?.default_resume_url || "")
  const [googleApiKey, setGoogleApiKey] = useState(profile?.google_api_key || "")
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("preferredModel") || "gemini-2.5-flash"
    }
    return "gemini-2.5-flash"
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false)
  const [deletingHeadshot, setDeletingHeadshot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [savedResumes, setSavedResumes] = useState<
    Array<{ id: string; name: string; is_default: boolean; google_drive_doc_id: string | null }>
  >([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [newResumeName, setNewResumeName] = useState("")
  const [newResumeUrl, setNewResumeUrl] = useState("")
  const [addingResume, setAddingResume] = useState(false)

  const handleHeadshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setUploadingHeadshot(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-headshot", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload headshot")
      }

      const data = await response.json()
      setAvatarUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload headshot")
    } finally {
      setUploadingHeadshot(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteHeadshot = async () => {
    setDeletingHeadshot(true)
    setError(null)

    try {
      const response = await fetch("/api/upload-headshot", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete headshot")
      }

      setAvatarUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete headshot")
    } finally {
      setDeletingHeadshot(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("preferredModel", selectedModel)
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName || null,
          default_resume_url: resumeUrl || null,
          google_api_key: googleApiKey || null,
          avatar_url: avatarUrl || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save settings")
      }

      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onProfileUpdate?.()
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchSavedResumes()
    }
  }, [open])

  const fetchSavedResumes = async () => {
    setLoadingResumes(true)
    try {
      const res = await fetch("/api/user-resumes")
      const data = await res.json()
      if (data.resumes) {
        setSavedResumes(data.resumes)
      }
    } catch (err) {
      console.error("Failed to fetch saved resumes:", err)
    } finally {
      setLoadingResumes(false)
    }
  }

  const handleAddResume = async () => {
    if (!newResumeName.trim() || !newResumeUrl.trim()) {
      setError("Both name and URL are required")
      return
    }

    const docId = extractGoogleDriveDocId(newResumeUrl)
    if (!docId) {
      setError("Invalid Google Drive URL. Please provide a valid URL or DOC_ID")
      return
    }

    setAddingResume(true)
    setError(null)

    try {
      const res = await fetch("/api/user-resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newResumeName,
          googleDriveUrl: newResumeUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add resume")
      }

      setNewResumeName("")
      setNewResumeUrl("")
      await fetchSavedResumes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add resume")
    } finally {
      setAddingResume(false)
    }
  }

  const handleSetDefaultResume = async (id: string) => {
    try {
      const res = await fetch("/api/user-resumes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, setAsDefault: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to set default resume")
      }

      await fetchSavedResumes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default resume")
    }
  }

  const handleDeleteResume = async (id: string) => {
    try {
      const res = await fetch(`/api/user-resumes?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete resume")
      }

      await fetchSavedResumes()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resume")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
          <DialogDescription>Manage your account and preferences</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="rounded-2xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 overflow-hidden">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl || "/placeholder.svg"}
                      alt="Profile"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-cover rounded"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ""} disabled className="rounded-xl bg-muted/30" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile Photo</CardTitle>
                  <CardDescription>Upload a headshot to include in your resume</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted/30 border-2 border-border flex items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl || "/placeholder.svg"}
                        alt="Profile photo"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  {uploadingHeadshot && (
                    <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleHeadshotUpload}
                    className="hidden"
                    id="headshot-upload"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingHeadshot}
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {avatarUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteHeadshot}
                        disabled={deletingHeadshot}
                        className="rounded-xl text-destructive hover:text-destructive bg-transparent"
                      >
                        {deletingHeadshot ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a professional headshot (max 5MB). You can choose to include it in your resume from the
                    Resume Style options.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Resume Library</CardTitle>
                  <CardDescription>Manage your saved resumes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-2">
                  <Label htmlFor="newResumeName">Resume Name</Label>
                  <Input
                    id="newResumeName"
                    type="text"
                    placeholder="My Resume"
                    value={newResumeName}
                    onChange={(e) => setNewResumeName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newResumeUrl">Google Drive URL or DOC_ID</Label>
                  <Input
                    id="newResumeUrl"
                    type="text"
                    placeholder="https://docs.google.com/document/d/... or paste DOC_ID"
                    value={newResumeUrl}
                    onChange={(e) => setNewResumeUrl(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Paste any Google Drive URL format or just the DOC_ID</p>
                </div>
                <Button
                  onClick={handleAddResume}
                  disabled={addingResume || !newResumeName.trim() || !newResumeUrl.trim()}
                  size="sm"
                  className="rounded-xl w-full"
                >
                  {addingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Add Resume
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Saved Resumes</Label>
                {loadingResumes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : savedResumes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No resumes saved yet. Add one above to get started.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedResumes.map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{resume.name}</span>
                          {resume.is_default && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleSetDefaultResume(resume.id)}
                            title="Set as default"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                resume.is_default ? "fill-primary text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                            onClick={() => handleDeleteResume(resume.id)}
                            title="Delete resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Model</CardTitle>
                  <CardDescription>Choose which Gemini model to use for resume optimization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">Preferred Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="model" className="rounded-xl w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Gemini 2.5 Flash</span>
                        <span className="text-xs text-muted-foreground">Recommended - Fast and balanced</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Gemini 2.5 Flash Lite</span>
                        <span className="text-xs text-muted-foreground">Faster with lower resource usage</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gemini-3-flash">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Gemini 3 Flash</span>
                        <span className="text-xs text-muted-foreground">Latest model with enhanced capabilities</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This model will be used by default for all new resume optimizations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted/50">
                  <Key className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Google AI API Key</CardTitle>
                  <CardDescription>Optional: Use your own API key for Google AI Studio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Leave empty to use default key"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    className="rounded-xl pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {error && <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-12">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
