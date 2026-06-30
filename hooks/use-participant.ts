"use client"

import { useCallback, useEffect, useState } from "react"
import { PARTICIPANTS } from "@/lib/constants"

const STORAGE_KEY = "quiniela-participant"

export function useParticipant() {
  const [participant, setParticipantState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && (PARTICIPANTS as readonly string[]).includes(stored)) {
        setParticipantState(stored)
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  const setParticipant = useCallback((name: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      // ignore
    }
    setParticipantState(name)
  }, [])

  const clearParticipant = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setParticipantState(null)
  }, [])

  return { participant, setParticipant, clearParticipant, ready }
}
