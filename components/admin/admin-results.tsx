"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ROUND_MAP, ROUND_ORDER, type RoundName } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import type { Advancer, Match } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { Button } from "@/components/ui/button"
import { ScoreInput } from "@/components/score-input"
import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"

interface AdminResultsProps {
  data: QuinielaData
}

export function AdminResults({ data }: AdminResultsProps) {
  const { matches } = data
  const [round, setRound] = useState<RoundName>("dieciseisavos")

  const roundMatches = matches.filter((m) => m.round === round)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {ROUND_ORDER.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={r === round ? "default" : "outline"}
            onClick={() => setRound(r)}
          >
            {ROUND_MAP[r].shortLabel}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {roundMatches.map((m) => (
          <ResultEditor key={m.id} match={m} matches={matches} onSaved={data.refresh} />
        ))}
      </div>
    </div>
  )
}

function ResultEditor({
  match,
  matches,
  onSaved,
}: {
  match: Match
  matches: Match[]
  onSaved: () => Promise<void>
}) {
  const slot1 = resolveSlot(matches, match, "team1")
  const slot2 = resolveSlot(matches, match, "team2")
  const team1 = slot1.name ?? slot1.placeholder ?? "Equipo 1"
  const team2 = slot2.name ?? slot2.placeholder ?? "Equipo 2"
  const teamsResolved = Boolean(slot1.name && slot2.name)

  const [score1, setScore1] = useState<number>(match.official_score1 ?? 0)
  const [score2, setScore2] = useState<number>(match.official_score2 ?? 0)
  const [advancer, setAdvancer] = useState<Advancer | null>(match.official_advancer)
  const [saving, setSaving] = useState(false)

  const hasResult = match.official_score1 !== null && match.official_score2 !== null
  const isDraw = score1 === score2

  async function handleSave() {
    if (isDraw && !advancer) {
      toast.error("Empate: indica quién avanzó por penales.")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("matches")
      .update({
        official_score1: score1,
        official_score2: score2,
        official_advancer: isDraw ? advancer : null,
      })
      .eq("id", match.id)
    setSaving(false)
    if (error) {
      console.log("[v0] save result error:", error)
      toast.error("No se pudo guardar el resultado.")
      return
    }
    toast.success("Resultado oficial guardado.")
    await onSaved()
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        hasResult && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Partido {match.position}</span>
        {hasResult ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Check className="size-3.5" /> Cargado
          </span>
        ) : null}
      </div>

      <div className="flex items-start justify-center gap-3">
        <div className="flex w-20 flex-col items-center gap-1.5 text-center">
          <TeamFlag name={slot1.name} className="h-8 w-12 rounded" />
          <span className="line-clamp-2 text-xs font-medium leading-tight">{team1}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <ScoreInput value={score1} onChange={setScore1} disabled={!teamsResolved} />
          <span className="text-muted-foreground">-</span>
          <ScoreInput value={score2} onChange={setScore2} disabled={!teamsResolved} />
        </div>

        <div className="flex w-20 flex-col items-center gap-1.5 text-center">
          <TeamFlag name={slot2.name} className="h-8 w-12 rounded" />
          <span className="line-clamp-2 text-xs font-medium leading-tight">{team2}</span>
        </div>
      </div>

      {!teamsResolved ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Equipos aún no definidos. Avanza el cuadro primero.
        </p>
      ) : (
        <>
          {isDraw ? (
            <div className="mt-4">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                Empate — ¿quién avanzó por penales?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={advancer === "team1" ? "default" : "outline"}
                  onClick={() => setAdvancer("team1")}
                  className="truncate"
                >
                  {team1}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={advancer === "team2" ? "default" : "outline"}
                  onClick={() => setAdvancer("team2")}
                  className="truncate"
                >
                  {team2}
                </Button>
              </div>
            </div>
          ) : null}
          <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : hasResult ? "Actualizar resultado" : "Guardar resultado"}
          </Button>
        </>
      )}
    </div>
  )
}