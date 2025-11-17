export type EntriesMap = Record<string, number>

const KEY = "habit-entries-v1"
const HABIT_NAME_KEY = "habit-name-v1"
const COLOR_SCHEME_KEY = "color-scheme-v1"

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

export function getColorScheme(): string {
  if (typeof window === "undefined") return "white"
  try {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY)
    return saved || "white"
  } catch {
    return "white"
  }
}

export function saveColorScheme(scheme: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(COLOR_SCHEME_KEY, scheme)
  } catch {}
}

export interface ExportData {
  habitName: string
  colorScheme: string
  entries: EntriesMap
  exportDate: string
  version: string
}

export function exportToJSON() {
  if (typeof window === "undefined") return
  
  try {
    const entries = loadEntries()
    const habitName = getHabitName()
    const colorScheme = getColorScheme()
    
    const exportData: ExportData = {
      habitName,
      colorScheme,
      entries,
      exportDate: new Date().toISOString(),
      version: "1.0"
    }
    
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    // Format filename as habit-tracker-export-YYYY-MM-DD.json
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    const filename = `habit-tracker-export-${year}-${month}-${day}.json`
    
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    alert("Failed to export data. Please try again.")
  }
}

function isValidDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) return false
  
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0]
}

function isValidColorScheme(scheme: string): scheme is string {
  return ['white', 'blue', 'green', 'purple'].includes(scheme)
}

export interface ParsedImportData {
  entries: EntriesMap
  habitName: string
  colorScheme: string
}

export async function parseImportFile(file: File): Promise<ParsedImportData> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  
  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Invalid JSON structure")
  }
  
  // Validate entries
  if (!parsed.entries || typeof parsed.entries !== 'object') {
    throw new Error("Missing or invalid entries")
  }
  
  // Validate entry keys are valid dates and values are numbers
  const entries = parsed.entries as Record<string, unknown>
  for (const [key, value] of Object.entries(entries)) {
    if (!isValidDateString(key)) {
      throw new Error(`Invalid date key: ${key}`)
    }
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Invalid value for date ${key}: must be a number`)
    }
  }
  
  // Validate color scheme if present
  if (parsed.colorScheme !== undefined) {
    if (typeof parsed.colorScheme !== 'string' || !isValidColorScheme(parsed.colorScheme)) {
      throw new Error("Invalid color scheme")
    }
  }
  
  // Validate habit name if present
  if (parsed.habitName !== undefined && typeof parsed.habitName !== 'string') {
    throw new Error("Invalid habit name")
  }
  
  const importedEntries = parsed.entries as EntriesMap
  const importedHabitName = parsed.habitName || getHabitName()
  const importedColorScheme = parsed.colorScheme || getColorScheme()
  
  return {
    entries: importedEntries,
    habitName: importedHabitName,
    colorScheme: importedColorScheme
  }
}

export function performImport(data: ParsedImportData, action: 'replace' | 'merge', onImport: (data: ParsedImportData) => void) {
  let finalEntries: EntriesMap
  if (action === 'replace') {
    finalEntries = data.entries
  } else {
    // Merge: imported entries override existing ones
    const existingEntries = loadEntries()
    finalEntries = { ...existingEntries, ...data.entries }
  }
  
  const finalData: ParsedImportData = {
    entries: finalEntries,
    habitName: data.habitName,
    colorScheme: data.colorScheme
  }
  
  // Save all data
  saveEntries(finalEntries)
  saveHabitName(data.habitName)
  saveColorScheme(data.colorScheme)
  
  // Call callback to update UI
  onImport(finalData)
}
