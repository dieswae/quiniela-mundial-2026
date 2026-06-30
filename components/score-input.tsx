"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ScoreInputProps {
  value: number | null
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}

export function ScoreInput({ value, onChange, disabled, label }: ScoreInputProps) {
  const v = value ?? 0
  return (
    <div className="flex flex-col items-center gap-1">
      {label ? <span className="sr-only">{label}</span> : null}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={disabled || v <= 0}
          onClick={() => onChange(Math.max(0, v - 1))}
          aria-label="Restar gol"
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center text-2xl font-bold tabular-nums">{v}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={disabled || v >= 20}
          onClick={() => onChange(v + 1)}
          aria-label="Sumar gol"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}
