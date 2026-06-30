"use client"

import { useState } from "react"
import { Lock, LockOpen, Workflow } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ROUND_MAP, ROUND_ORDER } from "@/lib/constants"
import { computeBracketUpdates } from "@/lib/bracket"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AdminRoundsProps {
  data: QuinielaData
}

export function AdminRounds({ data }: AdminRoundsProps) {
  const { rounds, matches } = data
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleRound(name: string, current: boolean) {
    setBusy(name)
    const supabase = createClient()
    const { error } = await supabase
      .from("rounds")
      .update({ is_open: !current })
      .eq("name", name)
    setBusy(null)
    if (error) {
      console.log("[v0] toggle round error:", error)
      toast.error("No se pudo actualizar la ronda.")
      return
    }
    toast.success(!current ? "Ronda abierta." : "Ronda cerrada.")
    await data.refresh()
  }

  async function advanceBracket() {
    setBusy("advance")
    const supabase = createClient()
    try {
      const updates = computeBracketUpdates(matches)
      if (updates.length === 0) {
        toast.info("No hay equipos nuevos para avanzar. Carga más resultados oficiales.")
        setBusy(null)
        return
      }
      for (const u of updates) {
        const { error } = await supabase
          .from("matches")
          .update({ team1: u.team1, team2: u.team2 })
          .eq("id", u.id)
        if (error) throw error
      }
      toast.success(`Cuadro avanzado: ${updates.length} partido(s) actualizados.`)
      await data.refresh()
    } catch (err) {
      console.log("[v0] advance bracket error:", err)
      toast.error("No se pudo avanzar el cuadro.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {ROUND_ORDER.map((name) => {
          const cfg = rounds.find((r) => r.name === name)
          const isOpen = cfg?.is_open ?? false
          const roundMatches = matches.filter((m) => m.round === name)
          const scored = roundMatches.filter(
            (m) => m.official_score1 !== null && m.official_score2 !== null,
          ).length
          return (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div>
                <p className="text-sm font-semibold">{ROUND_MAP[name].label}</p>
                <p className="text-xs text-muted-foreground">
                  {scored}/{roundMatches.length} con resultado
                </p>
              </div>
              <Button
                size="sm"
                variant={isOpen ? "default" : "outline"}
                className={cn("gap-1.5", isOpen && "bg-primary")}
                disabled={busy === name}
                onClick={() => toggleRound(name, isOpen)}
              >
                {isOpen ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
                {isOpen ? "Abierta" : "Cerrada"}
              </Button>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-dashed p-3">
        <p className="text-sm font-medium">Avanzar el cuadro</p>
        <p className="mb-3 mt-1 text-xs text-muted-foreground text-pretty">
          Rellena los equipos de las siguientes rondas con los ganadores (y perdedores para el 3er
          lugar) según los resultados oficiales ya cargados.
        </p>
        <Button
          variant="secondary"
          className="w-full gap-1.5"
          disabled={busy === "advance"}
          onClick={advanceBracket}
        >
          <Workflow className="size-4" />
          {busy === "advance" ? "Avanzando..." : "Avanzar cuadro"}
        </Button>
      </div>
    </div>
  )
}
