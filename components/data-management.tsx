"use client"

import { useRef, useState } from "react"
import { exportToJSON, parseImportFile, performImport, type EntriesMap, type ParsedImportData } from "@/lib/storage"
import { getColorScheme, type ColorSchemeId } from "@/lib/color-schemes"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  entries: EntriesMap
  colorScheme: ColorSchemeId
  onEntriesChange: (entries: EntriesMap) => void
  onColorSchemeChange: (scheme: ColorSchemeId) => void
  onHabitNameChange: (name: string) => void
}

export default function DataManagement({ 
  entries, 
  colorScheme, 
  onEntriesChange, 
  onColorSchemeChange,
  onHabitNameChange 
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scheme = getColorScheme(colorScheme)
  const hasEntries = Object.keys(entries).length > 0
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null)

  const handleExport = () => {
    exportToJSON()
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const data = await parseImportFile(file)
      setParsedData(data)
      setDialogOpen(true)
    } catch (error) {
      alert("Invalid file format. Please select a valid habit tracker export file.")
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleImportAction = (action: 'replace' | 'merge' | 'cancel') => {
    if (action === 'cancel' || !parsedData) {
      setDialogOpen(false)
      setParsedData(null)
      return
    }

    performImport(parsedData, action, (data) => {
      onEntriesChange(data.entries)
      onColorSchemeChange(data.colorScheme as ColorSchemeId)
      onHabitNameChange(data.habitName)
    })

    setDialogOpen(false)
    setParsedData(null)
  }

  return (
    <>
      <div className="flex items-center justify-between max-w-[400px] w-full mx-auto">
        <button
          onClick={handleExport}
          className={`font-mono text-[14px] transition-colors ${
            hasEntries ? "cursor-pointer" : "cursor-not-allowed"
          }`}
          style={{
            color: scheme.secondary,
          }}
          onMouseEnter={(e) => {
            if (hasEntries) {
              e.currentTarget.style.color = scheme.primary
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = scheme.secondary
          }}
          disabled={!hasEntries}
        >
          save data
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          className="font-mono text-[14px] transition-colors cursor-pointer"
          style={{
            color: scheme.secondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = scheme.primary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = scheme.secondary
          }}
        >
          import data
        </button>
      </div>

      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Dialog is being closed, cancel the operation
            handleImportAction('cancel')
          } else {
            setDialogOpen(open)
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>
              How would you like to import this data?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="default"
              onClick={() => handleImportAction('replace')}
            >
              Replace
            </Button>
            <Button
              variant="outline"
              onClick={() => handleImportAction('merge')}
            >
              Merge
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleImportAction('cancel')}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

