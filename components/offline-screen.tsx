"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfflineScreen() {
  const [isOffline, setIsOffline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    
    // Try to fetch a small resource to check connectivity
    try {
      await fetch("/api/health", { cache: "no-store" })
      setIsOffline(false)
    } catch {
      // Still offline
    }
    
    setIsRetrying(false)
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[99] flex flex-col items-center justify-center bg-background"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: "30px 30px",
              }}
            />
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center px-6 text-center"
          >
            {/* Disconnected icon with pulse */}
            <motion.div
              className="relative mb-6"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <WifiOff className="w-10 h-10 text-muted-foreground" />
              </div>
              
              {/* Pulse rings */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-muted-foreground/20"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            </motion.div>

            <h1 className="text-2xl font-semibold mb-2">You're Offline</h1>
            
            <p className="text-muted-foreground mb-8 max-w-xs">
              Check your internet connection and try again. Your settings are saved locally.
            </p>

            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="min-w-[140px] h-12 rounded-full"
            >
              {isRetrying ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>

            {/* Connection status dots */}
            <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <motion.div
                className="w-2 h-2 rounded-full bg-amber-500"
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <span>Waiting for connection</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
