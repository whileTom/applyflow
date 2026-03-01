"use client"

import type React from "react"
import { encodeToBase64 } from "@/lib/encoding"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Palette, Shuffle, Save, Download, Upload, RotateCcw, ChevronDown, User } from "lucide-react"
import { toast } from "sonner"

export interface ResumeStyleOptions {
  // Font options
  fontFamily: "helvetica" | "times" | "courier" | "georgia" | "palatino" | "arial" | "roboto"

  fontScale: "xs" | "s" | "m" | "l" | "xl"

  // Color scheme
  colorScheme:
    | "classic-green"
    | "corporate-blue"
    | "elegant-gray"
    | "modern-teal"
    | "professional-navy"
    | "minimalist-black"
    | "warm-burgundy"
    | "creative-purple"
    | "custom" // Added custom color option

  customColor?: string

  // Layout options - added nameHeaderAlignment
  nameHeaderAlignment: "center" | "left" | "right"
  headerAlignment: "center" | "left" | "right"
  margins: "compact" | "standard" | "spacious"
  sectionSpacing: "tight" | "normal" | "relaxed"

  // Skills display
  skillsStyle: "pills" | "list" | "inline" | "columns"

  // Bullet style
  bulletStyle: "dot" | "dash" | "arrow" | "square" | "circle"

  // Section dividers
  dividerStyle: "line" | "double-line" | "dotted" | "none" | "thick"

  // Name styling
  nameSize: "small" | "medium" | "large"
  nameStyle: "uppercase" | "titlecase" | "lowercase"

  // Date formatting
  datePosition: "right" | "below" | "inline"

  includePhoto: boolean
  photoPosition: "left" | "center" | "right"
}

const DEFAULT_STYLE: ResumeStyleOptions = {
  fontFamily: "helvetica",
  fontScale: "m",
  colorScheme: "classic-green",
  nameHeaderAlignment: "center",
  headerAlignment: "left",
  margins: "compact", // changed default from "standard" to "compact"
  sectionSpacing: "normal",
  skillsStyle: "pills",
  bulletStyle: "dot",
  dividerStyle: "line",
  nameSize: "medium",
  nameStyle: "titlecase",
  datePosition: "below",
  includePhoto: false,
  photoPosition: "left",
}

const FONT_OPTIONS: { value: ResumeStyleOptions["fontFamily"]; label: string; description: string }[] = [
  { value: "helvetica", label: "Helvetica", description: "Clean & modern" },
  { value: "arial", label: "Arial", description: "Universal & readable" },
  { value: "roboto", label: "Roboto", description: "Contemporary & friendly" },
  { value: "times", label: "Times", description: "Classic & traditional" },
  { value: "courier", label: "Courier", description: "Technical & precise" },
  { value: "georgia", label: "Georgia", description: "Elegant serif" },
  { value: "palatino", label: "Palatino", description: "Refined & readable" },
]

const COLOR_OPTIONS: { value: ResumeStyleOptions["colorScheme"]; label: string; primary: string; preview: string }[] = [
  { value: "classic-green", label: "Classic Green", primary: "#2D6A4F", preview: "bg-emerald-700" },
  { value: "corporate-blue", label: "Corporate Blue", primary: "#1E40AF", preview: "bg-blue-800" },
  { value: "elegant-gray", label: "Elegant Gray", primary: "#374151", preview: "bg-gray-700" },
  { value: "modern-teal", label: "Modern Teal", primary: "#0F766E", preview: "bg-teal-700" },
  { value: "professional-navy", label: "Professional Navy", primary: "#1E3A5F", preview: "bg-slate-800" },
  { value: "minimalist-black", label: "Minimalist Black", primary: "#18181B", preview: "bg-zinc-900" },
  { value: "warm-burgundy", label: "Warm Burgundy", primary: "#7F1D1D", preview: "bg-red-900" },
  { value: "creative-purple", label: "Creative Purple", primary: "#581C87", preview: "bg-purple-900" },
  { value: "custom", label: "Custom", primary: "#000000", preview: "bg-gradient-to-r from-purple-500 to-pink-500" },
]

