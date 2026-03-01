"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
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
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface SettingsContentProps {
  user: User
  profile: UserProfile | null
}

export function SettingsContent({ user, profile }: SettingsContentProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [resumeUrl, setResumeUrl] = useState(profile?.default_resume_url || "")
  const [googleApiKey, setGoogleApiKey] = useState(profile?.google_api_key || "")
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "")
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false)
  const [deletingHeadshot, setDeletingHeadshot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash")

  useEffect(() => {
    const savedModel = localStorage.getItem("defaultGeminiModel")
    if (savedModel) {
      setSelectedModel(savedModel)
    }
  }, [])

  const handleModelChange = (model: string) => {
    console.log("[v0] Model changed to:", model)
    setSelectedModel(model)
    localStorage.setItem("defaultGeminiModel", model)
  }

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
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName || null,
          default_resume_url: resumeUrl || null,
          google_api_key: googleApiKey || null,
          avatar_url: avatarUrl || null,
          default_gemini_model: selectedModel,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save settings")
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
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

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
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

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Default Resume</CardTitle>
                  <CardDescription>URL to your base resume (.docx file)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume URL</Label>
                <Input
                  id="resumeUrl"
                  type="url"
                  placeholder="https://docs.google.com/document/d/.../export?format=docx"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a direct URL to a .docx file. For Google Docs, use the export link format:
                  <br />
                  <code className="text-xs bg-muted px-1 rounded">
                    {"https://docs.google.com/document/d/{DOC_ID}/export?format=docx"}
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Model Selection</CardTitle>
                  <CardDescription>Choose which Gemini model to use for optimization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-model">Select Model</Label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger id="gemini-model" className="rounded-xl w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</SelectItem>
                    <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Faster)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Most Capable)</SelectItem>
                    <SelectItem value="gemini-3-flash">Gemini 3 Flash (Latest)</SelectItem>
                    <SelectItem value="gemini-3-pro">Gemini 3 Pro (Premium)</SelectItem>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
                    <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash Exp (Experimental)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This setting is saved locally in your browser and will be used for all resume optimizations.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-card/50 backdrop-blur-xl border-border/50">
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
      </div>
    </div>
  )
}
