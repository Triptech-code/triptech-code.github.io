import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { BreakEntry, Employee } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(timeString?: string): string {
  if (!timeString) return ""

  try {
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12

    return `${formattedHour}:${minutes} ${ampm}`
  } catch (error) {
    return timeString
  }
}

export function calculateBreakDuration(start?: string, end?: string): number {
  if (!start || !end) return 0

  const [startHours, startMinutes] = start.split(":").map(Number)
  const [endHours, endMinutes] = end.split(":").map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  // Handle cases where the break spans across midnight
  const duration =
    endTotalMinutes >= startTotalMinutes
      ? endTotalMinutes - startTotalMinutes
      : 24 * 60 - startTotalMinutes + endTotalMinutes

  return duration
}

export function calculateTotalHours(entry: BreakEntry): string {
  const {
    shiftStart,
    shiftEnd,
    break1Start,
    break1End,
    break2Start,
    break2End,
    outsideTherapyStart,
    outsideTherapyEnd,
  } = entry

  if (!shiftStart || !shiftEnd) return "0.00"

  const [startHours, startMinutes] = shiftStart.split(":").map(Number)
  const [endHours, endMinutes] = shiftEnd.split(":").map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  // Handle cases where the shift spans across midnight
  const shiftDurationMinutes =
    endTotalMinutes >= startTotalMinutes
      ? endTotalMinutes - startTotalMinutes
      : 24 * 60 - startTotalMinutes + endTotalMinutes

  // Subtract break durations
  const break1Duration = calculateBreakDuration(break1Start, break1End)
  const break2Duration = calculateBreakDuration(break2Start, break2End)
  const outsideTherapyDuration = calculateBreakDuration(outsideTherapyStart, outsideTherapyEnd)

  const totalMinutes = shiftDurationMinutes - break1Duration - break2Duration - outsideTherapyDuration
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}.${minutes.toString().padStart(2, "0")}`
}

export function calculateShiftHours(shiftStart?: string, shiftEnd?: string): number {
  if (!shiftStart || !shiftEnd) return 0

  const [startHours, startMinutes] = shiftStart.split(":").map(Number)
  const [endHours, endMinutes] = shiftEnd.split(":").map(Number)

  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  // Handle cases where the shift spans across midnight
  const shiftDurationMinutes =
    endTotalMinutes >= startTotalMinutes
      ? endTotalMinutes - startTotalMinutes
      : 24 * 60 - startTotalMinutes + endTotalMinutes

  return shiftDurationMinutes / 60
}

export function formatShiftHours(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (minutes === 0) {
    return `${wholeHours}.00 hrs`
  } else {
    return `${wholeHours}.${minutes.toString().padStart(2, "0")} hrs`
  }
}

export function exportToCSV(breakEntries: BreakEntry[], employees: Employee[], filename: string) {
  // Create headers
  const headers = [
    "Date",
    "Employee",
    "Department",
    "Shift Start",
    "Shift End",
    "Break 1 Start",
    "Break 1 End",
    "Break 1 Coverage",
    "Break 2 Start",
    "Break 2 End",
    "Break 2 Coverage",
    "Outside Therapy Start",
    "Outside Therapy End",
    "Outside Therapy Reason",
    "Total Hours",
  ]

  // Create rows
  const rows = breakEntries.map((entry) => {
    const employee = employees.find((e) => e.id === entry.employeeId)
    const coverage1Employee = employees.find((e) => e.id === entry.coverageEmployeeId)
    const coverage2Employee = employees.find((e) => e.id === entry.coverage2EmployeeId)

    const date = new Date(entry.date)
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`

    return [
      formattedDate,
      employee?.name || "Unknown",
      employee?.department || "Unknown",
      formatTime(entry.shiftStart),
      formatTime(entry.shiftEnd),
      formatTime(entry.break1Start),
      formatTime(entry.break1End),
      coverage1Employee?.name || "",
      formatTime(entry.break2Start),
      formatTime(entry.break2End),
      coverage2Employee?.name || "",
      formatTime(entry.outsideTherapyStart),
      formatTime(entry.outsideTherapyEnd),
      entry.outsideTherapyReason || "",
      calculateTotalHours(entry),
    ]
  })

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

  // Create and download the file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatOutsideTherapyTime(start?: string, end?: string, reason?: string): string {
  if (!start || !end) return ""

  const formattedTime = `${formatTime(start)} - ${formatTime(end)}`
  return reason ? `${formattedTime} (${reason})` : formattedTime
}