const HEADER_ALIGNMENT_OPTIONS: { value: ResumeStyleOptions["headerAlignment"]; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

const MARGIN_OPTIONS: { value: ResumeStyleOptions["margins"]; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "standard", label: "Standard" },
  { value: "spacious", label: "Spacious" },
]

const SPACING_OPTIONS: { value: ResumeStyleOptions["sectionSpacing"]; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
]

const SKILLS_OPTIONS: { value: ResumeStyleOptions["skillsStyle"]; label: string }[] = [
  { value: "pills", label: "Pills" },
  { value: "list", label: "List" },
  { value: "inline", label: "Inline" },
  { value: "columns", label: "Columns" },
]

const BULLET_OPTIONS: { value: ResumeStyleOptions["bulletStyle"]; label: string; symbol: string }[] = [
  { value: "dot", label: "Dot", symbol: "•" },
  { value: "dash", label: "Dash", symbol: "–" },
  { value: "arrow", label: "Arrow", symbol: "→" },
  { value: "square", label: "Square", symbol: "■" },
  { value: "circle", label: "Circle", symbol: "○" },
]

const DIVIDER_OPTIONS: { value: ResumeStyleOptions["dividerStyle"]; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "double-line", label: "Double" },
  { value: "dotted", label: "Dotted" },
  { value: "thick", label: "Thick" },
  { value: "none", label: "None" },
]

const NAME_SIZE_OPTIONS: { value: ResumeStyleOptions["nameSize"]; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
]

const NAME_STYLE_OPTIONS: { value: ResumeStyleOptions["nameStyle"]; label: string }[] = [
  { value: "uppercase", label: "UPPERCASE" },
  { value: "titlecase", label: "Title Case" },
  { value: "lowercase", label: "lowercase" },
]

const DATE_POSITION_OPTIONS: { value: ResumeStyleOptions["datePosition"]; label: string }[] = [
  { value: "right", label: "Right" },
  { value: "below", label: "Below" },
  { value: "inline", label: "Inline" },
]

const FONT_SCALE_OPTIONS: { value: ResumeStyleOptions["fontScale"]; label: string; description: string }[] = [
  { value: "xs", label: "XS", description: "Extra small" },
  { value: "s", label: "S", description: "Small" },
  { value: "m", label: "M", description: "Medium" },
  { value: "l", label: "L", description: "Large" },
  { value: "xl", label: "XL", description: "Extra large" },
]

const PHOTO_POSITION_OPTIONS: { value: ResumeStyleOptions["photoPosition"]; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
]

interface ResumeStyleOptionsCardProps {
  styleOptions?: ResumeStyleOptions
  onStyleOptionsChange?: (options: ResumeStyleOptions) => void
  value?: ResumeStyleOptions
  onChange?: (options: ResumeStyleOptions) => void
  hasHeadshot?: boolean
}

