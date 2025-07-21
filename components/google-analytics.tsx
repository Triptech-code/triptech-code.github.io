"use client"

import Script from "next/script"
import { initGA, GA_TRACKING_ID } from "@/lib/gtag"

export default function GoogleAnalytics() {
  if (!GA_TRACKING_ID) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => {
          initGA()
        }}
      />
    </>
  )
}
