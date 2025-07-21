"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Shield, TrendingUp, Clock, Users, AlertTriangle, CheckCircle, Bell, BellOff, Settings } from "lucide-react"
import type { Employee, BreakEntry, Department } from "@/lib/types"
import { calculateShiftHours, formatShiftHours } from "@/lib/utils"

interface ManagementAccessProps {
  employees: Employee[]
  breakEntries: BreakEntry[]
  selectedDate: Date
  onFilterChange?: (filters: ManagementFilters) => void
}

interface ManagementFilters {
  showAllDepartments: boolean
  showMissingBreaks: boolean
  showCoverageIssues: boolean
  showOvertimeAlerts: boolean
}

interface DetailedStats {
  totalEmployees: number
  missingBreaks: number
  coverageIssues: number
  overtimeAlerts: number
  departmentBreakdown: { [key in Department]: number }
  totalShiftHours: number
  averageShiftLength: number
  breakComplianceRate: number
  coverageComplianceRate: number
  longestShift: number
  shortestShift: number
  employeesWithFullBreaks: number
  employeesWithPartialBreaks: number
  employeesWithNoBreaks: number
  totalBreaksScheduled: number
  totalCoverageAssigned: number
}

interface NotificationThresholds {
  breakCompliance: number
  coverageCompliance: number
  overtimeLimit: number
  missingBreaksLimit: number
}

interface Notification {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

export default function ManagementAccess({
  employees,
  breakEntries,
  selectedDate,
  onFilterChange,
}: ManagementAccessProps) {
  const [managementFilters, setManagementFilters] = useState<ManagementFilters>({
    showAllDepartments: false,
    showMissingBreaks: false,
    showCoverageIssues: false,
    showOvertimeAlerts: false,
  })

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [showThresholdDialog, setShowThresholdDialog] = useState(false)
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false)

  const [thresholds, setThresholds] = useState<NotificationThresholds>({
    breakCompliance: 85,
    coverageCompliance: 90,
    overtimeLimit: 3,
    missingBreaksLimit: 2,
  })

