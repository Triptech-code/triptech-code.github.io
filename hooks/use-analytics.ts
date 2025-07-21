"use client"

import { useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import {
  pageview,
  trackEmployeeAction,
  trackBreakAction,
  trackDataAction,
  trackSharingAction,
  trackUIAction,
  trackTiming,
  trackEngagement,
  trackSearch,
  trackError,
  isAnalyticsEnabled,
} from "@/lib/gtag"

// Main analytics hook
export function useAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (isAnalyticsEnabled()) {
      pageview(pathname)
    }
  }, [pathname])

  const trackEvent = useCallback((action: string, category: string, label?: string, value?: number) => {
    if (isAnalyticsEnabled()) {
      trackUIAction(action, category)
    }
  }, [])

  return {
    trackEvent,
    trackEmployeeAction,
    trackBreakAction,
    trackDataAction,
    trackSharingAction,
    trackError,
  }
}

// Page analytics hook (for backward compatibility)
export function usePageAnalytics() {
  const pathname = usePathname()

  useEffect(() => {
    if (isAnalyticsEnabled()) {
      pageview(pathname)
    }
  }, [pathname])
}

// Data management analytics
export function useDataAnalytics() {
  const trackExport = useCallback((format: string) => {
    trackDataAction("export", format)
  }, [])

  const trackBackup = useCallback(() => {
    trackDataAction("backup")
  }, [])

  const trackRestore = useCallback(() => {
    trackDataAction("restore")
  }, [])

  const trackImport = useCallback((format: string) => {
    trackDataAction("import", format)
  }, [])

  return {
    trackExport,
    trackBackup,
    trackRestore,
    trackImport,
  }
}

// Sharing analytics
export function useSharingAnalytics() {
  const trackEmailSent = useCallback(() => {
    trackSharingAction("email_sent")
  }, [])

  const trackLinkCreated = useCallback(() => {
    trackSharingAction("link_created")
  }, [])

  const trackAccessGranted = useCallback(() => {
    trackSharingAction("access_granted")
  }, [])

  const trackSharedView = useCallback(() => {
    trackSharingAction("shared_view")
  }, [])

  return {
    trackEmailSent,
    trackLinkCreated,
    trackAccessGranted,
    trackSharedView,
  }
}

// Performance tracking
export function usePerformanceTracking() {
  const trackLoadTime = useCallback((componentName: string, loadTime: number) => {
    trackTiming(`${componentName}_load`, loadTime, "Component Performance")
  }, [])

  const trackUserAction = useCallback((actionName: string, duration: number) => {
    trackTiming(`${actionName}_duration`, duration, "User Actions")
  }, [])

  return {
    trackLoadTime,
    trackUserAction,
  }
}

// Feature engagement tracking
export function useEngagementTracking() {
  const trackFeatureUsage = useCallback((featureName: string, duration?: number) => {
    trackEngagement(featureName, duration)
  }, [])

  const trackUserFlow = useCallback((flowName: string, stepNumber: number) => {
    trackUIAction(`${flowName}_step_${stepNumber}`, "User Flow")
  }, [])

  return {
    trackFeatureUsage,
    trackUserFlow,
  }
}

// Search and filter analytics
export function useSearchAnalytics() {
  const trackSearchQuery = useCallback((searchType: string, resultsCount: number) => {
    trackSearch(searchType, resultsCount)
  }, [])

  const trackFilterUsage = useCallback((filterType: string, filterValue: string) => {
    trackUIAction(`filter_${filterType}`, `Filter Usage: ${filterValue}`)
  }, [])

  return {
    trackSearchQuery,
    trackFilterUsage,
  }
}

// Error tracking hook
export function useErrorTracking() {
  const trackApplicationError = useCallback((error: Error, context?: string) => {
    trackError(error.message, context, false)
  }, [])

  const trackFatalError = useCallback((error: Error, context?: string) => {
    trackError(error.message, context, true)
  }, [])

  return {
    trackApplicationError,
    trackFatalError,
  }
}
