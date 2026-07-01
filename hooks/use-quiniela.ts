"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ROUND_ORDER } from "@/lib/constants"
import type { Match, Prediction, RoundConfig, SpecialPrediction } from "@/lib/types"

export interface QuinielaData {
  matches: Match[]
  predictions: Prediction[]
  rounds: RoundConfig[]
  specials: SpecialPrediction[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function sortMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const ra = ROUND_ORDER.indexOf(a.round)
    const rb = ROUND_ORDER.indexOf(b.round)
    if (ra !== rb) return ra - rb
    return a.position - b.position
  })
}

export function useQuiniela(): QuinielaData {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [rounds, setRounds] = useState<RoundConfig[]>([])
  const [specials, setSpecials] = useState<SpecialPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    try {
      const [matchesRes, predsRes, roundsRes, specialsRes] = await Promise.all([
        supabase.from("matches").select("*"),
        supabase.from("predictions").select("*"),
        supabase.from("rounds").select("*").order("sort_order"),
        supabase.from("special_predictions").select("*"),
      ])
      if (matchesRes.error) throw matchesRes.error
      if (predsRes.error) throw predsRes.error
      if (roundsRes.error) throw roundsRes.error
      if (specialsRes.error) throw specialsRes.error
      setMatches(sortMatches((matchesRes.data ?? []) as Match[]))
      setPredictions((predsRes.data ?? []) as Prediction[])
      setRounds((roundsRes.data ?? []) as RoundConfig[])
      setSpecials((specialsRes.data ?? []) as SpecialPrediction[])
      setError(null)
    } catch (err) {
      console.log("[v0] useQuiniela error:", err)
      setError(err instanceof Error ? err.message : "Error cargando datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    const supabase = createClient()
    const channel = supabase
      .channel("quiniela-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, () => refresh())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "special_predictions" },
        () => refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return { matches, predictions, rounds, specials, loading, error, refresh }
}