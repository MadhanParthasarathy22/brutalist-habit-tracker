"use client"

import { useEffect } from "react"

export default function PWALoader() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Avoid double-register on HMR
      const register = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js")
          // console.log('[v0] SW registered')
        } catch (e) {
          // console.log('[v0] SW registration failed', e)
        }
      }
      register()
    }
  }, [])
  return <span id="pwa-register-hook" hidden />
}
