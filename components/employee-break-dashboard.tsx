"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import BreakTimesheetTable from "@/components/break-timesheet-table"
import EmployeeManagement from "@/components/employee-management"
import DataBackupRestore from "@/components/data-backup-restore"
import ManagementAccess from "@/components/management-access"
import type { Employee, BreakEntry, Department } from "@/lib/types"
import { initialEmployees } from "@/lib/data"
import { exportToCSV, calculateShiftHours, formatShiftHours, formatTime } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Database, CheckCircle, XCircle, AlertTriangle, Mail } from "lucide-react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import EmailSharing from "@/components/email-sharing"
import TestShareDemo from "@/components/test-share-demo"
import { useAnalytics, usePageAnalytics } from "@/hooks/use-analytics"

export default function EmployeeBreakDashboard() {
  const analytics = useAnalytics()
  usePageAnalytics("Employee Break Dashboard")

  const [employees, setEmployees] = useState<Employee[]>([])
  const [breakEntries, setBreakEntries] = useState<BreakEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [filterEmployee, setFilterEmployee] = useState<string>("all")
  const [filterBreakStatus, setFilterBreakStatus] = useState<string>("all")
  const [filterDepartment, setFilterDepartment] = useState<Department | "all">("RBT")
  const [isEmployeeManagementOpen, setIsEmployeeManagementOpen] = useState(false)
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false)
  const [managementFilters, setManagementFilters] = useState({
    showAllDepartments: false,
    showMissingBreaks: false,
    showCoverageIssues: false,
    showOvertimeAlerts: false,
  })
  const [isEmailSharingOpen, setIsEmailSharingOpen] = useState(false)

  // Load employees from localStorage or use initial data
  useEffect(() => {
    const savedEmployees = localStorage.getItem("employees")
    if (savedEmployees) {
      setEmployees(JSON.parse(savedEmployees))
    } else {
      setEmployees(initialEmployees)
      localStorage.setItem("employees", JSON.stringify(initialEmployees))
    }

    const savedBreakEntries = localStorage.getItem("breakEntries")
    if (savedBreakEntries) {
      setBreakEntries(JSON.parse(savedBreakEntries))
    }
  }, [])

  // Save break entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("breakEntries", JSON.stringify(breakEntries))
    localStorage.setItem("lastDataUpdate", new Date().toISOString())
  }, [breakEntries])

  // Save employees to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("employees", JSON.stringify(employees))
    localStorage.setItem("lastDataUpdate", new Date().toISOString())
  }, [employees])

  const handleExportCSV = () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd")
    exportToCSV(filteredBreakEntries, employees, `employee-breaks-${formattedDate}`)

    // Track the export action
    analytics.trackExport("CSV Export", filteredBreakEntries.length)
  }

  const handleAddEmployee = (employee: Employee) => {
    setEmployees([...employees, { ...employee, id: Date.now().toString() }])
    analytics.trackEmployee("Add Employee", employee.name)
  }

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    setEmployees(employees.map((employee) => (employee.id === updatedEmployee.id ? updatedEmployee : employee)))
    analytics.trackEmployee("Update Employee", updatedEmployee.name)
  }

  const handleDeleteEmployee = (id: string) => {
    const employee = employees.find((e) => e.id === id)
    setEmployees(employees.filter((employee) => employee.id !== id))
    setBreakEntries(breakEntries.filter((entry) => entry.employeeId !== id && entry.coverageEmployeeId !== id))
    analytics.trackEmployee("Delete Employee", employee?.name)
  }

  const handleAddBreakEntry = (entry: BreakEntry) => {
    setBreakEntries([...breakEntries, { ...entry, id: Date.now().toString() }])
    analytics.trackBreak("Add Break Entry", entry.break1Start ? "Break 1" : "Shift Only")
  }

  const handleUpdateBreakEntry = (updatedEntry: BreakEntry) => {
    setBreakEntries(breakEntries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    analytics.trackBreak("Update Break Entry")
  }

  const handleDeleteBreakEntry = (id: string) => {
    setBreakEntries(breakEntries.filter((entry) => entry.id !== id))
    analytics.trackBreak("Delete Break Entry")
  }

  const handleRestoreData = (restoredEmployees: Employee[], restoredBreakEntries: BreakEntry[]) => {
    setEmployees(restoredEmployees)
    setBreakEntries(restoredBreakEntries)

    // Update localStorage
    localStorage.setItem("employees", JSON.stringify(restoredEmployees))
    localStorage.setItem("breakEntries", JSON.stringify(restoredBreakEntries))
    localStorage.setItem("lastDataUpdate", new Date().toISOString())

    analytics.trackData("Restore Data", `${restoredEmployees.length} employees, ${restoredBreakEntries.length} entries`)
  }

  const getWorkingEmployees = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const workingEmployeeIds = breakEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date).toISOString().split("T")[0]
        return entryDate === dateString
      })
      .map((entry) => entry.employeeId)

    return employees.filter((emp) => workingEmployeeIds.includes(emp.id))
  }

  // Get detailed working employee info with break status
  const getDetailedWorkingEmployees = () => {
    const dateString = selectedDate.toISOString().split("T")[0]
    const todayEntries = breakEntries.filter((entry) => new Date(entry.date).toISOString().split("T")[0] === dateString)

    return todayEntries
      .map((entry) => {
        const employee = employees.find((emp) => emp.id === entry.employeeId)
        if (!employee) return null

        const shiftHours = calculateShiftHours(entry.shiftStart, entry.shiftEnd)
        const hasBreak1 = entry.break1Start && entry.break1End
        const hasBreak2 = entry.break2Start && entry.break2End
        const isEligibleForBreak2 = shiftHours >= 6.5
        const hasCoverage1 = entry.coverageEmployeeId && entry.coverageEmployeeId !== "none"
        const hasCoverage2 = entry.coverage2EmployeeId && entry.coverage2EmployeeId !== "none"

        const breakStatus = getBreakStatus(hasBreak1, hasBreak2, isEligibleForBreak2)
        const coverageStatus = getCoverageStatus(hasBreak1, hasBreak2, hasCoverage1, hasCoverage2)

        const coverageEmployee1 = entry.coverageEmployeeId
          ? employees.find((emp) => emp.id === entry.coverageEmployeeId)
          : null
        const coverageEmployee2 = entry.coverage2EmployeeId
          ? employees.find((emp) => emp.id === entry.coverage2EmployeeId)
          : null

        return {
          employee,
          entry,
          shiftHours,
          hasBreak1,
          hasBreak2,
          isEligibleForBreak2,
          hasCoverage1,
          hasCoverage2,
          breakStatus,
          coverageStatus,
          coverageEmployee1,
          coverageEmployee2,
        }
      })
      .filter(Boolean)
  }

  const getBreakStatus = (hasBreak1: boolean, hasBreak2: boolean, isEligibleForBreak2: boolean) => {
    if (!hasBreak1) return "no-breaks"
    if (isEligibleForBreak2 && !hasBreak2) return "partial-breaks"
    if (isEligibleForBreak2 && hasBreak2) return "all-breaks"
    return "break1-only"
  }

  const getCoverageStatus = (hasBreak1: boolean, hasBreak2: boolean, hasCoverage1: boolean, hasCoverage2: boolean) => {
    const needsCoverage1 = hasBreak1
    const needsCoverage2 = hasBreak2

    if (!needsCoverage1 && !needsCoverage2) return "no-coverage-needed"
    if (needsCoverage1 && !hasCoverage1) return "missing-coverage"
    if (needsCoverage2 && !hasCoverage2) return "missing-coverage"
    return "full-coverage"
  }

  const workingEmployees = getWorkingEmployees(selectedDate)
  const detailedWorkingEmployees = getDetailedWorkingEmployees()

  const filteredBreakEntries = breakEntries.filter((entry) => {
    const entryDate = new Date(entry.date)
    const isSameDate =
      entryDate.getDate() === selectedDate.getDate() &&
      entryDate.getMonth() === selectedDate.getMonth() &&
      entryDate.getFullYear() === selectedDate.getFullYear()

    const matchesEmployee = filterEmployee === "all" || entry.employeeId === filterEmployee

    const employee = employees.find((e) => e.id === entry.employeeId)
    const matchesDepartment =
      managementFilters.showAllDepartments ||
      filterDepartment === "all" ||
      (employee && employee.department === filterDepartment)

    const hasBreak = entry.break1Start && entry.break1End
    const matchesBreakStatus =
      filterBreakStatus === "all" ||
      (filterBreakStatus === "given" && hasBreak) ||
      (filterBreakStatus === "notGiven" && !hasBreak)

    // Apply management filters
    if (managementFilters.showMissingBreaks && hasBreak) return false
    if (managementFilters.showCoverageIssues) {
      const hasCoverageIssue =
        (entry.break1Start && entry.break1End && !entry.coverageEmployeeId) ||
        (entry.break2Start && entry.break2End && !entry.coverage2EmployeeId)
      if (!hasCoverageIssue) return false
    }

    return isSameDate && matchesEmployee && matchesDepartment && matchesBreakStatus
  })

  const handleQuickAddBreak = (employeeId: string, breakType: "break1" | "break2") => {
    const entry = breakEntries.find(
      (e) =>
        e.employeeId === employeeId &&
        new Date(e.date).toISOString().split("T")[0] === selectedDate.toISOString().split("T")[0],
    )

    if (!entry) return

    const updatedEntry = { ...entry }

    if (breakType === "break1") {
      // Add a default 10-minute break 2 hours into the shift
      const shiftStartMinutes =
        Number.parseInt(entry.shiftStart.split(":")[0]) * 60 + Number.parseInt(entry.shiftStart.split(":")[1])
      const breakStartMinutes = shiftStartMinutes + 120 // 2 hours later
      const breakEndMinutes = breakStartMinutes + 10 // 10 minute break

      const breakStartHours = Math.floor(breakStartMinutes / 60)
      const breakStartMins = breakStartMinutes % 60
      const breakEndHours = Math.floor(breakEndMinutes / 60)
      const breakEndMins = breakEndMinutes % 60

      updatedEntry.break1Start = `${breakStartHours.toString().padStart(2, "0")}:${breakStartMins.toString().padStart(2, "0")}`
      updatedEntry.break1End = `${breakEndHours.toString().padStart(2, "0")}:${breakEndMins.toString().padStart(2, "0")}`
    } else {
      // Add second break 4 hours into the shift
      const shiftStartMinutes =
        Number.parseInt(entry.shiftStart.split(":")[0]) * 60 + Number.parseInt(entry.shiftStart.split(":")[1])
      const breakStartMinutes = shiftStartMinutes + 240 // 4 hours later
      const breakEndMinutes = breakStartMinutes + 10 // 10 minute break

      const breakStartHours = Math.floor(breakStartMinutes / 60)
      const breakStartMins = breakStartMinutes % 60
      const breakEndHours = Math.floor(breakEndMinutes / 60)
      const breakEndMins = breakEndMinutes % 60

      updatedEntry.break2Start = `${breakStartHours.toString().padStart(2, "0")}:${breakStartMins.toString().padStart(2, "0")}`
      updatedEntry.break2End = `${breakEndHours.toString().padStart(2, "0")}:${breakEndMins.toString().padStart(2, "0")}`
    }

    handleUpdateBreakEntry(updatedEntry)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Employee Break Management</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsEmployeeManagementOpen(true)}>
            Manage Employees
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBackupRestoreOpen(true)}
            className="flex items-center gap-2 bg-transparent"
          >
            <Database className="h-4 w-4" />
            Backup & Restore
          </Button>
          <Button variant="default" onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEmailSharingOpen(true)}
            className="flex items-center gap-2 bg-transparent"
          >
            <Mail className="h-4 w-4" />
            Share App
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="date" variant={"outline"} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={filterDepartment}
                onValueChange={(value) => setFilterDepartment(value as Department | "all")}
                disabled={managementFilters.showAllDepartments}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="RBT">RBT</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="BCBA">BCBA</SelectItem>
                  <SelectItem value="Floater">Floater</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees
                    .filter(
                      (e) =>
                        managementFilters.showAllDepartments ||
                        filterDepartment === "all" ||
                        e.department === filterDepartment,
                    )
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakStatus">Break Status</Label>
              <Select value={filterBreakStatus} onValueChange={setFilterBreakStatus}>
                <SelectTrigger id="breakStatus">
                  <SelectValue placeholder="Select break status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breaks</SelectItem>
                  <SelectItem value="given">Breaks Given</SelectItem>
                  <SelectItem value="notGiven">Breaks Not Given</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {workingEmployees.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-sm font-medium">Working Today ({workingEmployees.length})</Label>
                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                  {workingEmployees
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((emp, index) => (
                      <div key={emp.id}>
                        {emp.name}
                        {index < workingEmployees.length - 1 ? ", " : ""}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ManagementAccess
          employees={employees}
          breakEntries={breakEntries}
          selectedDate={selectedDate}
          onFilterChange={setManagementFilters}
        />

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Break Timesheet</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="timesheet" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
                <TabsTrigger value="working">Working Today</TabsTrigger>
                <TabsTrigger value="add">Add Entry</TabsTrigger>
                <TabsTrigger value="test">Test Share</TabsTrigger>
              </TabsList>
              <TabsContent value="timesheet" className="mt-4">
                <BreakTimesheetTable
                  breakEntries={filteredBreakEntries}
                  employees={employees}
                  workingEmployees={workingEmployees}
                  onUpdateEntry={handleUpdateBreakEntry}
                  onDeleteEntry={handleDeleteBreakEntry}
                />
              </TabsContent>
              <TabsContent value="working" className="mt-4">
                <WorkingEmployeesTable
                  detailedEmployees={detailedWorkingEmployees}
                  onQuickAddBreak={handleQuickAddBreak}
                />
              </TabsContent>
              <TabsContent value="add" className="mt-4">
                <BreakEntryForm
                  employees={employees.filter(
                    (e) =>
                      managementFilters.showAllDepartments ||
                      filterDepartment === "all" ||
                      e.department === filterDepartment,
                  )}
                  workingEmployees={workingEmployees}
                  onAddEntry={(entry) => handleAddBreakEntry({ ...entry, date: selectedDate.toISOString() })}
                  selectedDate={selectedDate}
                />
              </TabsContent>
              <TabsContent value="test" className="mt-4">
                <TestShareDemo />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <EmployeeManagement
        isOpen={isEmployeeManagementOpen}
        onClose={() => setIsEmployeeManagementOpen(false)}
        employees={employees}
        breakEntries={breakEntries}
        onAddEmployee={handleAddEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onAddBreakEntry={handleAddBreakEntry}
        onUpdateBreakEntry={handleUpdateBreakEntry}
      />

      <DataBackupRestore
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        employees={employees}
        breakEntries={breakEntries}
        onRestoreData={handleRestoreData}
      />

      <EmailSharing
        isOpen={isEmailSharingOpen}
        onClose={() => setIsEmailSharingOpen(false)}
        employees={employees}
        breakEntries={breakEntries}
      />
    </div>
  )
}

// Working Employees Table Component
interface WorkingEmployeesTableProps {
  detailedEmployees: any[]
  onQuickAddBreak: (employeeId: string, breakType: "break1" | "break2") => void
}

function WorkingEmployeesTable({ detailedEmployees, onQuickAddBreak }: WorkingEmployeesTableProps) {
  const [filterDepartment, setFilterDepartment] = useState<Department | "all">("all")
  const [filterBreakStatus, setFilterBreakStatus] = useState<string>("all")

  const filteredEmployees = detailedEmployees.filter((item) => {
    const matchesDepartment = filterDepartment === "all" || item.employee.department === filterDepartment

    const matchesBreakStatus =
      filterBreakStatus === "all" ||
      (filterBreakStatus === "missing" && item.breakStatus === "no-breaks") ||
      (filterBreakStatus === "partial" && item.breakStatus === "partial-breaks") ||
      (filterBreakStatus === "complete" && (item.breakStatus === "all-breaks" || item.breakStatus === "break1-only"))

    return matchesDepartment && matchesBreakStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "no-breaks":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            No Breaks
          </Badge>
        )
      case "partial-breaks":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Partial
          </Badge>
        )
      case "all-breaks":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Complete
          </Badge>
        )
      case "break1-only":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-600">
            <CheckCircle className="h-3 w-3" />
            Break Given
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getCoverageBadge = (status: string) => {
    switch (status) {
      case "no-coverage-needed":
        return <Badge variant="outline">N/A</Badge>
      case "missing-coverage":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Missing
          </Badge>
        )
      case "full-coverage":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Covered
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (detailedEmployees.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-gray-500">No employees scheduled to work today.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="filter-department">Department</Label>
          <Select value={filterDepartment} onValueChange={(value) => setFilterDepartment(value as Department | "all")}>
            <SelectTrigger id="filter-department" className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="RBT">RBT</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="BCBA">BCBA</SelectItem>
              <SelectItem value="Floater">Floater</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-break-status">Break Status</Label>
          <Select value={filterBreakStatus} onValueChange={setFilterBreakStatus}>
            <SelectTrigger id="filter-break-status" className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="missing">Missing Breaks</SelectItem>
              <SelectItem value="partial">Partial Breaks</SelectItem>
              <SelectItem value="complete">Complete Breaks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Break Status</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Break Details</TableHead>
              <TableHead>Outside Therapy</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((item) => (
              <TableRow key={item.employee.id}>
                <TableCell className="font-medium">{item.employee.name}</TableCell>
                <TableCell>{item.employee.department}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>
                      {formatTime(item.entry.shiftStart)} - {formatTime(item.entry.shiftEnd)}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">{formatShiftHours(item.shiftHours)}</div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(item.breakStatus)}</TableCell>
                <TableCell>{getCoverageBadge(item.coverageStatus)}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-xs">
                    {item.hasBreak1 ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Break 1:</span> {formatTime(item.entry.break1Start)} -{" "}
                        {formatTime(item.entry.break1End)}
                        {item.coverageEmployee1 && (
                          <span className="text-green-600 ml-1">({item.coverageEmployee1.name})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400">Break 1: Not scheduled</div>
                    )}
                    {item.isEligibleForBreak2 &&
                      (item.hasBreak2 ? (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Break 2:</span> {formatTime(item.entry.break2Start)} -{" "}
                          {formatTime(item.entry.break2End)}
                          {item.coverageEmployee2 && (
                            <span className="text-green-600 ml-1">({item.coverageEmployee2.name})</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400">Break 2: Not scheduled</div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {item.entry.outsideTherapyStart && item.entry.outsideTherapyEnd ? (
                      <div>
                        <div className="font-medium">
                          {formatTime(item.entry.outsideTherapyStart)} - {formatTime(item.entry.outsideTherapyEnd)}
                        </div>
                        {item.entry.outsideTherapyReason && (
                          <div className="text-gray-500 italic">({item.entry.outsideTherapyReason})</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400">None scheduled</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {!item.hasBreak1 && (
                      <Button size="sm" variant="outline" onClick={() => onQuickAddBreak(item.employee.id, "break1")}>
                        Add Break 1
                      </Button>
                    )}
                    {item.isEligibleForBreak2 && !item.hasBreak2 && (
                      <Button size="sm" variant="outline" onClick={() => onQuickAddBreak(item.employee.id, "break2")}>
                        Add Break 2
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Break Entry Form Component
interface BreakEntryFormProps {
  employees: Employee[]
  workingEmployees: Employee[]
  onAddEntry: (entry: Omit<BreakEntry, "id">) => void
  selectedDate: Date
}

function BreakEntryForm({ employees, workingEmployees, onAddEntry, selectedDate }: BreakEntryFormProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [shiftStart, setShiftStart] = useState("")
  const [shiftEnd, setShiftEnd] = useState("")
  const [break1Start, setBreak1Start] = useState("")
  const [break1End, setBreak1End] = useState("")
  const [break2Start, setBreak2Start] = useState("")
  const [break2End, setBreak2End] = useState("")
  const [coverageEmployeeId, setCoverageEmployeeId] = useState("")
  const [coverage2EmployeeId, setCoverage2EmployeeId] = useState("")
  const [outsideTherapyStart, setOutsideTherapyStart] = useState("")
  const [outsideTherapyEnd, setOutsideTherapyEnd] = useState("")
  const [outsideTherapyReason, setOutsideTherapyReason] = useState("")

  // Calculate shift hours in real-time
  const shiftHours = calculateShiftHours(shiftStart, shiftEnd)
  const isEligibleForSecondBreak = shiftHours >= 6.5

  // Clear second break data if not eligible
  useEffect(() => {
    if (!isEligibleForSecondBreak) {
      setBreak2Start("")
      setBreak2End("")
      setCoverage2EmployeeId("")
    }
  }, [isEligibleForSecondBreak])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeId || !shiftStart || !shiftEnd) {
      alert("Please fill in all required fields (Employee, Shift Start, and Shift End)")
      return
    }

    onAddEntry({
      employeeId,
      date: selectedDate.toISOString(),
      shiftStart,
      shiftEnd,
      break1Start,
      break1End,
      break2Start,
      break2End,
      coverageEmployeeId,
      coverage2EmployeeId,
      outsideTherapyStart,
      outsideTherapyEnd,
      outsideTherapyReason,
    })

    // Reset form
    setEmployeeId("")
    setShiftStart("")
    setShiftEnd("")
    setBreak1Start("")
    setBreak1End("")
    setBreak2Start("")
    setBreak2End("")
    setCoverageEmployeeId("")
    setCoverage2EmployeeId("")
    setOutsideTherapyStart("")
    setOutsideTherapyEnd("")
    setOutsideTherapyReason("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employee">Employee *</Label>
          <Select value={employeeId} onValueChange={setEmployeeId} required>
            <SelectTrigger id="employee">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="text" value={format(selectedDate, "PPP")} disabled className="bg-gray-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shiftStart">Shift Start Time *</Label>
          <Input
            id="shiftStart"
            type="time"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftEnd">Shift End Time *</Label>
          <Input id="shiftEnd" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label>Total Shift Hours</Label>
          <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium">
            {shiftHours > 0 ? formatShiftHours(shiftHours) : "0.00 hrs"}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium mb-2">Break 1</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="break1Start">Break Start Time</Label>
            <Input id="break1Start" type="time" value={break1Start} onChange={(e) => setBreak1Start(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="break1End">Break End Time</Label>
            <Input id="break1End" type="time" value={break1End} onChange={(e) => setBreak1End(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverageEmployee">Coverage Employee</Label>
            <Select value={coverageEmployeeId} onValueChange={setCoverageEmployeeId}>
              <SelectTrigger id="coverageEmployee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {workingEmployees
                  .filter((e) => e.id !== employeeId)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isEligibleForSecondBreak && (
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-2">Break 2 (for shifts 6.5+ hours)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="break2Start">Break Start Time</Label>
              <Input
                id="break2Start"
                type="time"
                value={break2Start}
                onChange={(e) => setBreak2Start(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="break2End">Break End Time</Label>
              <Input id="break2End" type="time" value={break2End} onChange={(e) => setBreak2End(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage2Employee">Coverage Employee</Label>
              <Select value={coverage2EmployeeId} onValueChange={setCoverage2EmployeeId}>
                <SelectTrigger id="coverage2Employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {workingEmployees
                    .filter((e) => e.id !== employeeId)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {!isEligibleForSecondBreak && shiftHours > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Second break is available for shifts of 6.5 hours or longer. Current shift:{" "}
              {formatShiftHours(shiftHours)}
            </p>
          </div>
        </div>
      )}

      {workingEmployees.length === 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-700">
              <strong>Note:</strong> No employees are currently scheduled to work on this date. Coverage options will be
              limited to all employees.
            </p>
          </div>
        </div>
      )}

      {/* Outside Therapy Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-medium mb-2">Time Outside Therapy</h3>
        <p className="text-sm text-gray-600 mb-3">
          Track time when employee is away from direct therapy (client meetings, training, etc.)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="outsideTherapyStart">Start Time</Label>
            <Input
              id="outsideTherapyStart"
              type="time"
              value={outsideTherapyStart}
              onChange={(e) => setOutsideTherapyStart(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outsideTherapyEnd">End Time</Label>
            <Input
              id="outsideTherapyEnd"
              type="time"
              value={outsideTherapyEnd}
              onChange={(e) => setOutsideTherapyEnd(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="outsideTherapyReason">Reason</Label>
            <Input
              id="outsideTherapyReason"
              type="text"
              placeholder="e.g., Client meeting, Training"
              value={outsideTherapyReason}
              onChange={(e) => setOutsideTherapyReason(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Add Break Entry</Button>
      </div>
    </form>
  )
}
