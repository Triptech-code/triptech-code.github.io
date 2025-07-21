declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "consent",
      targetId: string | "default" | "update",
      config?: {
        page_path?: string
        event_category?: string
        event_label?: string
        value?: number
        anonymize_ip?: boolean
        allow_google_signals?: boolean
        allow_ad_personalization_signals?: boolean
        send_page_view?: boolean
        cookie_flags?: string
        analytics_storage?: "granted" | "denied"
        ad_storage?: "granted" | "denied"
        ad_user_data?: "granted" | "denied"
        ad_personalization?: "granted" | "denied"
        description?: string
        fatal?: boolean
      },
    ) => void
    dataLayer: unknown[]
  }
}

export {}
