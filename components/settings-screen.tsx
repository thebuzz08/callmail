"use client"

import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Clock,
  FileText,
  Shield,
  ExternalLink,
  LogOut,
  Download,
  Phone,
  MoonStar,
  Trash2,
  CreditCard,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState, useEffect } from "react"

export type Theme = "light" | "dark" | "system"

const BACKGROUND_CHECK_INTERVALS = [
  { label: "1 minute", value: 1 },
  { label: "2 minutes", value: 2 },
  { label: "3 minutes", value: 3 },
  { label: "5 minutes", value: 5 },
]

interface SettingsScreenProps {
  onBack: () => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  checkIntervalMinutes: number
  onCheckIntervalChange: (minutes: number) => void
  onLogout: () => void
  onDeleteAccount: () => void
  userEmail?: string
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  quietHoursTimezone: string
  onQuietHoursChange: (settings: {
    quiet_hours_enabled?: boolean
    quiet_hours_start?: string
    quiet_hours_end?: string
    quiet_hours_timezone?: string
  }) => void
  subscription?: {
    status: string
    trial_end: string | null
    cancel_at_period_end: boolean
    current_period_end: string | null
  } | null
}

export function SettingsScreen({
  onBack,
  theme,
  onThemeChange,
  checkIntervalMinutes,
  onCheckIntervalChange,
  onLogout,
  onDeleteAccount,
  userEmail,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
  quietHoursTimezone,
  onQuietHoursChange,
  subscription,
}: SettingsScreenProps) {
  const [twilioNumber, setTwilioNumber] = useState("+1234567890")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true)
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error("Failed to open portal:", e)
    }
    setIsOpeningPortal(false)
  }

  useEffect(() => {
    fetch("/api/get-twilio-number")
      .then((res) => res.json())
      .then((data) => {
        if (data.phoneNumber) {
          setTwilioNumber(data.phoneNumber)
        }
      })
      .catch(() => {})
  }, [])

  const downloadContactCard = async () => {
    try {
      const response = await fetch("/images/callmail-contact-photo.jpg")
      const blob = await response.blob()
      const reader = new FileReader()

      reader.onloadend = () => {
        const base64data = reader.result as string
        const base64Image = base64data.split(",")[1]

        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Important Email...
TEL;TYPE=CELL:${twilioNumber}
PHOTO;ENCODING=b;TYPE=JPEG:${base64Image}
NOTE:CallMail - Important email alerts
END:VCARD`

        const vcardBlob = new Blob([vcard], { type: "text/vcard" })
        const url = URL.createObjectURL(vcardBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = "CallMail.vcf"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      reader.readAsDataURL(blob)
    } catch {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Important Email...
TEL;TYPE=CELL:${twilioNumber}
NOTE:CallMail - Important email alerts
END:VCARD`

      const vcardBlob = new Blob([vcard], { type: "text/vcard" })
      const url = URL.createObjectURL(vcardBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = "CallMail.vcf"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/user/delete-account")
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `callmail-data-export-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch {
      console.error("Failed to export data")
    }
    setIsExporting(false)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (response.ok) {
        onDeleteAccount()
      }
    } catch {
      console.error("Failed to delete account")
    }
    setIsDeleting(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-medium text-foreground">Settings</h1>
      </div>

      {/* Appearance */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Appearance</h2>
        <div className="space-y-2">
          <button
            onClick={() => onThemeChange("light")}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-colors ${
              theme === "light" ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Sun className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Light</p>
              <p className="text-sm text-muted-foreground">Bright and clean</p>
            </div>
          </button>

          <button
            onClick={() => onThemeChange("dark")}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-colors ${
              theme === "dark" ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <Moon className="h-5 w-5 text-slate-300" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Dark</p>
              <p className="text-sm text-muted-foreground">Easy on the eyes</p>
            </div>
          </button>

          <button
            onClick={() => onThemeChange("system")}
            className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-colors ${
              theme === "system" ? "border-foreground bg-secondary" : "border-border hover:bg-secondary/50"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-slate-800">
              <Monitor className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">System</p>
              <p className="text-sm text-muted-foreground">Match device settings</p>
            </div>
          </button>
        </div>
      </div>

      {/* Check Frequency - Updated for background checking */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Background Check Frequency
        </h2>
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-foreground" />
            <span className="font-medium text-foreground">Email check interval</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            How often to check for new emails when monitoring is active (even when app is closed)
          </p>
          <Select
            value={checkIntervalMinutes.toString()}
            onValueChange={(value) => onCheckIntervalChange(Number.parseInt(value))}
          >
            <SelectTrigger className="w-full rounded-xl border-border bg-secondary">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_CHECK_INTERVALS.map((interval) => (
                <SelectItem key={interval.value} value={interval.value.toString()}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Quiet Hours</h2>
        <div className="rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MoonStar className="h-5 w-5 text-foreground" />
              <div>
                <p className="font-medium text-foreground">Do Not Disturb</p>
                <p className="text-sm text-muted-foreground">No calls during these hours</p>
              </div>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={(checked) => onQuietHoursChange({ quiet_hours_enabled: checked })}
            />
          </div>

          {quietHoursEnabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">From</label>
                  <Select
                    value={quietHoursStart}
                    onValueChange={(value) => onQuietHoursChange({ quiet_hours_start: value })}
                  >
                    <SelectTrigger className="w-full rounded-xl border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0")
                        const label = i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`
                        return <SelectItem key={hour} value={`${hour}:00`}>{label}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">To</label>
                  <Select
                    value={quietHoursEnd}
                    onValueChange={(value) => onQuietHoursChange({ quiet_hours_end: value })}
                  >
                    <SelectTrigger className="w-full rounded-xl border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0")
                        const label = i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`
                        return <SelectItem key={hour} value={`${hour}:00`}>{label}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Timezone</label>
                <Select
                  value={quietHoursTimezone}
                  onValueChange={(value) => onQuietHoursChange({ quiet_hours_timezone: value })}
                >
                  <SelectTrigger className="w-full rounded-xl border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii (HT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscription */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Subscription</h2>
        <div className="rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-foreground" />
              <div>
                <p className="font-medium text-foreground">CallMail Pro</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.status === "trialing"
                    ? `Free trial${subscription.trial_end ? ` until ${new Date(subscription.trial_end).toLocaleDateString()}` : ""}`
                    : subscription?.status === "active"
                      ? subscription.cancel_at_period_end
                        ? `Cancels ${subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "at period end"}`
                        : "$6.99/month"
                      : subscription?.status === "past_due"
                        ? "Payment issue - please update billing"
                        : "Active"}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              subscription?.status === "trialing"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : subscription?.status === "active"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : subscription?.status === "past_due"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
            }`}>
              {subscription?.status === "trialing" ? "Trial" :
               subscription?.status === "active" ? "Active" :
               subscription?.status === "past_due" ? "Past Due" :
               subscription?.status || "Active"}
            </span>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-full bg-transparent gap-2"
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
          >
            <CreditCard className="h-4 w-4" />
            {isOpeningPortal ? "Opening..." : "Manage Billing"}
          </Button>
        </div>
      </div>

      {/* Legal */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Legal</h2>
        <div className="space-y-2">
          <Link
            href="/privacy"
            className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-foreground" />
              <span className="font-medium text-foreground">Privacy Policy</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            href="/terms"
            className="flex w-full items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-foreground" />
              <span className="font-medium text-foreground">Terms of Service</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Account */}
      <div className="mb-4">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wide">Account</h2>
        {userEmail && (
          <p className="text-sm text-muted-foreground mb-4">
            Signed in as <span className="font-medium text-foreground">{userEmail}</span>
          </p>
        )}

        <div className="mb-3 rounded-xl border border-border p-4 bg-secondary/30">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="h-5 w-5 text-foreground" />
            <span className="font-medium text-foreground">CallMail Contact</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Your CallMail number: <span className="font-medium text-foreground">{twilioNumber}</span>
          </p>
          <Button variant="outline" className="w-full rounded-full gap-2 bg-transparent" onClick={downloadContactCard}>
            <Download className="h-4 w-4" />
            Download Contact Card
          </Button>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full rounded-full bg-transparent gap-2"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export My Data"}
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full border-border bg-transparent gap-2"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and all associated data including your VIP contacts,
                  keywords, call history, and settings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-muted-foreground">CallMail v1.0.0</p>
      </div>
    </div>
  )
}