export function ResumeStyleOptionsCard({
  styleOptions: styleOptionsProp,
  onStyleOptionsChange,
  value,
  onChange,
  hasHeadshot = false,
}: ResumeStyleOptionsCardProps) {
  const styleOptions = styleOptionsProp ?? value ?? DEFAULT_STYLE
  const handleChange = onStyleOptionsChange ?? onChange ?? (() => {})
  // Use toast from sonner
  // const { toast } = useToast()

  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const randomizeStyle = () => {
    const randomOption = <T,>(options: { value: T }[]): T => {
      return options[Math.floor(Math.random() * options.length)].value
    }

    handleChange({
      fontFamily: randomOption(FONT_OPTIONS),
      fontScale: randomOption(FONT_SCALE_OPTIONS),
      colorScheme: randomOption(COLOR_OPTIONS),
      nameHeaderAlignment: randomOption(HEADER_ALIGNMENT_OPTIONS),
      headerAlignment: randomOption(HEADER_ALIGNMENT_OPTIONS),
      margins: randomOption(MARGIN_OPTIONS),
      sectionSpacing: randomOption(SPACING_OPTIONS),
      skillsStyle: randomOption(SKILLS_OPTIONS),
      bulletStyle: randomOption(BULLET_OPTIONS),
      dividerStyle: randomOption(DIVIDER_OPTIONS),
      nameSize: randomOption(NAME_SIZE_OPTIONS),
      nameStyle: randomOption(NAME_STYLE_OPTIONS),
      datePosition: randomOption(DATE_POSITION_OPTIONS),
      includePhoto: randomOption([true, false]),
      photoPosition: randomOption(PHOTO_POSITION_OPTIONS),
    })
  }

  const resetToDefault = () => {
    handleChange(DEFAULT_STYLE)
  }

  const saveAsDefault = () => {
    localStorage.setItem("resumeStyleDefaults", JSON.stringify(styleOptions))
    toast.success("Style saved", {
      description: "Your style has been saved as the default.",
      duration: 2000,
    })
  }

  const exportStyle = () => {
    const encoded = encodeToBase64(JSON.stringify(styleOptions))
    navigator.clipboard.writeText(encoded)
    toast.success("Style copied to clipboard", {
      description: "You can share this code or paste it later to restore your style.",
      duration: 2000,
    })
  }

  const importStyle = () => {
    try {
      const decoded = JSON.parse(atob(importText.trim()))
      handleChange(decoded)
      setShowImport(false)
      setImportText("")
      toast.success("Style imported", {
        description: "Your style configuration has been applied.",
        duration: 2000,
      })
    } catch {
      toast.error("Invalid style code", {
        description: "The style code you entered is not valid.",
        duration: 2000,
      })
    }
  }

  const OptionButton = <T extends string>({
    selected,
    value: optValue,
    onClick,
    children,
    className = "",
  }: {
    selected: boolean
    value: T
    onClick: () => void
    children: React.ReactNode
    className?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-1.5 py-0.5 text-xs rounded border transition-all !w-auto flex-shrink-0 min-w-fit whitespace-nowrap ${
        selected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"
      } ${className}`}
    >
      {children}
    </button>
  )

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="rounded-2xl border-primary/10 bg-card/50 backdrop-blur-sm shadow-lg shadow-primary/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 px-4">
            <div className="flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl p-2 -m-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/30">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Resume Style</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground/80">Customize appearance</CardDescription>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0 px-4 pb-4">
            {/* Row 1: Font & Scale */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-8">Font</Label>
                <div className="flex flex-wrap gap-1">
                  {FONT_OPTIONS.map((font) => (
                    <OptionButton
                      key={font.value}
                      selected={styleOptions.fontFamily === font.value}
                      value={font.value}
                      onClick={() => handleChange({ ...styleOptions, fontFamily: font.value })}
                    >
                      {font.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-8">Scale</Label>
                <div className="flex gap-1">
                  {FONT_SCALE_OPTIONS.map((scale) => (
                    <OptionButton
                      key={scale.value}
                      selected={styleOptions.fontScale === scale.value}
                      value={scale.value}
                      onClick={() => handleChange({ ...styleOptions, fontScale: scale.value })}
                    >
                      {scale.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Color Scheme */}
            <div className="flex items-center gap-1.5">
              <Label className="text-[9px] text-muted-foreground/70 w-8">Color</Label>
              <div className="flex flex-wrap gap-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange({ ...styleOptions, colorScheme: color.value })}
                    className={`flex items-center gap-1 px-1.5 py-0.5 text-xs rounded border transition-all !w-auto flex-shrink-0 min-w-fit whitespace-nowrap ${
                      styleOptions.colorScheme === color.value
                        ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                        : "bg-background hover:bg-muted border-border"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${color.preview}`} />
                    {color.label.replace(" ", "")}
                  </button>
                ))}
              </div>
            </div>

            {styleOptions.colorScheme === "custom" && (
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-8">Hex</Label>
                <input
                  type="text"
                  placeholder="#000000"
                  value={styleOptions.customColor || ""}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow valid hex characters
                    if (/^#?[0-9A-Fa-f]{0,6}$/.test(value)) {
                      const hexValue = value.startsWith("#") ? value : `#${value}`
                      handleChange({ ...styleOptions, customColor: hexValue })
                    }
                  }}
                  className="flex-1 px-2 py-0.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  maxLength={7}
                />
                {styleOptions.customColor && /^#[0-9A-Fa-f]{6}$/.test(styleOptions.customColor) && (
                  <span
                    className="w-4 h-4 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: styleOptions.customColor }}
                  />
                )}
              </div>
            )}

            {/* Row 3: Name Options */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Name</Label>
                <div className="flex gap-1">
                  {NAME_SIZE_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.nameSize === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, nameSize: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-10">Style</Label>
                <div className="flex gap-1">
                  {NAME_STYLE_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.nameStyle === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, nameStyle: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-10">Align</Label>
                <div className="flex gap-1">
                  {HEADER_ALIGNMENT_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.nameHeaderAlignment === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, nameHeaderAlignment: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 4: Layout */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Margins</Label>
                <div className="flex gap-1">
                  {MARGIN_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.margins === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, margins: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Spacing</Label>
                <div className="flex gap-1">
                  {SPACING_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.sectionSpacing === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, sectionSpacing: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Sect Align</Label>
                <div className="flex gap-1">
                  {HEADER_ALIGNMENT_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.headerAlignment === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, headerAlignment: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 5: Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-10">Skills</Label>
                <div className="flex gap-1">
                  {SKILLS_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.skillsStyle === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, skillsStyle: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-10">Bullets</Label>
                <div className="flex gap-1">
                  {BULLET_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.bulletStyle === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, bulletStyle: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 6: Dividers & Dates */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Dividers</Label>
                <div className="flex gap-1">
                  {DIVIDER_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.dividerStyle === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, dividerStyle: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-10">Dates</Label>
                <div className="flex gap-1">
                  {DATE_POSITION_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.value}
                      selected={styleOptions.datePosition === opt.value}
                      value={opt.value}
                      onClick={() => handleChange({ ...styleOptions, datePosition: opt.value })}
                    >
                      {opt.label}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo Options Row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-muted-foreground/70" />
                <span className="text-[10px] font-medium text-muted-foreground/70">Photo</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Label className="text-[9px] text-muted-foreground/70 w-12">Include</Label>
                <div className="flex gap-1">
                  <OptionButton
                    selected={styleOptions.includePhoto === false}
                    onClick={() => handleChange({ ...styleOptions, includePhoto: false })}
                  >
                    No
                  </OptionButton>
                  <OptionButton
                    selected={styleOptions.includePhoto === true}
                    onClick={() => handleChange({ ...styleOptions, includePhoto: true })}
                    disabled={!hasHeadshot}
                  >
                    Yes
                  </OptionButton>
                </div>
                {!hasHeadshot && <span className="text-[8px] text-muted-foreground/50 ml-1">(Upload in Settings)</span>}
              </div>

              {styleOptions.includePhoto && (
                <div className="flex items-center gap-1.5">
                  <Label className="text-[9px] text-muted-foreground/70 w-12">Position</Label>
                  <div className="flex gap-1">
                    {PHOTO_POSITION_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt.value}
                        selected={styleOptions.photoPosition === opt.value}
                        onClick={() => handleChange({ ...styleOptions, photoPosition: opt.value })}
                      >
                        {opt.label}
                      </OptionButton>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={randomizeStyle}
                  className="h-6 px-2 text-xs gap-1 !w-auto bg-transparent"
                >
                  <Shuffle className="w-2.5 h-2.5" />
                  Randomize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefault}
                  className="h-6 px-2 text-xs gap-1 !w-auto bg-transparent"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Reset
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveAsDefault}
                  className="h-6 px-2 text-xs gap-1 bg-transparent !w-auto"
                >
                  <Save className="w-2.5 h-2.5" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportStyle}
                  className="h-6 px-2 text-xs gap-1 bg-transparent !w-auto"
                >
                  <Download className="w-2.5 h-2.5" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImport(!showImport)}
                  className="h-6 px-2 text-xs gap-1 !w-auto"
                >
                  <Upload className="w-2.5 h-2.5" />
                  Import
                </Button>
              </div>
            </div>

            {/* Import Section */}
            {showImport && (
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste style code..."
                  className="w-full p-1.5 text-xs border rounded bg-background min-h-[40px] resize-none"
                />
                <Button onClick={importStyle} size="sm" className="w-full h-6 text-xs">
                  Apply
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export function getDefaultStyleOptions(): ResumeStyleOptions {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("resumeStyleDefaults")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return DEFAULT_STYLE
      }
    }
  }
  return DEFAULT_STYLE
}
