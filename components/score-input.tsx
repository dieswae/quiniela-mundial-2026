"use client"

import { cn } from "@/lib/utils"

interface ScoreInputProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

export function ScoreInput({ value, onChange, disabled, label }: ScoreInputProps) {
  const v = value ?? 0

  function handleChange(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "")
    if (digits === "") {
      onChange(0)
      return
    }
    onChange(Math.min(20, Math.max(0, Number.parseInt(digits, 10))))
  }

  return (
    <label className="flex flex-col items-center gap-1">
      {label ? <span className="sr-only">{label}</span> : null}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={v}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className={cn(
          "h-12 w-12 rounded-lg border border-input bg-background text-center text-2xl font-bold tabular-nums outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:opacity-50",
        )}
      />
    </label>
  )
}
