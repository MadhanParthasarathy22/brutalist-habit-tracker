"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { getHabitName, saveHabitName } from "@/lib/storage"

export type EntriesMap = Record<string, number>
interface Props {
  entries: EntriesMap
  onChangeEntry: (dateStr: string, value: number | null) => void
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

export default function HabitHeatmap({ entries, onChangeEntry }: Props) {
  const [habitName, setHabitName] = useState("habitName")
  const [isClient, setIsClient] = useState(false)
  const [invalidKey, setInvalidKey] = useState<string | null>(null)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  
  // Debounced save function for habit name
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedSaveHabitName = useCallback((name: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveHabitName(name)
    }, 300) // 300ms debounce
  }, [])

  useEffect(() => {
    setIsClient(true)
    setHabitName(getHabitName())
  }, [])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])
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

  // Compute quantile cutpoints (q20,q40,q60,q80) from non-zero values only - optimized memoization
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
  }, [Object.keys(entries).length, Object.values(entries).reduce((sum, v) => sum + (v || 0), 0)])

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

  function formatISO(date: Date) {
    return formatDateLocal(date)
  }

  // Optimized neighbor key lookup with caching
  const neighborKeyCache = useRef<Map<string, string>>(new Map())
  
  const neighborKey = useCallback((currentISO: string, deltaDays: number): string => {
    const cacheKey = `${currentISO}:${deltaDays}`
    if (neighborKeyCache.current.has(cacheKey)) {
      return neighborKeyCache.current.get(cacheKey)!
    }
    
    const d = new Date(currentISO)
    d.setDate(d.getDate() + deltaDays)
    const result = formatISO(d)
    
    // Cache result (limit cache size to prevent memory leaks)
    if (neighborKeyCache.current.size > 1000) {
      neighborKeyCache.current.clear()
    }
    neighborKeyCache.current.set(cacheKey, result)
    
    return result
  }, [])

  function commitValue(dateKey: string, raw: string) {
    const trimmed = raw.trim()
    if (trimmed === "") {
      onChangeEntry(dateKey, null)
      return
    }
    const n = Number(trimmed)
    if (!Number.isFinite(n) || n < 0) return
    onChangeEntry(dateKey, n)
  }

  function formatDateLabel(date: Date): string {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    if (checkDate.getTime() === today.getTime()) {
      return "today"
    }
    if (checkDate.getTime() === yesterday.getTime()) {
      return "yesterday"
    }
    
    // Use formatDatePretty logic
    const day = checkDate.getDate()
    const month = checkDate.toLocaleString(undefined, { month: "long" }).toLowerCase()
    const suffix = (n: number) => {
      const j = n % 10, k = n % 100
      if (j === 1 && k !== 11) return "st"
      if (j === 2 && k !== 12) return "nd"
      if (j === 3 && k !== 13) return "rd"
      return "th"
    }
    return `${day}${suffix(day)} ${month}`
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
      <div id="heatmap-day-labels" className="hidden" />

      <div
        id="heatmap-scroll"
        ref={containerRef}
        className="h-auto w-full overflow-x-visible overflow-y-visible rounded-none border-0 bg-transparent"
        aria-label="Habit heatmap"
        onScroll={handleScroll}
      >
        {/* Sticky loading marker at the very top */}
        <div id="heatmap-loading-marker" className="sticky top-0 z-10 flex h-6 items-center justify-center text-xs text-muted-foreground">
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
                <div
                  key={key}
                  id={`heatmap-day-${key}`}
                  title={`${key}${score !== undefined ? ` • ${score}` : ""}`}
                  aria-label={`Edit value for ${key}`}
                  className={[
                    "relative w-full aspect-square rounded-none transition-opacity box-border group",
                    invalidKey === key ? "bg-[#4E1511]" : classForBand(band),
                    isFuture || isBeforeYearStart ? "opacity-0 pointer-events-none" : "",
                  ].join(" ")}
                  onMouseDown={(e) => {
                    const input = e.currentTarget.querySelector('input') as HTMLInputElement | null
                    if (input) {
                      e.preventDefault()
                      input.focus()
                    }
                  }}
                >
                  {/* Date tooltip above tile */}
                  <div id={`heatmap-tooltip-${key}`} className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div id={`heatmap-tooltip-content-${key}`} className="relative bg-[#191919] text-white font-mono text-[14px] px-2 py-1 whitespace-nowrap rounded-none">
                      {formatDateLabel(date)}
                      {/* Arrow pointing down */}
                      <div id={`heatmap-tooltip-arrow-${key}`} className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#191919]"></div>
                    </div>
                  </div>

                  {/* Subtle darken on hover */}
                  <div id={`heatmap-hover-overlay-${key}`} className="pointer-events-none absolute inset-0 bg-black opacity-0 transition-opacity group-hover:opacity-10" />

                  {/* Hover overlay showing value (non-editing) */}
                  <span
                    id={`heatmap-value-overlay-${key}`}
                    className={[
                      "pointer-events-none absolute inset-0 hidden items-center justify-center text-[14px] font-mono text-white mix-blend-exclusion",
                      focusedKey === key ? "" : "group-hover:flex",
                    ].join(" ")}
                  >
                    {score !== undefined && score > 0 ? String(score) : "0"}
                  </span>

                  {/* Centered input; hidden until focus-within */}
                  <input
                    id={`heatmap-input-${key}`}
                    aria-label={`Value for ${key}`}
                    inputMode="decimal"
                    className="absolute inset-0 m-0 w-full select-all appearance-none rounded-none bg-transparent px-0 text-center font-mono text-[14px] text-white mix-blend-exclusion outline-none opacity-0 focus:opacity-100"
                    defaultValue={score === undefined ? "" : String(score)}
                    onFocus={(e) => {
                      const el = e.currentTarget
                      if (el.value === "") el.value = "0"
                      el.select()
                      setFocusedKey(key)
                    }}
                    onChange={(e) => {
                      const val = e.currentTarget.value.trim()
                      if (val === "") {
                        setInvalidKey(null)
                        return
                      }
                      const n = Number(val)
                      if (!Number.isFinite(n) || n < 0) setInvalidKey(key)
                      else setInvalidKey(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        if (invalidKey !== key) {
                          commitValue(key, (e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).blur()
                        }
                      } else if (e.key === "Escape") {
                        e.preventDefault()
                        ;(e.target as HTMLInputElement).value = score === undefined ? "" : String(score)
                        ;(e.target as HTMLInputElement).blur()
                      } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                        e.preventDefault()
                        
                        let nextKey: string
                        switch (e.key) {
                          case "ArrowLeft": nextKey = neighborKey(key, -1); break
                          case "ArrowRight": nextKey = neighborKey(key, 1); break
                          case "ArrowUp": nextKey = neighborKey(key, -7); break
                          case "ArrowDown": nextKey = neighborKey(key, 7); break
                          default: return
                        }
                        
                        // Use requestAnimationFrame to avoid blocking the UI thread
                        requestAnimationFrame(() => {
                          const next = document.getElementById(`heatmap-day-${nextKey}`)?.querySelector('input') as HTMLInputElement | null
                          next?.focus()
                        })
                      }
                    }}
                    onBlur={(e) => {
                      const target = e.currentTarget
                      if (invalidKey === key) {
                        // re-focus safely if still in the document
                        requestAnimationFrame(() => {
                          if (document.contains(target)) target.focus()
                        })
                        return
                      }
                      setFocusedKey((prev) => (prev === key ? null : prev))
                      commitValue(key, target.value)
                    }}
                  />
                </div>
              )
            }),
          )}
        </div>

      </div>

      {/* 3px white separator line */}
      <div id="heatmap-separator-line" className="h-[3px] bg-white" style={{ width: '100%' }} />

      {/* Editable habit name */}
      <div id="habit-name-container" className="mt-2 text-center">
        {isClient ? (
          <input
            id="habit-name-input"
            value={habitName}
            onChange={(e) => {
              const newValue = e.target.value
              setHabitName(newValue)
              debouncedSaveHabitName(newValue)
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                e.currentTarget.blur()
              } else if (e.key === "Escape") {
                e.preventDefault()
                setHabitName(getHabitName())
                e.currentTarget.blur()
              }
            }}
            onBlur={() => {
              // Force immediate save on blur
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
              }
              saveHabitName(habitName)
            }}
            className="bg-transparent text-white font-mono text-[14px] text-center outline-none cursor-pointer hover:bg-white/10 transition-colors px-2 py-1 rounded-none"
            placeholder="habitName"
          />
        ) : (
          <div id="habit-name-placeholder" className="bg-transparent text-white font-mono text-[14px] text-center px-2 py-1">
            habitName
          </div>
        )}
      </div>

      <p id="heatmap-sr-helper" className="hidden" />
    </div>
  )
}
