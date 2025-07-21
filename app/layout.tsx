import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import GoogleAnalytics from "@/components/google-analytics"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Employee Break Management System",
  description: "Comprehensive employee break management system with scheduling, tracking, and compliance features",
  keywords: ["employee management", "break scheduling", "workforce management", "hr tools"],
  authors: [{ name: "Triptech-code", url: "https://triptech.art" }],
  creator: "Triptech-code",
  publisher: "Triptech-code",
  robots: "index, follow",
  openGraph: {
    title: "Employee Break Management System",
    description: "Comprehensive employee break management system with scheduling, tracking, and compliance features",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Employee Break Management System",
    description: "Comprehensive employee break management system with scheduling, tracking, and compliance features",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  )
}
