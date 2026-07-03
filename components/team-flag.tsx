"use client"

import { useState } from "react"
import { getFlagUrl } from "@/lib/flags"
import { cn } from "@/lib/utils"

interface TeamFlagProps {
  name: string | null | undefined
  className?: string
}

export function TeamFlag({ name, className }: TeamFlagProps) {
  const [failed, setFailed] = useState(false)
  const url = getFlagUrl(name)

  if (!url || failed) return null

  return (
    <img
      src={url}
      alt=""
      className={cn(
        "h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-black/10",
        className,
      )}
      onError={() => setFailed(true)}
    />
  )
}