"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface TutorialStep {
  targetId: string
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
}

const tutorialSteps: TutorialStep[] = [
  {
    targetId: "monitoring-status",
    title: "Monitoring Status",
    description: "See if CallMail is actively watching your inbox. Pause or resume anytime.",
    position: "bottom",
  },
  {
    targetId: "vip-contacts",
    title: "VIP Contacts",
    description: "Add email addresses of important people. Get called when they email you.",
    position: "top",
  },
  {
    targetId: "important-keywords",
    title: "Important Keywords",
    description: "Add keywords like 'urgent'. Get called when any email contains them.",
    position: "top",
  },
  {
    targetId: "settings-button",
    title: "Settings",
    description: "Adjust preferences, check frequency, and manage your account.",
    position: "bottom",
  },
]

interface TutorialOverlayProps {
  onComplete: () => void
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePosition = () => {
      const step = tutorialSteps[currentStep]
      const target = document.getElementById(step.targetId)

      if (!target || !tooltipRef.current) return

      const targetRect = target.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const padding = 16

      let top = 0
      let left = 0
      let arrowTop = 0
      let arrowLeft = 0

      switch (step.position) {
        case "bottom":
          top = targetRect.bottom + padding
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
          arrowTop = -8
          arrowLeft = tooltipRect.width / 2 - 8
          break
        case "top":
          top = targetRect.top - tooltipRect.height - padding
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
          arrowTop = tooltipRect.height - 1
          arrowLeft = tooltipRect.width / 2 - 8
          break
        case "left":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
          left = targetRect.left - tooltipRect.width - padding
          arrowTop = tooltipRect.height / 2 - 8
          arrowLeft = tooltipRect.width - 1
          break
        case "right":
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
          left = targetRect.right + padding
          arrowTop = tooltipRect.height / 2 - 8
          arrowLeft = -8
          break
      }

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left < padding) left = padding
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding
      }
      if (top < padding) top = padding
      if (top + tooltipRect.height > viewportHeight - padding) {
        top = viewportHeight - tooltipRect.height - padding
      }

      setTooltipStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1002,
      })

      setArrowStyle({
        position: "absolute",
        top: `${arrowTop}px`,
        left: `${arrowLeft}px`,
      })

      target.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    updatePosition()

    window.addEventListener("resize", updatePosition)
    const timeout = setTimeout(updatePosition, 100)

    return () => {
      window.removeEventListener("resize", updatePosition)
      clearTimeout(timeout)
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const step = tutorialSteps[currentStep]
  const isLastStep = currentStep === tutorialSteps.length - 1

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[999] bg-background/90 backdrop-blur-sm" />

      {/* Highlight current element */}
      <style jsx global>{`
        #${step.targetId} {
          position: relative;
          z-index: 1001;
          box-shadow: 0 0 0 4px hsl(var(--foreground)), 0 0 24px 8px hsl(var(--foreground) / 0.2);
          border-radius: 1rem;
        }
      `}</style>

      {/* Tooltip */}
      <div ref={tooltipRef} style={tooltipStyle} className="relative">
        <div className="w-72 rounded-2xl border border-border bg-card p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-foreground">{step.title}</h3>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{tutorialSteps.length}
            </span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          <Button className="w-full rounded-full" size="sm" onClick={handleNext}>
            {isLastStep ? "Finish" : "Next"}
          </Button>
        </div>

        {/* Arrow */}
        <div
          style={arrowStyle}
          className={`h-4 w-4 rotate-45 bg-card border-border ${
            step.position === "bottom"
              ? "border-l border-t"
              : step.position === "top"
                ? "border-r border-b"
                : step.position === "left"
                  ? "border-r border-t"
                  : "border-l border-b"
          }`}
        />
      </div>
    </>
  )
}
