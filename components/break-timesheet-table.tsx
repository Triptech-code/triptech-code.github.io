"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Employee, BreakEntry } from "@/lib/types"
import { calculateTotalHours, formatTime, calculateShiftHours, formatShiftHours } from "@/lib/utils"
import { Edit, Trash2, AlertCircle } from "lucide-react"

interface BreakTimesheetTableProps {
  breakEntries: BreakEntry[]
  employees: Employee[]
  workingEmployees: Employee[]
  onUpdateEntry: (entry: BreakEntry) => void
  onDeleteEntry: (id: string) => void
}

export default function BreakTimesheetTable({
  breakEntries,
  employees,
  workingEmployees,
  onUpdateEntry,
  onDeleteEntry,
}: BreakTimesheetTableProps) {
  const [editingEntry, setEditingEntry] = useState<BreakEntry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)

  const handleEditClick = (entry: BreakEntry) => {
    setEditingEntry({ ...entry })
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingEntry) {
      onUpdateEntry(editingEntry)
      setIsEditDialogOpen(false)
      setEditingEntry(null)
    }
  }

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete)
      setIsDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const getEmployeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id)
    return employee ? employee.name : "Unknown"
  }

  if (breakEntries.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-gray-50">
        <p className="text-gray-500">No break entries found for the selected filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Shift Hours</TableHead>
            <TableHead>Shift Start</TableHead>
            <TableHead>Shift End</TableHead>
            <TableHead>Break 1</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead>Break 2</TableHead>
            <TableHead>Coverage</TableHead>
            <TableHead>Outside Therapy</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breakEntries.map((entry) => {
            const totalHours = calculateTotalHours(entry)
            const shiftHours = calculateShiftHours(entry.shiftStart, entry.shiftEnd)
            const missingBreakCoverage =
              (entry.break1Start && entry.break1End && !entry.coverageEmployeeId) ||
              (entry.break2Start && entry.break2End && !entry.coverage2EmployeeId)

            return (
              <TableRow key={entry.id} className={missingBreakCoverage ? "bg-red-50" : ""}>
                <TableCell className="font-medium">{getEmployeeName(entry.employeeId)}</TableCell>
                <TableCell className="font-medium text-blue-600">{formatShiftHours(shiftHours)}</TableCell>
                <TableCell>{formatTime(entry.shiftStart)}</TableCell>
                <TableCell>{formatTime(entry.shiftEnd)}</TableCell>
                <TableCell>
                  {entry.break1Start && entry.break1End ? (
                    `${formatTime(entry.break1Start)} - ${formatTime(entry.break1End)}`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.coverageEmployeeId ? (
                    getEmployeeName(entry.coverageEmployeeId)
                  ) : entry.break1Start && entry.break1End ? (
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Missing</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.break2Start && entry.break2End ? (
                    `${formatTime(entry.break2Start)} - ${formatTime(entry.break2End)}`
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.coverage2EmployeeId ? (
                    getEmployeeName(entry.coverage2EmployeeId)
                  ) : entry.break2Start && entry.break2End ? (
                    <div className="flex items-center text-red-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Missing</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.outsideTherapyStart && entry.outsideTherapyEnd ? (
                    <div className="text-xs">
                      <div>{formatTime(entry.outsideTherapyStart)} - {formatTime(entry.outsideTherapyEnd)}</div>
                      {entry.outsideTherapyReason && (
                        <div className="text-gray-500 italic">({entry.outsideTherapyReason})</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-green-600">{calculateTotalHours(entry)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Break Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-employee">Employee</Label>
                  <Select
                    value={editingEntry.employeeId}
                    onValueChange={(value) => setEditingEntry({ ...editingEntry, employeeId: value })}
                  >
                    <SelectTrigger id="edit-employee">
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
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingEntry.date.split("T")[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value)
                      const oldDate = new Date(editingEntry.date)
                      oldDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
                      setEditingEntry({ ...editingEntry, date: oldDate.toISOString() })
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-shiftStart">Shift Start Time</Label>
                  <Input
                    id="edit-shiftStart"
                    type="time"
                    value={editingEntry.shiftStart}
                    onChange={(e) => setEditingEntry({ ...editingEntry, shiftStart: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-shiftEnd">Shift End Time</Label>
                  <Input
                    id="edit-shiftEnd"
                    type="time"
                    value={editingEntry.shiftEnd}
                    onChange={(e) => setEditingEntry({ ...editingEntry, shiftEnd: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Shift Hours</Label>
                  <div className="px-3 py-2 bg-gray-50 border rounded-md text-sm font-medium">
                    {formatShiftHours(calculateShiftHours(editingEntry.shiftStart, editingEntry.shiftEnd))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Break 1</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-break1Start">Break Start Time</Label>
                    <Input
                      id="edit-break1Start"
                      type="time"
                      value={editingEntry.break1Start || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, break1Start: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-break1End">Break End Time</Label>
                    <Input
                      id="edit-break1End"
                      type="time"
                      value={editingEntry.break1End || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, break1End: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-coverageEmployee">Coverage Employee</Label>
                    <Select
                      value={editingEntry.coverageEmployeeId || ""}
                      onValueChange={(value) => setEditingEntry({ ...editingEntry, coverageEmployeeId: value })}
                    >
                      <SelectTrigger id="edit-coverageEmployee">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {workingEmployees
                          .filter((e) => e.id !== editingEntry.employeeId)
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

              {calculateShiftHours(editingEntry.shiftStart, editingEntry.shiftEnd) >= 6.5 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">Break 2 (for shifts 6.5+ hours)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-break2Start">Break Start Time</Label>
                      <Input
                        id="edit-break2Start"
                        type="time"
                        value={editingEntry.break2Start || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, break2Start: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-break2End">Break End Time</Label>
                      <Input
                        id="edit-break2End"
                        type="time"
                        value={editingEntry.break2End || ""}
                        onChange={(e) => setEditingEntry({ ...editingEntry, break2End: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-coverage2Employee">Coverage Employee</Label>
                      <Select
                        value={editingEntry.coverage2EmployeeId || ""}
                        onValueChange={(value) => setEditingEntry({ ...editingEntry, coverage2EmployeeId: value })}
                      >
                        <SelectTrigger id="edit-coverage2Employee">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {workingEmployees
                            .filter((e) => e.id !== editingEntry.employeeId)
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
              </div>\
              {/* Outside Therapy Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">Time Outside Therapy</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-outsideTherapyStart">Start Time</Label>
                    <Input
                      id="edit-outsideTherapyStart"
                      type="time"
                      value={editingEntry.outsideTherapyStart || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, outsideTherapyStart: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-outsideTherapyEnd">End Time</Label>
                    <Input
                      id="edit-outsideTherapyEnd"
                      type="time"
                      value={editingEntry.outsideTherapyEnd || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, outsideTherapyEnd: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-outsideTherapyReason">Reason</Label>
                    <Input
                      id="edit-outsideTherapyReason"
                      type="text"
                      placeholder="e.g., Client meeting, Training"
                      value={editingEntry.outsideTherapyReason || ""}
                      onChange={(e) => setEditingEntry({ ...editingEntry, outsideTherapyReason: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {calculateShiftHours(editingEntry.shiftStart, editingEntry.shiftEnd) < 6.5 &&
                calculateShiftHours(editingEntry.shiftStart, editingEntry.shiftEnd) > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Second break is available for shifts of 6.5 hours or longer. Current
                        shift: {formatShiftHours(calculateShiftHours(editingEntry.shiftStart, editingEntry.shiftEnd))}
                      </p>
                    </div>
                  </div>
                )}

              {workingEmployees.length === 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Note:</strong> No employees are currently scheduled to work on this date. Coverage options
                      will be limited to all employees.
                    </p>
                  </div>
                </div>
              )}
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
          <p>Are you sure you want to delete this break entry? This action cannot be undone.</p>
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
    </div>
  )
}
