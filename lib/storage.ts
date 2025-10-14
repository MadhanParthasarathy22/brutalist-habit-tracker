export type EntriesMap = Record<string, number>

const KEY = "habit-entries-v1"
const HABIT_NAME_KEY = "habit-name-v1"

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

export function getHabitName(): string {
  if (typeof window === "undefined") return "habitName"
  try {
    const saved = localStorage.getItem(HABIT_NAME_KEY)
    return saved || "habitName"
  } catch {
    return "habitName"
  }
}

export function saveHabitName(name: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(HABIT_NAME_KEY, name)
  } catch {}
}
