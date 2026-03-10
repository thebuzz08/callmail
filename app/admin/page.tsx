"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Phone,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  X,
  FileText,
  ShieldOff,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Clock,
} from "lucide-react"

interface VipContact {
  id: string
  email: string
  name: string | null
}

interface Keyword {
  id: string
  keyword: string
}

interface UserData {
  id: string
  email: string
  name: string | null
  phone_number: string | null
  is_banned: boolean
  is_admin: boolean
  call_count: number
  email_check_count: number
  monitoring_active: boolean
  created_at: string
  vip_contacts: VipContact[]
  keywords: Keyword[]
  total_cost: number
}

interface AuditLog {
  id: string
  event_type: string
  event_category: string
  description: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
}

interface SuspiciousActivity {
  id: string
  user_id: string
  activity_type: string
  severity: string
  description: string | null
  metadata: Record<string, any>
  resolved: boolean
  created_at: string
  users: {
    email: string
    name: string | null
  } | null
}

interface QueueMetrics {
  longestProcessingTimeMs: number
  longestProcessingTimeSec: number
  avgProcessingTimeMs: number
  avgProcessingTimeSec: number
  totalJobsLast24h: number
  totalCallsLast24h: number
  totalUsersCheckedLast24h: number
  percentOfLimit: number
  recentJobs: Array<{
    id: string
    usersChecked: number
    callsTriggered: number
    processingTimeMs: number
    processingTimeSec: number
    createdAt: string
  }>
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)
  const [unauthorizedMessage, setUnauthorizedMessage] = useState<string | null>(null)
  const [viewingLogsFor, setViewingLogsFor] = useState<string | null>(null)
  const [userLogs, setUserLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortBy, setSortBy] = useState<"email" | "calls" | "checks">("email")
  const [showAdminsOnly, setShowAdminsOnly] = useState(false)
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([])
  const [suspiciousLoading, setSuspiciousLoading] = useState(false)
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics | null>(null)

  useEffect(() => {
    checkAdminAndFetchUsers()
    fetchSuspiciousActivity()
    fetchQueueMetrics()
  }, [])

  const fetchQueueMetrics = async () => {
    try {
      const response = await fetch("/api/admin/queue-metrics")
      if (response.ok) {
        const data = await response.json()
        setQueueMetrics(data)
      }
    } catch (error) {
      console.error("Failed to fetch queue metrics:", error)
    }
  }

  const fetchSuspiciousActivity = async () => {
    setSuspiciousLoading(true)
    try {
      const res = await fetch("/api/admin/suspicious-activity?unresolvedOnly=true")
      const data = await res.json()
      if (res.ok) {
        setSuspiciousActivity(data.activities || [])
      }
    } catch (err) {
      console.error("Failed to fetch suspicious activity:", err)
    } finally {
      setSuspiciousLoading(false)
    }
  }

  const resolveSuspiciousActivity = async (activityId: string) => {
    try {
      const res = await fetch("/api/admin/suspicious-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, action: "resolve" }),
      })
      if (res.ok) {
        setSuspiciousActivity(prev => prev.filter(a => a.id !== activityId))
      }
    } catch (err) {
      console.error("Failed to resolve activity:", err)
    }
  }

  const checkAdminAndFetchUsers = async () => {
    try {
      const checkRes = await fetch("/api/admin/check")
      const checkData = await checkRes.json()

      if (!checkRes.ok || !checkData.isAdmin) {
        setUnauthorizedMessage(
          checkData.email
            ? `${checkData.email} is not authorized to access the admin panel.`
            : "You must be logged in to access the admin panel.",
        )
        setTimeout(() => router.push("/app"), 2000)
        return
      }

      setAuthorized(true)
      const res = await fetch("/api/admin/users")
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users")
      }

      setUsers(data.users)
    } catch (err) {
      console.error("Admin error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const toggleBan = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(`ban-${userId}`)
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ban: !currentlyBanned }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update ban status")
      }

      setUsers(users.map((u) => (u.id === userId ? { ...u, is_banned: !currentlyBanned } : u)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update ban status")
    } finally {
      setActionLoading(null)
    }
  }

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setActionLoading(`admin-${userId}`)
    try {
      const res = await fetch("/api/admin/toggle-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, makeAdmin: !currentlyAdmin }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update admin status")
      }

      setUsers(users.map((u) => (u.id === userId ? { ...u, is_admin: !currentlyAdmin } : u)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update admin status")
    } finally {
      setActionLoading(null)
    }
  }

  const toggleMonitoring = async (userId: string, currentlyActive: boolean) => {
    setActionLoading(`monitoring-${userId}`)
    try {
      const res = await fetch("/api/admin/pause-monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pause: currentlyActive }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update monitoring status")
      }

      setUsers(users.map((u) => (u.id === userId ? { ...u, monitoring_active: !currentlyActive } : u)))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update monitoring status")
    } finally {
      setActionLoading(null)
    }
  }

  const fetchUserLogs = async (userId: string, category = "all") => {
    setViewingLogsFor(userId)
    setLogsLoading(true)
    setSelectedCategory(category)
    try {
      const categoryParam = category !== "all" ? `&category=${category}` : ""
      const res = await fetch(`/api/admin/user-logs?userId=${userId}&limit=100${categoryParam}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch logs")
      }

      setUserLogs(data.logs || [])
    } catch (err) {
      console.error("Failed to fetch user logs:", err)
      alert(err instanceof Error ? err.message : "Failed to fetch logs")
      setViewingLogsFor(null)
    } finally {
      setLogsLoading(false)
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "auth":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "security":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "data_modification":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "settings":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "calls":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const handleCategoryChange = (category: string) => {
    if (viewingLogsFor) {
      fetchUserLogs(viewingLogsFor, category)
    }
  }

  const filteredUsers = users
    .filter((user) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        user.email.toLowerCase().includes(query) || (user.name && user.name.toLowerCase().includes(query))
      const matchesAdminFilter = !showAdminsOnly || user.is_admin
      return matchesSearch && matchesAdminFilter
    })
    .sort((a, b) => {
      if (sortBy === "calls") {
        return (b.call_count || 0) - (a.call_count || 0)
      } else if (sortBy === "checks") {
        return (b.email_check_count || 0) - (a.email_check_count || 0)
      }
      // Default: sort by email
      return a.email.localeCompare(b.email)
    })

  if (unauthorizedMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Unauthorized</h1>
          <p className="text-muted-foreground mb-4">{unauthorizedMessage}</p>
          <p className="text-sm text-muted-foreground">Redirecting to app...</p>
        </div>
      </div>
    )
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const totalUsers = users.length
  const bannedUsers = users.filter((u) => u.is_banned).length
  const totalCalls = users.reduce((sum, u) => sum + (u.call_count || 0), 0)
  const adminCount = users.filter((u) => u.is_admin).length
  const totalEmailChecks = users.reduce((sum, u) => sum + (u.email_check_count || 0), 0)
  const activeMonitoringUsers = users.filter((u) => u.monitoring_active).length
  const totalCost = users.reduce((sum, u) => sum + (u.total_cost || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push("/app")} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <Users className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{totalUsers}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <Phone className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{totalCalls}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Calls</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <Mail className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{totalEmailChecks}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Email Checks</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <Shield className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{adminCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Admins</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <Ban className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{bannedUsers}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Banned</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">{activeMonitoringUsers}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Active Monitoring</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-3 sm:p-4 text-center">
            <DollarSign className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xl sm:text-2xl font-bold">${totalCost.toFixed(2)}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Cost</p>
          </div>
        </div>

        {/* Queue Metrics Card */}
        {queueMetrics && (
          <div className={`rounded-2xl p-4 border ${
            queueMetrics.percentOfLimit >= 80 
              ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" 
              : queueMetrics.percentOfLimit >= 50 
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                : "bg-muted/50 border-transparent"
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`w-5 h-5 ${
                queueMetrics.percentOfLimit >= 80 
                  ? "text-red-600 dark:text-red-400" 
                  : queueMetrics.percentOfLimit >= 50 
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              }`} />
              <h2 className="font-medium">Queue Performance (Last 24h)</h2>
              {queueMetrics.percentOfLimit >= 80 && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                  CRITICAL
                </span>
              )}
              {queueMetrics.percentOfLimit >= 50 && queueMetrics.percentOfLimit < 80 && (
                <span className="ml-auto px-2 py-0.5 text-xs rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  WARNING
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className={`text-2xl font-bold ${
                  queueMetrics.percentOfLimit >= 80 
                    ? "text-red-600 dark:text-red-400" 
                    : queueMetrics.percentOfLimit >= 50 
                      ? "text-amber-600 dark:text-amber-400"
                      : ""
                }`}>
                  {queueMetrics.longestProcessingTimeSec}s
                </p>
                <p className="text-xs text-muted-foreground">Longest Queue</p>
                <p className="text-xs text-muted-foreground">({queueMetrics.percentOfLimit}% of 5min limit)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{queueMetrics.avgProcessingTimeSec}s</p>
                <p className="text-xs text-muted-foreground">Avg Processing</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{queueMetrics.totalJobsLast24h}</p>
                <p className="text-xs text-muted-foreground">Jobs Run</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{queueMetrics.totalCallsLast24h}</p>
                <p className="text-xs text-muted-foreground">Calls Made</p>
              </div>
            </div>
            {queueMetrics.percentOfLimit >= 50 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Consider adding another phone number to distribute load if this continues to increase.
              </p>
            )}
          </div>
        )}

        {/* Suspicious Activity Alerts */}
        {suspiciousActivity.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-medium text-amber-800 dark:text-amber-200">
                Suspicious Activity ({suspiciousActivity.length})
              </h2>
            </div>
            <div className="space-y-2">
              {suspiciousActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-3 bg-white dark:bg-background rounded-xl p-3 border border-amber-100 dark:border-amber-900"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        activity.severity === "high"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          : activity.severity === "medium"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
                      }`}>
                        {activity.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">
                        {activity.activity_type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.users?.email || "Unknown user"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const user = users.find(u => u.id === activity.user_id)
                        if (user) setExpandedUser(user.id)
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    >
                      View User
                    </button>
                    <button
                      onClick={() => resolveSuspiciousActivity(activity.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 rounded-lg transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h2 className="text-lg font-medium">All Users</h2>
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "email" | "calls" | "checks")}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="email">Sort by Email</option>
                <option value="calls">Sort by Calls (High to Low)</option>
                <option value="checks">Sort by Checks (High to Low)</option>
              </select>
              <button
                onClick={() => setShowAdminsOnly(!showAdminsOnly)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  showAdminsOnly
                    ? "bg-blue-500 text-white border-blue-500"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {showAdminsOnly ? "Admins Only" : "All Users"}
              </button>
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No users found matching your search" : "No users yet"}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-muted/30 rounded-2xl overflow-hidden">
                <div
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                  className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium truncate">{user.name || "No Name"}</h3>
                        {user.is_admin && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs rounded-full">
                            Admin
                          </span>
                        )}
                        {user.is_banned && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
                            Banned
                          </span>
                        )}
                        {user.monitoring_active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs rounded-full">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">{user.email}</p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span>{user.call_count || 0} calls</span>
                        <span>{user.email_check_count || 0} checks</span>
                      </div>
                    </div>
                    {expandedUser === user.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedUser === user.id && (
                  <div className="border-t border-border p-3 sm:p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="font-medium">{user.call_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Calls</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="font-medium">{user.email_check_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Checks</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="font-medium">${(user.total_cost || 0).toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">Cost</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="font-medium">{user.monitoring_active ? "Active" : "Paused"}</p>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                      {user.name && (
                        <div>
                          <p className="text-muted-foreground mb-1">Name</p>
                          <p>{user.name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground mb-1">User ID</p>
                        <p className="font-mono text-xs truncate">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Joined</p>
                        <p>{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* VIP Contacts */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">VIP Contacts ({user.vip_contacts.length})</p>
                      {user.vip_contacts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.vip_contacts.map((vip) => (
                            <span
                              key={vip.id}
                              className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                            >
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{vip.name || vip.email}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No VIP contacts</p>
                      )}
                    </div>

                    {/* Keywords */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Keywords ({user.keywords.length})</p>
                      {user.keywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {user.keywords.map((kw) => (
                            <span key={kw.id} className="text-xs bg-muted px-2 py-1 rounded-full">
                              {kw.keyword}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No keywords</p>
                      )}
                    </div>

                    {/* View Logs button */}
                    <div>
                      <button
                        onClick={() => fetchUserLogs(user.id)}
                        className="w-full py-2.5 rounded-full font-medium transition-colors flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                      >
                        <FileText className="w-4 h-4" />
                        View Activity Logs
                      </button>
                    </div>

                    {/* Action buttons - stack on mobile */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => toggleMonitoring(user.id, user.monitoring_active)}
                        disabled={actionLoading === `monitoring-${user.id}`}
                        className={`flex-1 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                          !user.monitoring_active
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === `monitoring-${user.id}` ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : !user.monitoring_active ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Resume Monitoring
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Pause Monitoring
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                        disabled={actionLoading === `admin-${user.id}`}
                        className={`flex-1 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                          user.is_admin
                            ? "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === `admin-${user.id}` ? (
                          <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        ) : user.is_admin ? (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4" />
                            Make Admin
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        disabled={actionLoading === `ban-${user.id}`}
                        className={`flex-1 py-3 rounded-full font-medium transition-colors flex items-center justify-center gap-2 ${
                          user.is_banned
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        } disabled:opacity-50`}
                      >
                        {actionLoading === `ban-${user.id}` ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : user.is_banned ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Unban User
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Ban User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Audit Logs Modal */}
        {viewingLogsFor && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewingLogsFor(null)}
          >
            <div
              className="bg-background rounded-2xl max-w-4xl w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-border p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Activity Logs</h2>
                  <p className="text-sm text-muted-foreground">
                    {users.find((u) => u.id === viewingLogsFor)?.name ||
                      users.find((u) => u.id === viewingLogsFor)?.email}
                  </p>
                </div>
                <button
                  onClick={() => setViewingLogsFor(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filters */}
              <div className="p-4 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "all" ? "bg-foreground text-background" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleCategoryChange("auth")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "auth"
                        ? "bg-blue-500 text-white"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}
                  >
                    Auth
                  </button>
                  <button
                    onClick={() => handleCategoryChange("security")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "security"
                        ? "bg-purple-500 text-white"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    }`}
                  >
                    Security
                  </button>
                  <button
                    onClick={() => handleCategoryChange("calls")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "calls"
                        ? "bg-indigo-500 text-white"
                        : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    }`}
                  >
                    Calls
                  </button>
                  <button
                    onClick={() => handleCategoryChange("data_modification")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "data_modification"
                        ? "bg-orange-500 text-white"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    }`}
                  >
                    Data
                  </button>
                  <button
                    onClick={() => handleCategoryChange("settings")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "settings"
                        ? "bg-green-500 text-white"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => handleCategoryChange("admin")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "admin"
                        ? "bg-red-500 text-white"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : userLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activity logs found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium">{formatEventType(log.event_type)}</span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(log.event_category)}`}
                              >
                                {log.event_category.replace("_", " ")}
                              </span>
                            </div>
                            {log.description && <p className="text-sm text-muted-foreground">{log.description}</p>}
                            {(log.event_type === "call_triggered" || log.event_type === "call_retry") && log.metadata?.call_cost != null && (
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="font-medium text-foreground">
                                  Cost: ${Number(log.metadata.call_cost).toFixed(4)}
                                </span>
                                {log.metadata.call_duration != null && (
                                  <span className="text-muted-foreground">
                                    Duration: {log.metadata.call_duration}s
                                  </span>
                                )}
                                {log.metadata.amd_used && (
                                  <span className="text-muted-foreground">+ AMD</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        {(log.ip_address || log.user_agent || Object.keys(log.metadata || {}).length > 0) && (
                          <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
                            {log.ip_address && (
                              <div className="flex gap-2">
                                <span className="font-medium">IP:</span>
                                <span className="font-mono">{log.ip_address}</span>
                              </div>
                            )}
                            {log.user_agent && (
                              <div className="flex gap-2">
                                <span className="font-medium">User Agent:</span>
                                <span className="truncate">{log.user_agent}</span>
                              </div>
                            )}
                            {Object.keys(log.metadata || {}).length > 0 && (
                              <div className="flex gap-2">
                                <span className="font-medium">Metadata:</span>
                                <pre className="text-xs bg-muted px-2 py-1 rounded overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
