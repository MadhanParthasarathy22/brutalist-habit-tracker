"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import PWALoader from "@/components/pwa-register"
import HabitHeatmap from "@/components/habit-heatmap"
import StatsCards from "@/components/stats-cards"
import { loadEntries, saveEntries, type EntriesMap } from "@/lib/storage"

type Selected = { date: string } | null

function formatDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

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
  const [selected, setSelected] = useState<Selected>(null)
  const [scoreInput, setScoreInput] = useState<string>("")
  const scoreInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleOpenForDate = (dateStr: string) => {
    setSelected({ date: dateStr })
    const existing = entries[dateStr]
    setScoreInput(existing === undefined ? "" : String(existing))
    // focus input on open
    requestAnimationFrame(() => {
      scoreInputRef.current?.focus()
      scoreInputRef.current?.select()
    })
  }

  const handleSave = () => {
    if (!selected) return
    const val = scoreInput.trim()
    if (val === "") {
      // remove entry (no entry)
      const { [selected.date]: _, ...rest } = entries
      setEntries(rest)
      saveEntries(rest)
      setSelected(null)
      return
    }
    const n = Number(val)
    if (!Number.isFinite(n) || n < 0) return
    const next = { ...entries, [selected.date]: n }
    setEntries(next)
    saveEntries(next)
    setSelected(null)
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
        <HabitHeatmap entries={entries} onSelectDate={handleOpenForDate} />
      </section>

      {/* Simple modal */}
      {selected && (
        <div
          id="log-modal-root"
          role="dialog"
          aria-modal="true"
          aria-label="Log score"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            id="log-modal-overlay"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div id="log-modal" className="relative z-10 w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl">
            <button
              id="log-modal-close"
              aria-label="Close"
              className="absolute right-3 top-3 h-7 w-7 rounded-md bg-secondary text-foreground/80 hover:opacity-90"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <h2 id="log-modal-title" className="mb-3 text-lg font-semibold">
              {formatDatePretty(selected.date)}
            </h2>
            <label htmlFor="log-modal-score-input" className="block text-sm mb-1">Score (≥ 0)</label>
            <input
              id="log-modal-score-input"
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSave()
                }
              }}
              ref={scoreInputRef}
              className="w-full rounded-md bg-secondary px-3 py-2 outline-none"
              aria-label="Score from 0 to 5"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button id="log-modal-cancel" className="rounded-md bg-secondary px-3 py-2 text-sm" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button
                id="log-modal-save"
                className={cn("rounded-md px-3 py-2 text-sm", "bg-primary text-primary-foreground hover:opacity-90")}
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the stats row to the bottom and display in a single row */}
      <section id="stats-section" className="mt-6">
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
