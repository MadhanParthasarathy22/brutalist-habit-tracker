"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export type EntriesMap = Record<string, number>
type Props = {
  entries: EntriesMap
  onSelectDate: (dateStr: string) => void
}

function formatDateLocal(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun,1=Mon,...6=Sat
  const diff = day === 0 ? -6 : 1 - day // if Sunday, go back 6; else back to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number) {
  const res = new Date(d)
  res.setDate(res.getDate() + n)
  return res
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function HabitHeatmap({ entries, onSelectDate }: Props) {
  // Prepare weeks from Jan 1st of the current year up to today (inclusive)
  const weeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yearStart = new Date(today.getFullYear(), 0, 1)
    yearStart.setHours(0, 0, 0, 0)

    const firstWeekStart = startOfWeekMonday(yearStart)
    const lastWeekStart = startOfWeekMonday(today)

    const list: Date[][] = []
    for (let d = new Date(firstWeekStart); d <= lastWeekStart; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d)
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      list.push(weekDays)
    }
    return list
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)

  const [visibleWeeks, setVisibleWeeks] = useState(0)
  const [rowsPerScreen, setRowsPerScreen] = useState(14)
  const [loading, setLoading] = useState(false)

  // Measure and initialize: compute rows per screen, render 1 extra screen, and start at bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const GAP_PX = 4 // gap-1
    const colWidth = (el.clientWidth - GAP_PX * 6) / 7
    const tileSize = Math.max(1, colWidth)
    const rawRows = Math.floor(el.clientHeight / tileSize)

    // If container has no fixed height (auto) and yields 0/very small rows,
    // render all weeks so past days remain visible.
    if (!rawRows || rawRows <= 1) {
      setRowsPerScreen(weeks.length)
      setVisibleWeeks(weeks.length)
      return
    }

    const rowsView = Math.max(1, rawRows)
    setRowsPerScreen(rowsView)
    const initial = Math.min(weeks.length, rowsView * 2) // one screen + one extra screen
    setVisibleWeeks(initial)

    // Start at bottom (newest at bottom)
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [weeks])

  const loadMore = () => {
    const el = containerRef.current
    if (!el) return
    if (visibleWeeks >= weeks.length) return

    setLoading(true)
    const prevScrollHeight = el.scrollHeight
    const increment = rowsPerScreen

    setVisibleWeeks((v) => Math.min(weeks.length, v + increment))

    // Preserve visual position after DOM update
    setTimeout(() => {
      const newScrollHeight = el.scrollHeight
      el.scrollTop = newScrollHeight - prevScrollHeight + el.scrollTop
      setLoading(false)
    }, 0)
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el || loading) return
    const THRESHOLD = 4
    if (el.scrollTop <= THRESHOLD) {
      loadMore()
    }
  }

  // Compute quantile cutpoints (q20,q40,q60,q80) from non-zero values only
  const quantiles = useMemo(() => {
    const values = Object.values(entries).filter((v) => typeof v === "number" && v > 0)
    if (values.length === 0) return null
    const sorted = values.slice().sort((a, b) => a - b)

    const pct = (p: number) => {
      if (sorted.length === 1) return sorted[0]
      const idx = (p / 100) * (sorted.length - 1)
      const lo = Math.floor(idx)
      const hi = Math.ceil(idx)
      if (lo === hi) return sorted[lo]
      const t = idx - lo
      return sorted[lo] * (1 - t) + sorted[hi] * t
    }

    const q20 = pct(20)
    const q40 = pct(40)
    const q60 = pct(60)
    const q80 = pct(80)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    return { q20, q40, q60, q80, min, max }
  }, [entries])

  function bandForValue(v: number | undefined): 0 | 1 | 2 | 3 | 4 | 5 {
    // 0 = blank (no color). 1..5 = color bands
    if (v === undefined || v === 0) return 0
    if (!quantiles) return 0
    const { q20, q40, q60, q80 } = quantiles
    if (v < q20) return 1
    if (v < q40) return 2
    if (v < q60) return 3
    if (v < q80) return 4
    return 5
  }

  const classForBand = (b: 0 | 1 | 2 | 3 | 4 | 5) => {
    // Palette on background #191919
    // Band 0 (zero/no-entry): fill #262626 with 0.5px inner stroke #191919
    if (b === 0) return "bg-[#262626] shadow-[inset_0_0_0_0.5px_#191919]"
    if (b === 1) return "bg-[#383838]"
    if (b === 2) return "bg-[#4e4e4e]"
    if (b === 3) return "bg-[#757575]"
    if (b === 4) return "bg-[#b9b9b9]"
    return "bg-[#fdfdfd]"
  }

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const yearStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const ys = new Date(d.getFullYear(), 0, 1)
    ys.setHours(0, 0, 0, 0)
    return ys
  }, [])

  return (
    <div id="heatmap-root">
      {/* Day labels */}
      <div className="hidden" />

      <div
        id="heatmap-scroll"
        ref={containerRef}
        className="h-auto w-full overflow-x-hidden overflow-y-visible rounded-none border-0 bg-transparent p-1"
        aria-label="Habit heatmap"
        onScroll={handleScroll}
      >
        {/* Sticky loading marker at the very top */}
        <div className="sticky top-0 z-10 flex h-6 items-center justify-center text-xs text-muted-foreground">
          {loading ? "Loading…" : " "}
        </div>

        {/* Bottom-pack the grid; keep 7 columns and no gaps; ensure tiles span viewport width */}
        <div id="heatmap-grid" className="grid grid-cols-7 gap-0 content-end w-full">
          {/* Render weeks from oldest to newest; newest appears at bottom due to scroll */}
          {/* Only render a slice: one screen plus one extra screen */}
          {weeks.slice(Math.max(0, weeks.length - visibleWeeks)).flatMap((weekDays) =>
            weekDays.map((date) => {
              const key = formatDateLocal(date)
              const score = entries[key]
              const band = bandForValue(score)
              const isFuture = date > todayStart
              const isBeforeYearStart = date < yearStart
              return (
                <button
                  key={key}
                  id={`heatmap-day-${key}`}
                  title={`${key}${score !== undefined ? ` • score ${score}` : ""}`}
                  aria-label={`Set score for ${key}`}
                  className={[
                    "w-full aspect-square rounded-none transition-opacity box-border",
                    classForBand(band),
                    "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isFuture || isBeforeYearStart ? "opacity-0 pointer-events-none" : "",
                  ].join(" ")}
                  onClick={() => !(isFuture || isBeforeYearStart) && onSelectDate(key)}
                />
              )
            }),
          )}
        </div>

        {/* Bottom spacer so last row isn't flush */}
        <div className="h-1" />
      </div>
      <p id="heatmap-sr-helper" className="hidden" />
    </div>
  )
}
