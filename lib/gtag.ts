/**
 * Google Analytics helper for the Employee Break Protocol App
 * -----------------------------------------------------------
 *  • Works in both development and production
 *  • Queues calls until Google's real gtag.js loads
 *  • Respects an explicit user-consent flag stored in localStorage
 */

declare global {
  // Let TypeScript know these globals will exist in the browser
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var dataLayer: any[] | undefined
  // eslint-disable-next-line @typescript-eslint/ban-types
  var gtag: Function | undefined
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ""

/* ------------------------------------------------------------------ */
/*  ⚙️  SAFETY LAYER – make sure window.gtag always exists            */
/* ------------------------------------------------------------------ */
export function ensureGtag(): void {
  if (typeof window === "undefined") return

  // Ensure the dataLayer array exists (gtag.js uses this)
  window.dataLayer = window.dataLayer || []

  // Stub window.gtag so we can call it safely before the script loads
  if (typeof window.gtag !== "function") {
    window.gtag = function stubGtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  🔐  CONSENT & ENABLEMENT                                          */
/* ------------------------------------------------------------------ */
export const isAnalyticsEnabled = (): boolean => {
  if (!GA_TRACKING_ID) return false // GA not configured
  if (typeof window === "undefined") return false // SSR safety

  const consent = localStorage.getItem("analytics-consent")
  return consent === "accepted"
}

/* ------------------------------------------------------------------ */
/*  🚀  INITIALISATION                                                */
/* ------------------------------------------------------------------ */
export function initGA(): void {
  ensureGtag()

  if (!GA_TRACKING_ID || typeof window === "undefined") return

  // Default all storage to denied (GDPR style) until user opts-in
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })

  // Configure GA with strict privacy options
  window.gtag("config", GA_TRACKING_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false, // we'll send manually
    cookie_flags: "SameSite=Strict;Secure",
  })

  // If the user has previously accepted, grant the consent immediately
  if (isAnalyticsEnabled()) {
    grantAnalyticsConsent()
  }
}

/* ------------------------------------------------------------------ */
/*  ✅  GRANT CONSENT                                                 */
/* ------------------------------------------------------------------ */
export function grantAnalyticsConsent(): void {
  ensureGtag()

  if (!GA_TRACKING_ID || typeof window === "undefined") return

  window.gtag("consent", "update", { analytics_storage: "granted" })
}

/* ------------------------------------------------------------------ */
/*  📄  PAGE VIEWS & EVENTS                                           */
/* ------------------------------------------------------------------ */
export const pageview = (url: string): void => {
  if (!isAnalyticsEnabled()) return
  ensureGtag()

  window.gtag("config", GA_TRACKING_ID, { page_path: url })
}

// ──────────────────────────────────────────────────────────
//  📊  GENERIC EVENT TRACKING
// ──────────────────────────────────────────────────────────
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}): void => {
  if (!isAnalyticsEnabled()) return
  ensureGtag()

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  })
}

/* ------------------------------------------------------------------ */
/*  🔧  DOMAIN-SPECIFIC HELPERS                                       */
/* ------------------------------------------------------------------ */

// Employee management actions
export const trackEmployeeAction = (action: "add" | "edit" | "delete" | "import", count?: number): void =>
  event({
    action: `employee_${action}`,
    category: "Employee Management",
    label: count ? `count_${count}` : undefined,
    value: count,
  })

// Break scheduling actions
export const trackBreakAction = (action: "schedule" | "modify" | "cancel" | "assign_coverage"): void =>
  event({
    action: `break_${action}`,
    category: "Break Management",
  })

// Data-management actions
export const trackDataAction = (action: "export" | "backup" | "restore" | "import", format?: string): void =>
  event({
    action: `data_${action}`,
    category: "Data Management",
    label: format,
  })

// Sharing / collaboration actions
export const trackSharingAction = (action: "email_sent" | "link_created" | "access_granted" | "shared_view"): void =>
  event({
    action,
    category: "Sharing & Collaboration",
  })

// UI interaction actions
export const trackUIAction = (action: string, component: string): void =>
  event({
    action,
    category: "UI Interaction",
    label: component,
  })

// Performance / timing metrics
export const trackTiming = (name: string, value: number, category = "Performance"): void =>
  event({
    action: "timing_complete",
    category,
    label: name,
    value: Math.round(value),
  })

// Feature-usage / engagement metrics
export const trackEngagement = (feature: string, durationMs?: number): void =>
  event({
    action: "user_engagement",
    category: "Feature Usage",
    label: feature,
    value: durationMs ? Math.round(durationMs / 1000) : undefined, // value in seconds
  })

// Search & filter actions
export const trackSearch = (searchType: string, resultsCount?: number): void =>
  event({
    action: "search",
    category: "Search & Filter",
    label: searchType,
    value: resultsCount,
  })

/* ------------------------------------------------------------------ */
/*  🛑  ERROR & EXCEPTION TRACKING                                    */
/* ------------------------------------------------------------------ */
export const trackError = (message: string, context?: string, fatal = false): void => {
  if (!isAnalyticsEnabled()) return
  ensureGtag()

  window.gtag("event", "exception", {
    description: `${context ? `${context}: ` : ""}${message}`,
    fatal,
  })
}
