"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import PWALoader from "@/components/pwa-register"
import HabitHeatmap from "@/components/habit-heatmap"
import StatsCards from "@/components/stats-cards"
import { loadEntries, saveEntries, type EntriesMap } from "@/lib/storage"

function formatDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// pretty date kept if needed in future
function formatDatePretty(isoDate: string) {
  const d = new Date(isoDate)
  const day = d.getDate()
  const month = d.toLocaleString(undefined, { month: "long" })
  const suffix = (n: number) => {
    const j = n % 10, k = n % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }
  return `${day}${suffix(day)} ${month}`
}

export default function Page() {
  const [entries, setEntries] = useState<EntriesMap>({})

  // load from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  // on first load, scroll viewport to the bottom so content starts at the bottom
  useEffect(() => {
    function attemptScroll() {
      const target = document.getElementById("stats-section") || document.getElementById("app-root")
      // Try both APIs; whichever applies will keep us pinned to the bottom
      target?.scrollIntoView({ behavior: "smooth", block: "end" })
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })
    }

    // Try on successive frames to wait for layout, fonts, and suspense content
    const f1 = requestAnimationFrame(() => {
      attemptScroll()
      const f2 = requestAnimationFrame(() => {
        attemptScroll()
      })
      // Timed fallbacks in case late content resizes the page
      const t1 = setTimeout(attemptScroll, 120)
      const t2 = setTimeout(attemptScroll, 360)
      // Cleanups for this scope
      return () => {
        cancelAnimationFrame(f2)
        clearTimeout(t1)
        clearTimeout(t2)
      }
    })

    return () => {
      cancelAnimationFrame(f1)
    }
  }, [])

  const handleChangeEntry = (dateKey: string, value: number | null) => {
    if (value === null) {
      const { [dateKey]: _, ...rest } = entries
      setEntries(rest)
      saveEntries(rest)
      return
    }
    const next = { ...entries, [dateKey]: value }
    setEntries(next)
    saveEntries(next)
  }

  // stats
  const { totalEntries, averageScore, currentStreak, longestStreak } = useMemo(() => {
    const keys = Object.keys(entries)
    const totalEntries = keys.length
    const sum = keys.reduce((acc, k) => acc + (entries[k] ?? 0), 0)
    const averageScore = totalEntries ? sum / totalEntries : 0

    // current streak: consecutive days with entry from today backward
    const today = new Date()
    const set = new Set(keys)
    let c = 0
    for (let i = 0; ; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = formatDateLocal(d)
      if (set.has(key)) c++
      else break
    }

    // longest streak: max consecutive days with entries in history
    let longest = 0
    if (keys.length > 0) {
      // build day-by-day from min to max
      const sorted = keys.slice().sort()
      const min = new Date(sorted[0])
      const max = new Date(sorted[sorted.length - 1])
      let current = 0
      for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
        const key = formatDateLocal(d)
        if (set.has(key)) {
          current++
          if (current > longest) longest = current
        } else {
          current = 0
        }
      }
    }

    return {
      totalEntries,
      averageScore,
      currentStreak: c,
      longestStreak: Math.max(longest, c),
    }
  }, [entries])

  return (
    <main id="app-root" className="min-h-dvh flex flex-col justify-end px-4 py-6 md:px-8">
      {/* Register the service worker for PWA */}
      <PWALoader />

      <header id="app-header" className="mb-6"></header>

      <section id="heatmap-section" className="max-w-[400px] w-full mx-auto">
        <HabitHeatmap entries={entries} onChangeEntry={handleChangeEntry} />
      </section>

      {/* Add the stats row to the bottom and display in a single row */}
      <section id="stats-section" className="mt-12">
        <StatsCards
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          totalEntries={totalEntries}
          averageScore={averageScore}
        />
      </section>
    </main>
  )
}
