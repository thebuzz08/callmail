"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Bell, Shield, ChevronRight, Loader2 } from "lucide-react"
import { isNativeApp, openExternalUrl } from "@/lib/native-bridge"

interface AppIntroScreenProps {
  onLogin: () => void
  onContinueAsGuest?: () => void
}

export function AppIntroScreen({ onLogin }: AppIntroScreenProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/google")
      const data = await res.json()

      if (data.url) {
        if (isNativeApp()) {
          openExternalUrl(data.url)
        } else {
          window.location.href = data.url
        }
      } else {
        setIsLoading(false)
      }
    } catch {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Bell,
      title: "Instant Alerts",
      description: "Get called when important emails arrive"
    },
    {
      icon: Mail,
      title: "VIP Filtering",
      description: "Set contacts, domains & keywords"
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "We only read email metadata"
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background safe-top safe-bottom">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Pulsing rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-32 h-32 rounded-full border-2 border-primary/20 animate-ping-slow" />
            <div className="absolute w-40 h-40 rounded-full border border-primary/10 animate-ping-slower" />
            <div className="absolute w-48 h-48 rounded-full border border-primary/5 animate-ping-slowest" />
          </div>
          
          {/* Logo container with glass effect */}
          <div className="relative z-10 w-24 h-24 rounded-3xl glass-card shadow-glass flex items-center justify-center animate-float">
            <Image
              src="/images/callmail-contact-photo.jpg"
              alt="CallMail"
              width={96}
              height={96}
              className="rounded-3xl"
            />
          </div>
        </div>

        {/* App Name & Tagline */}
        <h1 className="text-3xl font-semibold text-foreground mb-2 text-glass animate-fade-in">
          CallMail
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12 animate-fade-in-delay">
          Never miss an important email again
        </p>

        {/* Feature Cards */}
        <div className="w-full max-w-sm space-y-3 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex items-center gap-4 p-4 rounded-2xl glass squircle animate-slide-up"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="px-8 pb-8 space-y-4">
        {/* Google Sign In Button */}
        <Button
          className="w-full rounded-2xl py-7 text-base font-medium spring-bounce glow-accent squircle"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </Button>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
