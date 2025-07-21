"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Shield, Eye, Clock, Globe } from "lucide-react"
import { grantAnalyticsConsent } from "@/lib/gtag"

interface PrivacyBannerProps {
  onAccept: () => void
  onDecline: () => void
}

export default function PrivacyBanner({ onAccept, onDecline }: PrivacyBannerProps) {
  const [showDetails, setShowDetails] = useState(false)

  const handleAccept = () => {
    grantAnalyticsConsent()
    onAccept()
  }

  const handleDecline = () => {
    onDecline()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-2xl shadow-lg">
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Privacy & Analytics</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              GDPR Compliant
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-8 w-8 p-0" onClick={handleDecline}>
            <X className="h-4 w-4" />
          </Button>
          <CardDescription>
            We respect your privacy and want to be transparent about our data practices.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900">What we collect (with your consent):</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <Eye className="h-3 w-3" />
                Page views and navigation patterns (anonymized)
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Feature usage and session duration
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-3 w-3" />
                General location (country/region only)
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-green-50 p-4">
            <h4 className="font-medium text-green-900">What we DON'T collect:</h4>
            <ul className="mt-2 space-y-1 text-sm text-green-800">
              <li>• Personal employee information or sensitive business data</li>
              <li>• Exact IP addresses (all IPs are anonymized)</li>
              <li>• Cross-site tracking or advertising data</li>
              <li>• Any data that could identify individual users</li>
            </ul>
          </div>

          {showDetails && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <h4 className="font-medium">Additional Privacy Information:</h4>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• Data is automatically deleted after 2 months</li>
                <li>• You can withdraw consent at any time</li>
                <li>• We use Google Analytics 4 with strict privacy settings</li>
                <li>• No data is shared with third parties for advertising</li>
                <li>• All employee data stays on your device only</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleAccept} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Accept Analytics
            </Button>
            <Button onClick={handleDecline} variant="outline" className="flex-1 bg-transparent">
              Decline
            </Button>
            <Button onClick={() => setShowDetails(!showDetails)} variant="ghost" size="sm" className="text-xs">
              {showDetails ? "Hide" : "Show"} Details
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This choice helps us improve the app while respecting your privacy. Your employee data always stays private
            and on your device.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
