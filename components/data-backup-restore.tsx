"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Employee, BreakEntry } from "@/lib/types"
import { Download, Upload, Database, AlertCircle, CheckCircle } from "lucide-react"

interface DataBackupRestoreProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  breakEntries: BreakEntry[]
  onRestoreData: (employees: Employee[], breakEntries: BreakEntry[]) => void
}

interface BackupData {
  version: string
  timestamp: string
  employees: Employee[]
  breakEntries: BreakEntry[]
  metadata: {
    totalEmployees: number
    totalBreakEntries: number
    departments: string[]
  }
}

export default function DataBackupRestore({
  isOpen,
  onClose,
  employees,
  breakEntries,
  onRestoreData,
}: DataBackupRestoreProps) {
  const [restoreData, setRestoreData] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })

  const generateBackup = (): BackupData => {
    const departments = [...new Set(employees.map((emp) => emp.department))]

    return {
      version: "1.0",
      timestamp: new Date().toISOString(),
      employees,
      breakEntries,
      metadata: {
        totalEmployees: employees.length,
        totalBreakEntries: breakEntries.length,
        departments,
      },
    }
  }

  const handleBackupDownload = () => {
    const backup = generateBackup()
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url

    const timestamp = new Date().toISOString().split("T")[0]
    link.download = `employee-break-backup-${timestamp}.json`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setRestoreData(content)
    }
    reader.readAsText(file)
  }

  const validateBackupData = (data: any): data is BackupData => {
    if (!data || typeof data !== "object") return false
    if (!data.version || !data.timestamp) return false
    if (!Array.isArray(data.employees) || !Array.isArray(data.breakEntries)) return false
    if (!data.metadata || typeof data.metadata !== "object") return false

    // Validate employee structure
    for (const emp of data.employees) {
      if (!emp.id || !emp.name || !emp.department) return false
    }

    // Validate break entry structure
    for (const entry of data.breakEntries) {
      if (!entry.id || !entry.employeeId || !entry.date || !entry.shiftStart || !entry.shiftEnd) return false
    }

    return true
  }

  const handleRestore = async () => {
    if (!restoreData.trim()) {
      setRestoreStatus({
        type: "error",
        message: "Please provide backup data to restore.",
      })
      return
    }

    setIsRestoring(true)
    setRestoreStatus({ type: null, message: "" })

    try {
      const parsedData = JSON.parse(restoreData)

      if (!validateBackupData(parsedData)) {
        throw new Error("Invalid backup data format. Please check your backup file.")
      }

      // Additional validation
      if (parsedData.version !== "1.0") {
        throw new Error(`Unsupported backup version: ${parsedData.version}. Expected version 1.0.`)
      }

      // Restore the data
      onRestoreData(parsedData.employees, parsedData.breakEntries)

      setRestoreStatus({
        type: "success",
        message: `Successfully restored ${parsedData.metadata.totalEmployees} employees and ${parsedData.metadata.totalBreakEntries} break entries.`,
      })

      // Clear the restore data
      setRestoreData("")
    } catch (error) {
      setRestoreStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to restore data. Please check your backup format.",
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const handleClearData = () => {
    if (
      confirm("Are you sure you want to clear all current data? This action cannot be undone unless you have a backup.")
    ) {
      onRestoreData([], [])
      setRestoreStatus({
        type: "success",
        message: "All data has been cleared successfully.",
      })
    }
  }

  const currentDataSummary = {
    employees: employees.length,
    breakEntries: breakEntries.length,
    departments: [...new Set(employees.map((emp) => emp.department))],
    lastModified: localStorage.getItem("lastDataUpdate") || "Unknown",
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Backup & Restore
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Current Data Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Employees:</span> {currentDataSummary.employees}
              </div>
              <div>
                <span className="font-medium">Break Entries:</span> {currentDataSummary.breakEntries}
              </div>
              <div className="col-span-2">
                <span className="font-medium">Departments:</span> {currentDataSummary.departments.join(", ") || "None"}
              </div>
            </div>
          </div>

          {/* Backup Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Create Backup</h3>
            <p className="text-sm text-gray-600">
              Download a complete backup of all employee data and break entries. This file can be used to restore your
              data later.
            </p>
            <Button onClick={handleBackupDownload} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Backup
            </Button>
          </div>

          {/* Restore Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium text-lg">Restore from Backup</h3>
            <p className="text-sm text-gray-600">
              Upload a backup file or paste backup data to restore your employee and break entry information.
            </p>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="backup-file">Upload Backup File</Label>
              <input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
              />
            </div>

            {/* Manual Data Entry */}
            <div className="space-y-2">
              <Label htmlFor="restore-data">Or Paste Backup Data</Label>
              <Textarea
                id="restore-data"
                placeholder="Paste your backup JSON data here..."
                value={restoreData}
                onChange={(e) => setRestoreData(e.target.value)}
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            {/* Status Messages */}
            {restoreStatus.type && (
              <Alert
                className={restoreStatus.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
              >
                {restoreStatus.type === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={restoreStatus.type === "error" ? "text-red-700" : "text-green-700"}>
                  {restoreStatus.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleRestore} disabled={isRestoring || !restoreData.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                {isRestoring ? "Restoring..." : "Restore Data"}
              </Button>

              <Button variant="destructive" onClick={handleClearData}>
                Clear All Data
              </Button>
            </div>
          </div>

          {/* Warning */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <strong>Warning:</strong> Restoring data will replace all current employee and break entry information.
              Make sure to create a backup of your current data before restoring.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
