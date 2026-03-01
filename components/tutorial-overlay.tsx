"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, ArrowRight, CheckCircle2, MousePointer2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TutorialStep {
  id: string
  targetSelector: string
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right" | "center"
  action?: "click" | "input" | "upload" | "none"
  nextTrigger?: "click" | "manual" | "auto"
  highlightPadding?: number
}

interface TutorialOverlayProps {
  steps: TutorialStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  storageKey?: string
}

interface SpotlightPosition {
  top: number
  left: number
  width: number
  height: number
}

export function TutorialOverlay({
  steps,
  isActive,
  onComplete,
  onSkip,
  storageKey = "tutorial-completed",
}: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [spotlightPosition, setSpotlightPosition] = useState<SpotlightPosition | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)

  const currentStep = steps[currentStepIndex]

  const updatePositions = useCallback(() => {
    if (!currentStep) return

    const target = document.querySelector(currentStep.targetSelector)
    if (!target) {
      // If target not found, try again after a short delay
      setTimeout(updatePositions, 100)
      return
    }

    const rect = target.getBoundingClientRect()
    const padding = currentStep.highlightPadding ?? 8

    setSpotlightPosition({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })

    // Calculate tooltip position based on preferred position
    const tooltipWidth = 320
    const tooltipHeight = 180
    const margin = 16

    let tooltipTop = 0
    let tooltipLeft = 0

    const position = currentStep.position || "bottom"

    switch (position) {
      case "top":
        tooltipTop = rect.top + window.scrollY - tooltipHeight - margin
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case "bottom":
        tooltipTop = rect.bottom + window.scrollY + margin
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case "left":
        tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.left - tooltipWidth - margin
        break
      case "right":
        tooltipTop = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2
        tooltipLeft = rect.right + margin
        break
      case "center":
        tooltipTop = window.innerHeight / 2 - tooltipHeight / 2 + window.scrollY
        tooltipLeft = window.innerWidth / 2 - tooltipWidth / 2
        break
    }

    // Ensure tooltip stays within viewport
    tooltipLeft = Math.max(margin, Math.min(window.innerWidth - tooltipWidth - margin, tooltipLeft))
    tooltipTop = Math.max(margin + window.scrollY, tooltipTop)

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
  }, [currentStep])

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false)
      return
    }

    // Small delay to allow DOM to render
    const timeout = setTimeout(() => {
      setIsVisible(true)
      updatePositions()
    }, 100)

    return () => clearTimeout(timeout)
  }, [isActive, updatePositions])

  useEffect(() => {
    if (!isVisible) return

    updatePositions()

    window.addEventListener("resize", updatePositions)
    window.addEventListener("scroll", updatePositions)

    return () => {
      window.removeEventListener("resize", updatePositions)
      window.removeEventListener("scroll", updatePositions)
    }
  }, [isVisible, currentStepIndex, updatePositions])

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true")
    setIsVisible(false)
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true")
    setIsVisible(false)
    onSkip()
  }

  if (!isActive || !isVisible || !spotlightPosition) {
    return null
  }

  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" style={{ height: "200vh" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="200%" fill="white" />
            <rect
              x={spotlightPosition.left}
              y={spotlightPosition.top}
              width={spotlightPosition.width}
              height={spotlightPosition.height}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="200%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
          onClick={handleSkip}
        />
      </svg>

      {/* Animated border around spotlight */}
      <div
        className="absolute pointer-events-none rounded-xl"
        style={{
          top: spotlightPosition.top,
          left: spotlightPosition.left,
          width: spotlightPosition.width,
          height: spotlightPosition.height,
          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)",
          animation: "pulse-border 2s ease-in-out infinite",
        }}
      />

      {/* Click indicator animation */}
      {currentStep.action === "click" && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: spotlightPosition.top + spotlightPosition.height / 2 - 20,
            left: spotlightPosition.left + spotlightPosition.width / 2 - 20,
          }}
        >
          <div className="relative">
            <MousePointer2 className="w-10 h-10 text-primary animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
        </div>
      )}

      {/* Tooltip Card */}
      <Card
        className="absolute pointer-events-auto w-80 bg-card/95 backdrop-blur-md border-primary/30 shadow-2xl"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          animation: "fadeInUp 0.3s ease-out",
        }}
      >
        <CardContent className="p-5">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={`step-${idx}`}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === currentStepIndex
                      ? "w-6 bg-primary"
                      : idx < currentStepIndex
                        ? "bg-primary/50"
                        : "bg-muted",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold mb-2">{currentStep.title}</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{currentStep.description}</p>

          {/* Action hint */}
          {currentStep.action && currentStep.action !== "none" && (
            <div className="flex items-center gap-2 text-xs text-primary mb-4 p-2 rounded-lg bg-primary/10">
              <MousePointer2 className="w-4 h-4" />
              <span>
                {currentStep.action === "click" && "Click on the highlighted area"}
                {currentStep.action === "input" && "Enter text in the highlighted field"}
                {currentStep.action === "upload" && "Upload a file to continue"}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground bg-transparent">
              Skip tutorial
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-2">
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Got it!
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Persistent guide component - less intrusive, shows next action
interface PersistentGuideProps {
  targetSelector: string
  message: string
  isVisible: boolean
  position?: "top" | "bottom"
}

export function PersistentGuide({ targetSelector, message, isVisible, position = "bottom" }: PersistentGuideProps) {
  const [guidePosition, setGuidePosition] = useState({ top: 0, left: 0 })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setIsReady(false)
      return
    }

    const updatePosition = () => {
      const target = document.querySelector(targetSelector)
      if (!target) return

      const rect = target.getBoundingClientRect()
      const guideWidth = 200
      const margin = 8

      let top = 0
      const left = rect.left + rect.width / 2 - guideWidth / 2

      if (position === "bottom") {
        top = rect.bottom + window.scrollY + margin
      } else {
        top = rect.top + window.scrollY - 40 - margin
      }

      setGuidePosition({ top, left: Math.max(margin, Math.min(window.innerWidth - guideWidth - margin, left)) })
      setIsReady(true)
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition)
    }
  }, [isVisible, targetSelector, position])

  if (!isVisible || !isReady) return null

  return (
    <div
      className="fixed z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-lg animate-bounce"
      style={{
        top: guidePosition.top,
        left: guidePosition.left,
      }}
    >
      <MousePointer2 className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}

// Hook to manage tutorial state
export function useTutorial(storageKey: string) {
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true) // Default to true to prevent flash
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === "true"
    setHasCompletedTutorial(completed)
    if (!completed) {
      // Small delay before showing tutorial
      setTimeout(() => setShowTutorial(true), 500)
    }
  }, [storageKey])

  const completeTutorial = () => {
    localStorage.setItem(storageKey, "true")
    setHasCompletedTutorial(true)
    setShowTutorial(false)
  }

  const resetTutorial = () => {
    localStorage.removeItem(storageKey)
    setHasCompletedTutorial(false)
    setShowTutorial(true)
  }

  return {
    hasCompletedTutorial,
    showTutorial,
    setShowTutorial,
    completeTutorial,
    resetTutorial,
  }
}
