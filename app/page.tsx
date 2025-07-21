"use client"

import { useState, useEffect } from "react"
import EmployeeBreakDashboard from "@/components/employee-break-dashboard"
import PrivacyBanner from "@/components/privacy-banner"

export default function Home() {
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a privacy choice
    const hasConsent = localStorage.getItem("analytics-consent")
    if (!hasConsent) {
      setShowPrivacyBanner(true)
    }
  }, [])

  const handlePrivacyAccept = () => {
    localStorage.setItem("analytics-consent", "accepted")
    localStorage.setItem("analytics-consent-date", new Date().toISOString())
    setShowPrivacyBanner(false)
  }

  const handlePrivacyDecline = () => {
    localStorage.setItem("analytics-consent", "declined")
    localStorage.setItem("analytics-consent-date", new Date().toISOString())
    setShowPrivacyBanner(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary py-4 px-6 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Employee Break Protocol</h1>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">
        <EmployeeBreakDashboard />
        {showPrivacyBanner && <PrivacyBanner onAccept={handlePrivacyAccept} onDecline={handlePrivacyDecline} />}
      </main>
      <footer className="bg-gray-100 py-4 px-6 border-t">
        <div className="container mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Trip-tech.art
        </div>
      </footer>
    </div>
  )
}
