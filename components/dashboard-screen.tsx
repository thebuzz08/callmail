"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Settings, Phone, ChevronDown, ChevronUp, Search, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TutorialOverlay } from "@/components/tutorial-overlay"
import type { UserSession, VipContact, Keyword, VipDomain } from "@/app/app/page"

interface DashboardScreenProps {
  watchedEmails: VipContact[]
  onAddEmail: (email: string) => void
  onRemoveEmail: (contactId: string) => void
  watchedDomains: VipDomain[]
  onAddDomain: (domain: string) => void
  onRemoveDomain: (domainId: string) => void
  userSession: UserSession | null
  userPhoneNumber: string
  onPhoneChange: (phone: string) => void
  watchedKeywords: Keyword[]
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keywordId: string) => void
  onOpenSettings: () => void
  checkIntervalMinutes: number
  showPhoneSetup: boolean
  onPhoneSetupComplete: () => void
  hasActiveSubscription?: boolean
  onSubscribe?: () => void
}

export function DashboardScreen({
  watchedEmails,
  onAddEmail,
  onRemoveEmail,
  watchedDomains,
  onAddDomain,
  onRemoveDomain,
  userSession,
  userPhoneNumber,
  onPhoneChange,
  watchedKeywords,
  onAddKeyword,
  onRemoveKeyword,
  onOpenSettings,
  checkIntervalMinutes,
  showPhoneSetup,
  onPhoneSetupComplete,
  hasActiveSubscription,
  onSubscribe,
}: DashboardScreenProps) {
  const [emailInput, setEmailInput] = useState("")
  const [domainInput, setDomainInput] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [error, setError] = useState("")
  const [showAddEmailDialog, setShowAddEmailDialog] = useState(false)
  const [showAddDomainDialog, setShowAddDomainDialog] = useState(false)
  const [showAddKeywordDialog, setShowAddKeywordDialog] = useState(false)
  const [initialPhoneInput, setInitialPhoneInput] = useState("")
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialChecked, setTutorialChecked] = useState(false)
  const [monitoringLoaded, setMonitoringLoaded] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [callHistory, setCallHistory] = useState<Array<{
    id: string
    from_email: string
    subject: string
    status: string
    retry_count: number
    created_at: string
    cost: number | null
  }>>([])
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [callHistoryLoaded, setCallHistoryLoaded] = useState(false)
  const [callSearchQuery, setCallSearchQuery] = useState("")

  useEffect(() => {
    const loadMonitoringState = async () => {
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          const dbMonitoringState = data.settings?.monitoring_active ?? false
          setIsMonitoring(dbMonitoringState)
        }
      } catch (e) {
        console.error("Failed to load monitoring state:", e)
        setIsMonitoring(false)
      }
      setMonitoringLoaded(true)
      setTimeout(() => setInitialLoadComplete(true), 500)
    }
    loadMonitoringState()
  }, [])

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (tutorialChecked) return
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          if (!data.settings?.tutorial_completed && !showPhoneSetup && userPhoneNumber) {
            setShowTutorial(true)
          }
        }
      } catch (e) {
        console.error("Failed to check tutorial status:", e)
      }
      setTutorialChecked(true)
    }

    if (!showPhoneSetup && userPhoneNumber) {
      checkTutorialStatus()
    }
  }, [showPhoneSetup, userPhoneNumber, tutorialChecked])

  const fetchCallHistory = async () => {
    try {
      const response = await fetch("/api/user/call-history")
      if (response.ok) {
        const data = await response.json()
        setCallHistory(data.history || [])
      }
    } catch (e) {
      console.error("Failed to fetch call history:", e)
    }
    setCallHistoryLoaded(true)
  }

  useEffect(() => {
    if (showCallHistory && !callHistoryLoaded) {
      fetchCallHistory()
    }
  }, [showCallHistory, callHistoryLoaded])

  const handleTutorialComplete = async () => {
    setShowTutorial(false)
    try {
      await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_tutorial" }),
      })
    } catch (e) {
      console.error("Failed to save tutorial completion:", e)
    }
  }

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase()

    if (!email) {
      setError("Please enter an email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (watchedEmails.some((c) => c.email === email)) {
      setError("This email is already in your list")
      return
    }

    onAddEmail(email)
    setEmailInput("")
    setShowAddEmailDialog(false)
  }

  const handleAddDomain = () => {
    const domain = domainInput.trim().toLowerCase().replace(/^@/, "") // Remove @ if user includes it
    
    if (!domain) {
      setError("Please enter a domain")
      return
    }

    // Simple domain validation
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain)) {
      setError("Please enter a valid domain (e.g., company.com)")
      return
    }

    if (watchedDomains.some((d) => d.domain.toLowerCase() === domain)) {
      setError("This domain is already in your list")
      return
    }

    setError("")
    onAddDomain(domain)
    setDomainInput("")
    setShowAddDomainDialog(false)
  }

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase()

    if (!keyword) {
      setError("Please enter a keyword")
      return
    }

    if (watchedKeywords.some((k) => k.keyword === keyword)) {
      setError("This keyword is already in your list")
      return
    }

    onAddKeyword(keyword)
    setKeywordInput("")
    setError("")
    setShowAddKeywordDialog(false)
  }

  const handleInitialPhoneSetup = () => {
    const digitsOnly = initialPhoneInput.replace(/\D/g, "")
    if (digitsOnly.length < 10) {
      setError("Please enter a valid phone number")
      return
    }
    onPhoneChange(initialPhoneInput)
    onPhoneSetupComplete()
    setError("")
  }

  const handleMonitoringToggle = async () => {
    // Check if user has subscription before enabling monitoring
    if (!isMonitoring && !hasActiveSubscription) {
      if (onSubscribe) {
        onSubscribe()
      }
      return
    }
    
    const newState = !isMonitoring


    try {
      const dbResponse = await fetch("/api/user/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_monitoring",
          data: {
            monitoring_active: newState,
          },
        }),
      })

      if (!dbResponse.ok) {
        console.error("Failed to update monitoring state in DB")
        return
      }

      setIsMonitoring(newState)


      if (initialLoadComplete) {


        const qstashRes = await fetch("/api/qstash/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: newState ? "start" : "stop",
            intervalMinutes: checkIntervalMinutes,
          }),
        })

        const qstashData = await qstashRes.json()


        if (!qstashRes.ok) {
          console.error("QStash schedule failed:", qstashData)
        }
      } else {

      }
    } catch (e) {
      console.error("Failed to update monitoring state:", e)
      setIsMonitoring(!newState)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8">
      {showTutorial && <TutorialOverlay onComplete={handleTutorialComplete} />}

      {/* Phone setup dialog */}
      <Dialog open={showPhoneSetup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md border-border" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-medium">Enter your phone number</DialogTitle>
            <DialogDescription className="text-center">
              You'll receive calls when important emails arrive.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={initialPhoneInput}
              onChange={(e) => {
                setInitialPhoneInput(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleInitialPhoneSetup()}
              className="rounded-xl border-border bg-background py-6 text-center text-lg"
            />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button className="w-full rounded-full py-6" onClick={handleInitialPhoneSetup}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight text-foreground">CallMail</h1>
        <Button id="settings-button" variant="ghost" size="icon" onClick={onOpenSettings} className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Status indicator */}
      <div
        id="monitoring-status"
        className="mb-8 flex items-center justify-between rounded-2xl border border-border p-4"
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${isMonitoring ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`}
          />
          <div>
            <p className="font-medium text-foreground">{isMonitoring ? "Monitoring active" : "Monitoring paused"}</p>
            <p className="text-sm text-muted-foreground">
              {isMonitoring ? "Running in background" : "Resume to start monitoring"}
            </p>
          </div>
        </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMonitoringToggle}
                disabled={!monitoringLoaded}
                className="rounded-full border-border bg-transparent"
              >
                {!hasActiveSubscription && !isMonitoring ? "Subscribe to Start" : isMonitoring ? "Pause" : "Resume"}
              </Button>
      </div>

      {/* Add Emails section */}
      <div id="vip-contacts" className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Add Emails</h2>
            <p className="text-sm text-muted-foreground">You will get a call any time this person emails you</p>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => setShowAddEmailDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Email list */}
        <div className="space-y-2">
          {watchedEmails.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              (you can change or add to this at any time)
            </p>
          ) : (
            watchedEmails.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm text-foreground">{contact.email}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveEmail(contact.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Domains section */}
      <div id="vip-domains" className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Add Domains</h2>
            <p className="text-sm text-muted-foreground">
              Get calls for any email from @company.com
            </p>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => setShowAddDomainDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Domain list */}
        <div className="space-y-2">
          {watchedDomains.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              (add domains to monitor entire organizations)
            </p>
          ) : (
            watchedDomains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm text-foreground">@{domain.domain}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveDomain(domain.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Subjects section */}
      <div id="important-keywords" className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-foreground">Add Subjects</h2>
            <p className="text-sm text-muted-foreground">
              You will get a call any time there is an email with this subject
            </p>
          </div>
          <Button size="sm" className="rounded-full" onClick={() => setShowAddKeywordDialog(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Keyword list */}
        <div className="space-y-2">
          {watchedKeywords.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              (you can change or add to this at any time)
            </p>
          ) : (
            watchedKeywords.map((kw) => (
              <div key={kw.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                <span className="text-sm text-foreground">{kw.keyword}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveKeyword(kw.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Call History section */}
      <div className="mb-8">
        <button
          onClick={() => setShowCallHistory(!showCallHistory)}
          className="mb-4 flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-medium text-foreground">Recent Calls</h2>
          </div>
          {showCallHistory ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showCallHistory && (
          <div className="space-y-3">
            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or subject..."
                  value={callSearchQuery}
                  onChange={(e) => setCallSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            {/* Call List */}
            {!callHistoryLoaded ? (
              <p className="text-center text-sm text-muted-foreground py-4 animate-pulse">Loading...</p>
            ) : callHistory.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No calls yet</p>
            ) : (() => {
              const filteredCalls = callHistory.filter((call) => {
                // Search filter only
                const query = callSearchQuery.toLowerCase()
                return !query || 
                  call.from_email.toLowerCase().includes(query) ||
                  call.subject.toLowerCase().includes(query)
              })

              if (filteredCalls.length === 0) {
                return (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No calls match your search
                  </p>
                )
              }

              return filteredCalls.map((call) => (
                <div key={call.id} className="rounded-xl border border-border p-4 space-y-1">
                  <span className="text-sm font-medium text-foreground truncate block">
                    {call.from_email}
                  </span>
                  <p className="text-xs text-muted-foreground truncate">{call.subject}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(call.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* Add Email Dialog */}
      <Dialog open={showAddEmailDialog} onOpenChange={setShowAddEmailDialog}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle>Add VIP Contact</DialogTitle>
            <DialogDescription>
              You'll receive a call when this person emails you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="email@example.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full rounded-full" onClick={handleAddEmail}>
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Domain Dialog */}
      <Dialog open={showAddDomainDialog} onOpenChange={setShowAddDomainDialog}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle>Add VIP Domain</DialogTitle>
            <DialogDescription>
              You'll receive a call when anyone from this domain emails you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="company.com"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full rounded-full" onClick={handleAddDomain}>
              Add Domain
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Keyword Dialog */}
      <Dialog open={showAddKeywordDialog} onOpenChange={setShowAddKeywordDialog}>
        <DialogContent className="sm:max-w-md border-border">
          <DialogHeader>
            <DialogTitle>Add Alert Keyword</DialogTitle>
            <DialogDescription>
              You'll receive a call when an email subject contains this keyword.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="urgent, invoice, deadline..."
              value={keywordInput}
              onChange={(e) => {
                setKeywordInput(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full rounded-full" onClick={handleAddKeyword}>
              Add Keyword
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
