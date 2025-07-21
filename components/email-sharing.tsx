"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Send, Users, Shield, Copy, CheckCircle, AlertCircle, Clock } from "lucide-react"
import type { Employee, BreakEntry } from "@/lib/types"
import { useAnalytics } from "@/hooks/use-analytics"

interface EmailSharingProps {
  isOpen: boolean
  onClose: () => void
  employees: Employee[]
  breakEntries: BreakEntry[]
}

interface ShareLink {
  id: string
  email: string
  permissions: "view" | "edit" | "admin"
  createdAt: Date
  expiresAt: Date
  accessCount: number
  lastAccessed?: Date
  isActive: boolean
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

export default function EmailSharing({ isOpen, onClose, employees, breakEntries }: EmailSharingProps) {
  const analytics = useAnalytics()
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [permissions, setPermissions] = useState<"view" | "edit" | "admin">("edit")
  const [expirationDays, setExpirationDays] = useState("30")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [generatedLink, setGeneratedLink] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })

  // Mock data for existing shares (in real app, this would come from a database)
  const [existingShares, setExistingShares] = useState<ShareLink[]>([
    {
      id: "1",
      email: "manager@company.com",
      permissions: "admin",
      createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
      expiresAt: new Date(Date.now() + 86400000 * 25), // 25 days from now
      accessCount: 12,
      lastAccessed: new Date(Date.now() - 86400000 * 1), // 1 day ago
      isActive: true,
    },
    {
      id: "2",
      email: "supervisor@company.com",
      permissions: "edit",
      createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
      expiresAt: new Date(Date.now() + 86400000 * 20), // 20 days from now
      accessCount: 8,
      lastAccessed: new Date(Date.now() - 86400000 * 2), // 2 days ago
      isActive: true,
    },
  ])

  const emailTemplates: EmailTemplate[] = [
    {
      id: "default",
      name: "Default Invitation",
      subject: "Access to Employee Break Management System",
      body: `Hi {recipientName},

You've been granted access to our Employee Break Management System. This tool allows you to manage employee schedules, breaks, and coverage assignments.

Your access level: {permissions}
Link expires: {expirationDate}

Click the link below to access the system:
{shareLink}

{customMessage}

Best regards,
{senderName}`,
    },
    {
      id: "manager",
      name: "Manager Access",
      subject: "Manager Access - Employee Break System",
      body: `Dear {recipientName},

You now have manager-level access to our Employee Break Management System. This includes:

• View and edit all employee schedules
• Manage break assignments and coverage
• Access management analytics and reports
• Export data and generate reports

Access Details:
- Permission Level: {permissions}
- Link Expires: {expirationDate}
- Access Link: {shareLink}

{customMessage}

Please keep this link secure and do not share it with unauthorized personnel.

Best regards,
{senderName}`,
    },
    {
      id: "supervisor",
      name: "Supervisor Access - Break Management",
      subject: "Supervisor Access - Break Management",
      body: `Hello {recipientName},

You've been granted supervisor access to the Employee Break Management System. You can:

• View and edit employee break schedules
• Assign coverage for breaks
• Add and modify employee information
• View daily and weekly schedules

Access Information:
- Permission Level: {permissions}
- Valid Until: {expirationDate}
- System Link: {shareLink}

{customMessage}

If you have any questions about using the system, please don't hesitate to reach out.

Best regards,
{senderName}`,
    },
  ]

  const [selectedTemplate, setSelectedTemplate] = useState("default")

  const generateShareLink = async () => {
    setIsGeneratingLink(true)

    // Simulate API call to generate secure share link
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a more realistic test token
    const token = "test_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/shared/${token}`

    setGeneratedLink(shareUrl)
    setIsGeneratingLink(false)
  }

  const sendEmail = async () => {
    if (!recipientEmail || !generatedLink) {
      setSendStatus({ type: "error", message: "Please generate a share link first." })
      return
    }

    setIsSending(true)
    setSendStatus({ type: null, message: "" })

    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Add to existing shares
      const newShare: ShareLink = {
        id: Date.now().toString(),
        email: recipientEmail,
        permissions,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + Number.parseInt(expirationDays) * 86400000),
        accessCount: 0,
        isActive: true,
      }

      setExistingShares([newShare, ...existingShares])

      setSendStatus({
        type: "success",
        message: `Access link sent successfully to ${recipientEmail}`,
      })

      // Track the sharing action
      analytics.trackShare("Send Email Invitation", permissions)

      // Reset form
      setRecipientEmail("")
      setRecipientName("")
      setCustomMessage("")
      setGeneratedLink("")
    } catch (error) {
      setSendStatus({
        type: "error",
        message: "Failed to send email. Please try again.",
      })
      analytics.trackAppError(error as Error, "Email Sharing")
    } finally {
      setIsSending(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSendStatus({ type: "success", message: "Link copied to clipboard!" })
    } catch (error) {
      setSendStatus({ type: "error", message: "Failed to copy link" })
    }
  }

  const revokeAccess = (shareId: string) => {
    setExistingShares(existingShares.map((share) => (share.id === shareId ? { ...share, isActive: false } : share)))
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

  const getStatusBadge = (share: ShareLink) => {
    if (!share.isActive) {
      return <Badge variant="destructive">Revoked</Badge>
    }
    if (share.expiresAt < new Date()) {
      return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSelectedTemplate = () => {
    return emailTemplates.find((t) => t.id === selectedTemplate) || emailTemplates[0]
  }

  const generateEmailPreview = () => {
    const template = getSelectedTemplate()
    const expirationDate = new Date(Date.now() + Number.parseInt(expirationDays) * 86400000).toLocaleDateString()

    return template.body
      .replace("{recipientName}", recipientName || "[Recipient Name]")
      .replace("{permissions}", permissions.charAt(0).toUpperCase() + permissions.slice(1))
      .replace("{expirationDate}", expirationDate)
      .replace("{shareLink}", generatedLink || "[Generated Link Will Appear Here]")
      .replace("{customMessage}", customMessage || "")
      .replace("{senderName}", "[Your Name]")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share Employee Break Management System
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send">Send Access</TabsTrigger>
            <TabsTrigger value="manage">Manage Access</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recipient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Email Address *</Label>
                    <Input
                      id="recipient-email"
                      type="email"
                      placeholder="recipient@company.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient-name">Name</Label>
                    <Input
                      id="recipient-name"
                      placeholder="John Doe"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permissions">Permission Level</Label>
                    <Select
                      value={permissions}
                      onValueChange={(value: "view" | "edit" | "admin") => setPermissions(value)}
                    >
                      <SelectTrigger id="permissions">
                        <SelectValue placeholder="Select permission level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only - Can view schedules and data</SelectItem>
                        <SelectItem value="edit">Edit Access - Can modify schedules and employee data</SelectItem>
                        <SelectItem value="admin">Admin Access - Full access including management features</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Link Expires In</Label>
                    <Select value={expirationDays} onValueChange={setExpirationDays}>
                      <SelectTrigger id="expiration">
                        <SelectValue placeholder="Select expiration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Permission Details:</h4>
                  <div className="text-sm text-blue-800">
                    {permissions === "view" && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>View employee schedules and break assignments</li>
                        <li>Export data to CSV</li>
                        <li>View management analytics (read-only)</li>
                      </ul>
                    )}
                    {permissions === "edit" && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>All view permissions</li>
                        <li>Add, edit, and delete employee information</li>
                        <li>Modify break schedules and coverage assignments</li>
                        <li>Create and update work schedules</li>
                      </ul>
                    )}
                    {permissions === "admin" && (
                      <ul className="list-disc list-inside space-y-1">
                        <li>All edit permissions</li>
                        <li>Access management controls and analytics</li>
                        <li>Backup and restore data</li>
                        <li>Manage notification settings</li>
                      </ul>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Template */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Choose Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select email template" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Add any additional information or instructions..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Preview</Label>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <div className="text-sm font-medium mb-2">Subject: {getSelectedTemplate().subject}</div>
                    <div className="text-sm whitespace-pre-wrap">{generateEmailPreview()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate and Send */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generate Access Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={generateShareLink} disabled={isGeneratingLink} className="flex items-center gap-2">
                    {isGeneratingLink ? <Clock className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    {isGeneratingLink ? "Generating..." : "Generate Secure Link"}
                  </Button>
                  {generatedLink && (
                    <Button variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  )}
                </div>

                {generatedLink && (
                  <div className="space-y-2">
                    <Label>Generated Access Link</Label>
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <div className="text-sm font-mono break-all">{generatedLink}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={sendEmail}
                    disabled={isSending || !generatedLink || !recipientEmail}
                    className="flex items-center gap-2"
                  >
                    {isSending ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {isSending ? "Sending..." : "Send Email"}
                  </Button>
                </div>

                {sendStatus.type && (
                  <Alert
                    className={
                      sendStatus.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                    }
                  >
                    {sendStatus.type === "error" ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <AlertDescription className={sendStatus.type === "error" ? "text-red-700" : "text-green-700"}>
                      {sendStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Access Links
                  </div>
                  <Badge variant="outline">{existingShares.filter((s) => s.isActive).length} Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {existingShares.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No access links have been created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {existingShares.map((share) => (
                      <div key={share.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{share.email}</span>
                            {getPermissionBadge(share.permissions)}
                            {getStatusBadge(share)}
                          </div>
                          {share.isActive && (
                            <Button variant="outline" size="sm" onClick={() => revokeAccess(share.id)}>
                              Revoke Access
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Created:</span>
                            <br />
                            {formatDate(share.createdAt)}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span>
                            <br />
                            {formatDate(share.expiresAt)}
                          </div>
                          <div>
                            <span className="font-medium">Access Count:</span>
                            <br />
                            {share.accessCount} times
                          </div>
                          <div>
                            <span className="font-medium">Last Accessed:</span>
                            <br />
                            {share.lastAccessed ? formatDate(share.lastAccessed) : "Never"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Security Notes:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Recipients cannot modify the application code or structure</li>
                    <li>Access is limited to data management and viewing only</li>
                    <li>All access is logged and can be monitored</li>
                    <li>Links can be revoked at any time</li>
                    <li>Recipients cannot create new access links for others</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">What Recipients Can Access:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Employee management (add, edit, delete employees)</li>
                    <li>Break schedule management</li>
                    <li>Coverage assignment</li>
                    <li>Data export (CSV)</li>
                    <li>Management analytics (based on permission level)</li>
                  </ul>
                </div>

                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <h4 className="font-medium text-red-900 mb-2">What Recipients Cannot Access:</h4>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Application source code or configuration</li>
                    <li>Database structure or direct database access</li>
                    <li>Server settings or deployment configuration</li>
                    <li>Email sharing functionality (cannot invite others)</li>
                    <li>System administration features</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
