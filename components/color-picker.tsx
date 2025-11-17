"use client"

import { colorSchemes, getColorScheme, type ColorSchemeId } from "@/lib/color-schemes"

interface Props {
  selectedScheme: ColorSchemeId
  onSchemeChange: (scheme: ColorSchemeId) => void
}

export default function ColorPicker({ selectedScheme, onSchemeChange }: Props) {
  const schemes: ColorSchemeId[] = ['white', 'blue', 'green', 'purple']
  const currentScheme = getColorScheme(selectedScheme)

  return (
    <div className="flex items-center justify-between max-w-[400px] w-full mx-auto mb-[100px]">
      <span className="font-mono text-[14px]" style={{ color: currentScheme.secondary }}>colours:</span>
      <div className="flex gap-2">
        {schemes.map((schemeId) => {
          const scheme = colorSchemes[schemeId]
          const isSelected = selectedScheme === schemeId
          return (
            <button
              key={schemeId}
              onClick={() => onSchemeChange(schemeId)}
              className="w-6 h-6 rounded-none transition-opacity hover:opacity-80"
              style={{
                backgroundColor: scheme.swatch,
                border: 'none',
                outline: isSelected ? `2px solid ${scheme.secondary}` : 'none',
                outlineOffset: '0px',
              }}
              aria-label={`Select ${scheme.name} color scheme`}
            />
          )
        })}
      </div>
    </div>
  )
}

