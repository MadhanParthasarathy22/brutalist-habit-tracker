import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "brutalist habit tracker",
  description: "Created with v0 by Madhan Parthasarathy",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* PWA: Manifest and theme colors */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#191919" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#191919" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body suppressHydrationWarning className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
