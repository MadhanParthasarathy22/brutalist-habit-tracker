export type EntriesMap = Record<string, number>

const KEY = "habit-entries-v1"

export function loadEntries(): EntriesMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed as EntriesMap
    return {}
  } catch {
    return {}
  }
}

export function saveEntries(entries: EntriesMap) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {}
}
