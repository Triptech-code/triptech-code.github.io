"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Employee, Department, BreakEntry } from "@/lib/types"
import { Edit, Trash2, Plus, CalendarIcon, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { calculateShiftHours, formatShiftHours, formatTime } from "@/lib/utils"

interface EmployeeManagementProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  breakEntries: BreakEntry[]
  onAddEmployee: (employee: Omit<Employee, "id">) => void
  onUpdateEmployee: (employee: Employee) => void
  onDeleteEmployee: (id: string) => void
  onAddBreakEntry: (entry: Omit<BreakEntry, "id">) => void
  onUpdateBreakEntry: (entry: BreakEntry) => void
}

export default function EmployeeManagement({
  isOpen,
  onClose,
  employees,
  breakEntries,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddBreakEntry,
  onUpdateBreakEntry,
}: EmployeeManagementProps) {
  const [newEmployee, setNewEmployee] = useState<Omit<Employee, "id">>({
    name: "",
    department: "RBT",
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<Department | "all">("RBT")

  // Daily break management state
  const [selectedWorkDate, setSelectedWorkDate] = useState<Date>(new Date())
  const [workDayFilterDepartment, setWorkDayFilterDepartment] = useState<Department | "all">("all")

  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())

  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployees)
    if (checked) {
      newSelected.add(employeeId)
    } else {
      newSelected.delete(employeeId)
    }
    setSelectedEmployees(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allEmployeeIds = filteredEmployees.map((emp) => emp.id)
      setSelectedEmployees(new Set(allEmployeeIds))
    } else {
      setSelectedEmployees(new Set())
    }
  }

  const handleCreateWorkSchedule = () => {
    const selectedEmployeesList = Array.from(selectedEmployees)
    if (selectedEmployeesList.length === 0) {
      alert("Please select at least one employee to create work schedule.")
      return
    }

    // Create basic shift entries for selected employees
    selectedEmployeesList.forEach((employeeId) => {
      // Check if employee already has an entry for this date
      const existingEntry = breakEntries.find(
        (entry) =>
          entry.employeeId === employeeId &&
          new Date(entry.date).toISOString().split("T")[0] === selectedWorkDate.toISOString().split("T")[0],
      )

      if (!existingEntry) {
        // Create a basic 8-hour shift entry
        const newEntry: Omit<BreakEntry, "id"> = {
          employeeId,
          date: selectedWorkDate.toISOString(),
          shiftStart: "09:00",
          shiftEnd: "17:00",
          break1Start: "",
          break1End: "",
          break2Start: "",
          break2End: "",
          coverageEmployeeId: "",
          coverage2EmployeeId: "",
        }
        onAddBreakEntry(newEntry)
      }
    })

    alert(`Work schedule created for ${selectedEmployeesList.length} employees on ${format(selectedWorkDate, "PPP")}`)
  }

  const handleAddEmployee = () => {
    if (!newEmployee.name.trim()) {
      alert("Employee name cannot be empty")
      return
    }

    onAddEmployee(newEmployee)
    setNewEmployee({ name: "", department: "RBT" })
  }

  const handleEditClick = (employee: Employee) => {
    setEditingEmployee({ ...employee })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingEmployee && editingEmployee.name.trim()) {
      onUpdateEmployee(editingEmployee)
      setIsEditDialogOpen(false)
      setEditingEmployee(null)
    } else {
      alert("Employee name cannot be empty")
    }
  }

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id)
      setIsDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const filteredEmployees = employees.filter(
    (employee) => filterDepartment === "all" || employee.department === filterDepartment,
  )

  // Get employees working on selected date
  const getEmployeesWorkingOnDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const workingEmployees = breakEntries
      .filter((entry) => {
        const entryDate = new Date(entry.date).toISOString().split("T")[0]
        return entryDate === dateString
      })
      .map((entry) => {
        const employee = employees.find((emp) => emp.id === entry.employeeId)
        if (!employee) return null

        const shiftHours = calculateShiftHours(entry.shiftStart, entry.shiftEnd)
        const hasBreak1 = entry.break1Start && entry.break1End
        const hasBreak2 = entry.break2Start && entry.break2End
        const isEligibleForBreak2 = shiftHours >= 6.5
        const hasCoverage1 = entry.coverageEmployeeId && entry.coverageEmployeeId !== "none"
        const hasCoverage2 = entry.coverage2EmployeeId && entry.coverage2EmployeeId !== "none"

        return {
          ...employee,
          breakEntry: entry,
          shiftHours,
          hasBreak1,
          hasBreak2,
          isEligibleForBreak2,
          hasCoverage1,
          hasCoverage2,
          breakStatus: getBreakStatus(hasBreak1, hasBreak2, isEligibleForBreak2),
          coverageStatus: getCoverageStatus(hasBreak1, hasBreak2, hasCoverage1, hasCoverage2),
        }
      })
      .filter(Boolean)
      .filter((emp) => workDayFilterDepartment === "all" || emp.department === workDayFilterDepartment)

    return workingEmployees
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

  const workingEmployees = getEmployeesWorkingOnDate(selectedWorkDate)

  const handleQuickAddBreak = (employeeId: string, breakType: "break1" | "break2") => {
    const entry = breakEntries.find(
      (e) =>
        e.employeeId === employeeId &&
        new Date(e.date).toISOString().split("T")[0] === selectedWorkDate.toISOString().split("T")[0],
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

    onUpdateBreakEntry(updatedEntry)
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Employee List</TabsTrigger>
            <TabsTrigger value="workday">Daily Break Management</TabsTrigger>
            <TabsTrigger value="add">Add Employee</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-department" className="whitespace-nowrap">
                Filter by Department:
              </Label>
              <Select
                value={filterDepartment}
                onValueChange={(value) => setFilterDepartment(value as Department | "all")}
              >
                <SelectTrigger id="filter-department" className="w-[180px]">
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

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredEmployees.length > 0 &&
                          filteredEmployees.every((emp) => selectedEmployees.has(emp.id))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(employee.id)}
                              onChange={(e) => handleEmployeeSelect(employee.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(employee)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(employee)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
            {selectedEmployees.size > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Selected Employees ({selectedEmployees.size})</span>
                    <Button onClick={handleCreateWorkSchedule} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Work Schedule for {format(selectedWorkDate, "MMM d")}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    {Array.from(selectedEmployees).map((employeeId, index) => {
                      const employee = employees.find((emp) => emp.id === employeeId)
                      return employee ? (
                        <span key={employeeId}>
                          {employee.name}
                          {index < selectedEmployees.size - 1 ? ", " : ""}
                        </span>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workday" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Work Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedWorkDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedWorkDate}
                      onSelect={(date) => date && setSelectedWorkDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Filter by Department</Label>
                <Select
                  value={workDayFilterDepartment}
                  onValueChange={(value) => setWorkDayFilterDepartment(value as Department | "all")}
                >
                  <SelectTrigger>
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
            </div>

            {selectedEmployees.size > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Selected Employees for Work Schedule</span>
                    <Button onClick={handleCreateWorkSchedule} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create Work Schedule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-700">
                    <strong>Selected for {format(selectedWorkDate, "MMM d")}:</strong>
                    <br />
                    {Array.from(selectedEmployees).map((employeeId, index) => {
                      const employee = employees.find((emp) => emp.id === employeeId)
                      const hasSchedule = breakEntries.some(
                        (entry) =>
                          entry.employeeId === employeeId &&
                          new Date(entry.date).toISOString().split("T")[0] ===
                            selectedWorkDate.toISOString().split("T")[0],
                      )
                      return employee ? (
                        <span key={employeeId} className={hasSchedule ? "text-green-600 font-medium" : ""}>
                          {employee.name}
                          {hasSchedule ? " ✓" : ""}
                          {index < selectedEmployees.size - 1 ? ", " : ""}
                        </span>
                      ) : null
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Employees Working on {format(selectedWorkDate, "PPP")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workingEmployees.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No employees scheduled to work on this date.</p>
                    <p className="text-sm mt-2">
                      Select employees from the Employee List tab and create a work schedule.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Shift Hours</TableHead>
                          <TableHead>Shift Time</TableHead>
                          <TableHead>Break Status</TableHead>
                          <TableHead>Coverage Status</TableHead>
                          <TableHead>Break Times</TableHead>
                          <TableHead className="text-right">Quick Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workingEmployees.map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell className="font-medium">{emp.name}</TableCell>
                            <TableCell>{emp.department}</TableCell>
                            <TableCell>{formatShiftHours(emp.shiftHours)}</TableCell>
                            <TableCell>
                              {formatTime(emp.breakEntry.shiftStart)} - {formatTime(emp.breakEntry.shiftEnd)}
                            </TableCell>
                            <TableCell>{getStatusBadge(emp.breakStatus)}</TableCell>
                            <TableCell>{getCoverageBadge(emp.coverageStatus)}</TableCell>
                            <TableCell>
                              <div className="space-y-1 text-xs">
                                {emp.hasBreak1 ? (
                                  <div>
                                    Break 1: {formatTime(emp.breakEntry.break1Start)} -{" "}
                                    {formatTime(emp.breakEntry.break1End)}
                                  </div>
                                ) : (
                                  <div className="text-gray-400">Break 1: Not scheduled</div>
                                )}
                                {emp.isEligibleForBreak2 &&
                                  (emp.hasBreak2 ? (
                                    <div>
                                      Break 2: {formatTime(emp.breakEntry.break2Start)} -{" "}
                                      {formatTime(emp.breakEntry.break2End)}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400">Break 2: Not scheduled</div>
                                  ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {!emp.hasBreak1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickAddBreak(emp.id, "break1")}
                                  >
                                    Add Break 1
                                  </Button>
                                )}
                                {emp.isEligibleForBreak2 && !emp.hasBreak2 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickAddBreak(emp.id, "break2")}
                                  >
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">Employee Name</Label>
                <Input
                  id="new-name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="Enter employee name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-department">Department</Label>
                <Select
                  value={newEmployee.department}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value as Department })}
                >
                  <SelectTrigger id="new-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RBT">RBT</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="BCBA">BCBA</SelectItem>
                    <SelectItem value="Floater">Floater</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddEmployee} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {editingEmployee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Employee Name</Label>
                <Input
                  id="edit-name"
                  value={editingEmployee.name}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={editingEmployee.department}
                  onValueChange={(value) => setEditingEmployee({ ...editingEmployee, department: value as Department })}
                >
                  <SelectTrigger id="edit-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RBT">RBT</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="BCBA">BCBA</SelectItem>
                    <SelectItem value="Floater">Floater</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete employee <strong>{employeeToDelete?.name}</strong>? This will also remove
            all break entries associated with this employee.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
