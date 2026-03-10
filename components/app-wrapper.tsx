"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "./splash-screen"
import { OfflineScreen } from "./offline-screen"
import { isNativeApp } from "@/lib/native-bridge"

interface AppWrapperProps {
  children: React.ReactNode
  showSplash?: boolean
}

export function AppWrapper({ children, showSplash = false }: AppWrapperProps) {
  const [splashComplete, setSplashComplete] = useState(!showSplash)
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    // Only show splash in native app
    setIsNative(isNativeApp())
    if (!isNativeApp()) {
      setSplashComplete(true)
    }
  }, [])

  return (
    <>
      {/* Splash screen - only shown in native app on first load */}
      {showSplash && isNative && !splashComplete && (
        <SplashScreen onComplete={() => setSplashComplete(true)} minDuration={2500} />
      )}

      {/* Offline screen - shown when no connection */}
      <OfflineScreen />

      {/* Main content - always rendered but hidden during splash */}
      <div
        style={{
          visibility: splashComplete ? "visible" : "hidden",
          opacity: splashComplete ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        {children}
      </div>
    </>
  )
}
