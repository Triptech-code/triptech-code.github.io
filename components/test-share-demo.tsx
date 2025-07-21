"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink, Users, Shield, CheckCircle, Clock } from "lucide-react"

export default function TestShareDemo() {
  const [testLinks, setTestLinks] = useState([
    {
      id: "1",
      name: "Manager Access Test",
      permissions: "admin",
      email: "manager@test.com",
      link: `${window.location.origin}/shared/test_manager_demo_token_123`,
      description: "Full admin access with all management features",
    },
    {
      id: "2",
      name: "Supervisor Access Test",
      permissions: "edit",
      email: "supervisor@test.com",
      link: `${window.location.origin}/shared/test_supervisor_demo_token_456`,
      description: "Edit access for managing schedules and employees",
    },
    {
      id: "3",
      name: "View Only Test",
      permissions: "view",
      email: "viewer@test.com",
      link: `${window.location.origin}/shared/test_viewer_demo_token_789`,
      description: "Read-only access for viewing schedules and exporting data",
    },
  ])

  const [copiedLink, setCopiedLink] = useState("")

  const copyToClipboard = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(link)
      setTimeout(() => setCopiedLink(""), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const openInNewTab = (link: string) => {
    window.open(link, "_blank")
  }

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case "edit":
        return <Badge className="bg-blue-100 text-blue-800">Edit</Badge>
      case "view":
        return <Badge className="bg-gray-100 text-gray-800">View Only</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case "admin":
        return "Full access including management controls, analytics, backup/restore, and all editing capabilities"
      case "edit":
        return "Can add/edit/delete employees, modify schedules, assign coverage, and export data"
      case "view":
        return "Can view schedules, employee information, and export data (read-only access)"
      default:
        return "Unknown permission level"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Test Share App Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>Test Mode:</strong> These are demo links that simulate the shared access experience. In a real
              deployment, these would be generated dynamically with secure tokens.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="links" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="links">Test Links</TabsTrigger>
              <TabsTrigger value="instructions">How to Test</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="space-y-4">
              {testLinks.map((testLink) => (
                <Card key={testLink.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{testLink.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{testLink.description}</p>
                        <div className="flex items-center gap-2">
                          {getPermissionBadge(testLink.permissions)}
                          <span className="text-xs text-gray-500">{testLink.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md mb-3">
                      <div className="text-xs text-gray-600 mb-1">Test Link:</div>
                      <div className="font-mono text-sm break-all">{testLink.link}</div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                      <div className="text-sm font-medium text-blue-900 mb-1">Permission Details:</div>
                      <div className="text-xs text-blue-800">{getPermissionDescription(testLink.permissions)}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(testLink.link)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedLink === testLink.link ? "Copied!" : "Copy Link"}
                      </Button>
                      <Button size="sm" onClick={() => openInNewTab(testLink.link)} className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Test in New Tab
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Test the Share Feature</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Click a Test Link</h4>
                        <p className="text-sm text-gray-600">
                          Choose one of the test links above to simulate different permission levels
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Experience the Validation Screen</h4>
                        <p className="text-sm text-gray-600">
                          You'll see a loading screen followed by an access confirmation page
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Accept Access</h4>
                        <p className="text-sm text-gray-600">
                          Click "Access Employee Break System" to enter the shared app
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Test the Functionality</h4>
                        <p className="text-sm text-gray-600">
                          Try different features based on the permission level you selected
                        </p>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-green-200 bg-green-50">
                    <Users className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      <strong>What to Look For:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Header shows "Shared Access" badge and permission level</li>
                        <li>Footer indicates "Shared Access Mode"</li>
                        <li>All employee management features work normally</li>
                        <li>Data persists in localStorage (simulating shared database)</li>
                        <li>No access to code modification or system settings</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700">
                      <strong>Note:</strong> In a production environment, these links would:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Be generated with cryptographically secure tokens</li>
                        <li>Validate against a real database</li>
                        <li>Track actual usage and access logs</li>
                        <li>Send real emails to recipients</li>
                        <li>Enforce proper expiration and revocation</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