  // Load settings from localStorage
  useEffect(() => {
    const savedThresholds = localStorage.getItem("notificationThresholds")
    const savedNotificationsEnabled = localStorage.getItem("notificationsEnabled")

    if (savedThresholds) {
      setThresholds(JSON.parse(savedThresholds))
    }

    if (savedNotificationsEnabled !== null) {
      setNotificationsEnabled(JSON.parse(savedNotificationsEnabled))
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("notificationThresholds", JSON.stringify(thresholds))
  }, [thresholds])

  useEffect(() => {
    localStorage.setItem("notificationsEnabled", JSON.stringify(notificationsEnabled))
  }, [notificationsEnabled])

  const handleFilterChange = (filterKey: keyof ManagementFilters, value: boolean) => {
    const newFilters = { ...managementFilters, [filterKey]: value }
    setManagementFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  // Calculate detailed management statistics
  const getDetailedStats = (): DetailedStats => {
    const dateString = selectedDate.toISOString().split("T")[0]
    const todayEntries = breakEntries.filter((entry) => new Date(entry.date).toISOString().split("T")[0] === dateString)

    // Basic counts
    const totalEmployees = todayEntries.length
    const missingBreaks = todayEntries.filter((entry) => !entry.break1Start || !entry.break1End).length
    const coverageIssues = todayEntries.filter(
      (entry) =>
        (entry.break1Start && entry.break1End && (!entry.coverageEmployeeId || entry.coverageEmployeeId === "none")) ||
        (entry.break2Start && entry.break2End && (!entry.coverage2EmployeeId || entry.coverage2EmployeeId === "none")),
    ).length

    // Department breakdown
    const departmentBreakdown: { [key in Department]: number } = {
      RBT: 0,
      Operations: 0,
      BCBA: 0,
      Floater: 0,
    }

    todayEntries.forEach((entry) => {
      const employee = employees.find((emp) => emp.id === entry.employeeId)
      if (employee) {
        departmentBreakdown[employee.department]++
      }
    })

    // Shift analysis
    const shiftHours = todayEntries.map((entry) => calculateShiftHours(entry.shiftStart, entry.shiftEnd))
    const totalShiftHours = shiftHours.reduce((sum, hours) => sum + hours, 0)
    const averageShiftLength = totalEmployees > 0 ? totalShiftHours / totalEmployees : 0
    const longestShift = shiftHours.length > 0 ? Math.max(...shiftHours) : 0
    const shortestShift = shiftHours.length > 0 ? Math.min(...shiftHours) : 0
    const overtimeAlerts = shiftHours.filter((hours) => hours > 8).length

    // Break analysis
    let employeesWithFullBreaks = 0
    let employeesWithPartialBreaks = 0
    let employeesWithNoBreaks = 0
    let totalBreaksScheduled = 0
    let totalCoverageAssigned = 0

    todayEntries.forEach((entry) => {
      const shiftLength = calculateShiftHours(entry.shiftStart, entry.shiftEnd)
      const hasBreak1 = entry.break1Start && entry.break1End
      const hasBreak2 = entry.break2Start && entry.break2End
      const isEligibleForBreak2 = shiftLength >= 6.5

      if (hasBreak1) totalBreaksScheduled++
      if (hasBreak2) totalBreaksScheduled++

      if (entry.coverageEmployeeId && entry.coverageEmployeeId !== "none") totalCoverageAssigned++
      if (entry.coverage2EmployeeId && entry.coverage2EmployeeId !== "none") totalCoverageAssigned++

      if (!hasBreak1) {
        employeesWithNoBreaks++
      } else if (isEligibleForBreak2 && !hasBreak2) {
        employeesWithPartialBreaks++
      } else {
        employeesWithFullBreaks++
      }
    })

    const breakComplianceRate =
      totalEmployees > 0 ? ((employeesWithFullBreaks + employeesWithPartialBreaks) / totalEmployees) * 100 : 0
    const coverageComplianceRate = totalBreaksScheduled > 0 ? (totalCoverageAssigned / totalBreaksScheduled) * 100 : 0

    return {
      totalEmployees,
      missingBreaks,
      coverageIssues,
      overtimeAlerts,
      departmentBreakdown,
      totalShiftHours,
      averageShiftLength,
      breakComplianceRate,
      coverageComplianceRate,
      longestShift,
      shortestShift,
      employeesWithFullBreaks,
      employeesWithPartialBreaks,
      employeesWithNoBreaks,
      totalBreaksScheduled,
      totalCoverageAssigned,
    }
  }

  const stats = getDetailedStats()

  // Check thresholds and generate notifications
  useEffect(() => {
    if (!notificationsEnabled) return

    const newNotifications: Notification[] = []
    const now = new Date()

    // Break compliance threshold
    if (stats.breakComplianceRate < thresholds.breakCompliance && stats.totalEmployees > 0) {
      newNotifications.push({
        id: `break-compliance-${now.getTime()}`,
        type: "warning",
        title: "Break Compliance Below Threshold",
        message: `Break compliance rate is ${stats.breakComplianceRate.toFixed(1)}%, below the ${thresholds.breakCompliance}% threshold.`,
        timestamp: now,
        acknowledged: false,
      })
    }

    // Coverage compliance threshold
    if (stats.coverageComplianceRate < thresholds.coverageCompliance && stats.totalBreaksScheduled > 0) {
      newNotifications.push({
        id: `coverage-compliance-${now.getTime()}`,
        type: "warning",
        title: "Coverage Compliance Below Threshold",
        message: `Coverage compliance rate is ${stats.coverageComplianceRate.toFixed(1)}%, below the ${thresholds.coverageCompliance}% threshold.`,
        timestamp: now,
        acknowledged: false,
      })
    }

    // Overtime limit threshold
    if (stats.overtimeAlerts > thresholds.overtimeLimit) {
      newNotifications.push({
        id: `overtime-limit-${now.getTime()}`,
        type: "error",
        title: "Overtime Limit Exceeded",
        message: `${stats.overtimeAlerts} employees are working overtime, exceeding the limit of ${thresholds.overtimeLimit}.`,
        timestamp: now,
        acknowledged: false,
      })
    }

    // Missing breaks limit threshold
    if (stats.missingBreaks > thresholds.missingBreaksLimit) {
      newNotifications.push({
        id: `missing-breaks-limit-${now.getTime()}`,
        type: "error",
        title: "Too Many Missing Breaks",
        message: `${stats.missingBreaks} employees are missing breaks, exceeding the limit of ${thresholds.missingBreaksLimit}.`,
        timestamp: now,
        acknowledged: false,
      })
    }

    // Only add notifications that don't already exist (to prevent duplicates)
    const existingNotificationTypes = notifications.map((n) => n.title)
    const uniqueNewNotifications = newNotifications.filter((n) => !existingNotificationTypes.includes(n.title))

    if (uniqueNewNotifications.length > 0) {
      setNotifications((prev) => [...uniqueNewNotifications, ...prev].slice(0, 10)) // Keep only last 10 notifications
    }
  }, [stats, thresholds, notificationsEnabled])

  const acknowledgeNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, acknowledged: true } : n)))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplianceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
  }

  const unacknowledgedNotifications = notifications.filter((n) => !n.acknowledged)

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Management Controls
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowNotificationsDialog(true)} className="relative">
              <Bell className="h-4 w-4" />
              {unacknowledgedNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unacknowledgedNotifications.length}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowThresholdDialog(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Notifications */}
        {unacknowledgedNotifications.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 text-red-600">
              <Bell className="h-4 w-4" />
              Active Alerts ({unacknowledgedNotifications.length})
            </Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {unacknowledgedNotifications.slice(0, 3).map((notification) => (
                <Alert
                  key={notification.id}
                  className={`p-2 ${
                    notification.type === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-gray-600">{notification.message}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeNotification(notification.id)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              {unacknowledgedNotifications.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{unacknowledgedNotifications.length - 3} more alerts
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Overview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Users className="h-4 w-4" />
            Quick Overview
          </Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium">{stats.totalEmployees}</div>
              <div className="text-gray-600">Working Today</div>
            </div>
            <div
              className={`p-2 rounded ${stats.missingBreaks > thresholds.missingBreaksLimit ? "bg-red-100" : "bg-red-50"}`}
            >
              <div className="font-medium">{stats.missingBreaks}</div>
              <div className="text-gray-600">Missing Breaks</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="font-medium">{stats.coverageIssues}</div>
              <div className="text-gray-600">Coverage Issues</div>
            </div>
            <div
              className={`p-2 rounded ${stats.overtimeAlerts > thresholds.overtimeLimit ? "bg-orange-100" : "bg-orange-50"}`}
            >
              <div className="font-medium">{stats.overtimeAlerts}</div>
              <div className="text-gray-600">Overtime</div>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Department Breakdown</Label>
          <div className="space-y-1">
            {Object.entries(stats.departmentBreakdown).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between text-xs">
                <span className="font-medium">{dept}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{
                        width: stats.totalEmployees > 0 ? `${(count / stats.totalEmployees) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Analytics */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Shift Analytics
          </Label>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Total Hours:</span>
              <span className="font-medium">{formatShiftHours(stats.totalShiftHours)}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Shift:</span>
              <span className="font-medium">{formatShiftHours(stats.averageShiftLength)}</span>
            </div>
            <div className="flex justify-between">
              <span>Longest Shift:</span>
              <span className="font-medium">{formatShiftHours(stats.longestShift)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shortest Shift:</span>
              <span className="font-medium">{formatShiftHours(stats.shortestShift)}</span>
            </div>
          </div>
        </div>

        {/* Break Compliance */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Break Compliance
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Overall Rate:</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${getComplianceColor(stats.breakComplianceRate)}`}>
                  {stats.breakComplianceRate.toFixed(1)}%
                </span>
                {getComplianceBadge(stats.breakComplianceRate)}
              </div>
            </div>
            <Progress
              value={stats.breakComplianceRate}
              className={`h-2 ${stats.breakComplianceRate < thresholds.breakCompliance ? "bg-red-100" : ""}`}
            />
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="font-medium text-green-600">{stats.employeesWithFullBreaks}</div>
                <div className="text-gray-500">Full</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">{stats.employeesWithPartialBreaks}</div>
                <div className="text-gray-500">Partial</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{stats.employeesWithNoBreaks}</div>
                <div className="text-gray-500">None</div>
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Analytics */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Coverage Analytics
          </Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Coverage Rate:</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${getComplianceColor(stats.coverageComplianceRate)}`}>
                  {stats.coverageComplianceRate.toFixed(1)}%
                </span>
                {getComplianceBadge(stats.coverageComplianceRate)}
              </div>
            </div>
            <Progress
              value={stats.coverageComplianceRate}
              className={`h-2 ${stats.coverageComplianceRate < thresholds.coverageCompliance ? "bg-red-100" : ""}`}
            />
            <div className="flex justify-between text-xs">
              <span>Breaks Scheduled:</span>
              <span className="font-medium">{stats.totalBreaksScheduled}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Coverage Assigned:</span>
              <span className="font-medium">{stats.totalCoverageAssigned}</span>
            </div>
          </div>
        </div>

        {/* Alerts & Issues */}
        {(stats.missingBreaks > 0 || stats.coverageIssues > 0 || stats.overtimeAlerts > 0) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Attention Required
            </Label>
            <div className="space-y-1">
              {stats.missingBreaks > 0 && (
                <div
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    stats.missingBreaks > thresholds.missingBreaksLimit ? "bg-red-100" : "bg-red-50"
                  }`}
                >
                  <span>Employees without breaks</span>
                  <Badge variant="destructive">{stats.missingBreaks}</Badge>
                </div>
              )}
              {stats.coverageIssues > 0 && (
                <div className="flex items-center justify-between text-xs bg-yellow-50 p-2 rounded">
                  <span>Breaks without coverage</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats.coverageIssues}</Badge>
                </div>
              )}
              {stats.overtimeAlerts > 0 && (
                <div
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    stats.overtimeAlerts > thresholds.overtimeLimit ? "bg-orange-100" : "bg-orange-50"
                  }`}
                >
                  <span>Overtime shifts (8+ hours)</span>
                  <Badge className="bg-orange-100 text-orange-800">{stats.overtimeAlerts}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium">Advanced Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-all-depts" className="text-xs">
                Show All Departments
              </Label>
              <input
                id="show-all-depts"
                type="checkbox"
                checked={managementFilters.showAllDepartments}
                onChange={(e) => handleFilterChange("showAllDepartments", e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="missing-breaks" className="text-xs">
                Highlight Missing Breaks
              </Label>
              <input
                id="missing-breaks"
                type="checkbox"
                checked={managementFilters.showMissingBreaks}
                onChange={(e) => handleFilterChange("showMissingBreaks", e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="coverage-issues" className="text-xs">
                Show Coverage Issues
              </Label>
              <input
                id="coverage-issues"
                type="checkbox"
                checked={managementFilters.showCoverageIssues}
                onChange={(e) => handleFilterChange("showCoverageIssues", e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overtime-alerts" className="text-xs">
                Overtime Alerts
              </Label>
              <input
                id="overtime-alerts"
                type="checkbox"
                checked={managementFilters.showOvertimeAlerts}
                onChange={(e) => handleFilterChange("showOvertimeAlerts", e.target.checked)}
                className="rounded border-gray-300"
              />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Notification Settings Dialog */}
      <Dialog open={showThresholdDialog} onOpenChange={setShowThresholdDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable Notifications</Label>
              <Button variant="ghost" size="sm" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
            </div>

            {notificationsEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="break-threshold">Break Compliance Threshold (%)</Label>
                  <Input
                    id="break-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.breakCompliance}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, breakCompliance: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverage-threshold">Coverage Compliance Threshold (%)</Label>
                  <Input
                    id="coverage-threshold"
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.coverageCompliance}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, coverageCompliance: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overtime-threshold">Overtime Limit (employees)</Label>
                  <Input
                    id="overtime-threshold"
                    type="number"
                    min="0"
                    value={thresholds.overtimeLimit}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, overtimeLimit: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="missing-breaks-threshold">Missing Breaks Limit (employees)</Label>
                  <Input
                    id="missing-breaks-threshold"
                    type="number"
                    min="0"
                    value={thresholds.missingBreaksLimit}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, missingBreaksLimit: Number(e.target.value) }))}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowThresholdDialog(false)}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications History Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications ({notifications.length})
              </div>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                  Clear All
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Alert
                  key={notification.id}
                  className={`${notification.acknowledged ? "opacity-60" : ""} ${
                    notification.type === "error" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{notification.timestamp.toLocaleTimeString()}</div>
                      </div>
                      {!notification.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeNotification(notification.id)}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNotificationsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
