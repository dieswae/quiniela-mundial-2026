"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { PARTICIPANTS, ROUND_MAP, ROUND_ORDER, type RoundName } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import type { Advancer, Match, Prediction } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScoreInput } from "@/components/score-input"

interface AdminLoadPredictionsProps {
  data: QuinielaData
}

// Lets the admin backfill predictions participants made before the app existed.
export function AdminLoadPredictions({ data }: AdminLoadPredictionsProps) {
  const { matches, predictions } = data
  const [participant, setParticipant] = useState<string>(PARTICIPANTS[0])
  const [round, setRound] = useState<RoundName>("dieciseisavos")

  const roundMatches = matches.filter((m) => m.round === round)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground text-pretty">
        Carga manualmente pronósticos que un participante hizo antes de tener la app. Una vez
        guardado, queda bloqueado igual que los demás.
      </p>

      <div className="flex flex-col gap-2">
        <Select value={participant} onValueChange={setParticipant}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARTICIPANTS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      </div>

      <div className="flex flex-col gap-3">
        {roundMatches.map((m) => (
          <ManualPredEditor
            key={m.id}
            match={m}
            matches={matches}
            participant={participant}
            existing={predictions.find(
              (p) => p.participant === participant && p.match_id === m.id,
            )}
            onSaved={data.refresh}
          />
        ))}
      </div>
    </div>
  )
}

function ManualPredEditor({
  match,
  matches,
  participant,
  existing,
  onSaved,
}: {
  match: Match
  matches: Match[]
  participant: string
  existing: Prediction | undefined
  onSaved: () => Promise<void>
}) {
  const slot1 = resolveSlot(matches, match, "team1")
  const slot2 = resolveSlot(matches, match, "team2")
  const team1 = slot1.name ?? slot1.placeholder ?? "Equipo 1"
  const team2 = slot2.name ?? slot2.placeholder ?? "Equipo 2"
  const teamsResolved = Boolean(slot1.name && slot2.name)

  const [score1, setScore1] = useState<number>(existing?.pred_score1 ?? 0)
  const [score2, setScore2] = useState<number>(existing?.pred_score2 ?? 0)
  const [advancer, setAdvancer] = useState<Advancer | null>(existing?.pred_advancer ?? null)
  const [saving, setSaving] = useState(false)

  const locked = Boolean(existing)
  const isDraw = score1 === score2

  async function handleSave() {
    if (isDraw && !advancer) {
      toast.error("Empate: elige quién avanza.")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("predictions").insert({
      participant,
      match_id: match.id,
      pred_score1: score1,
      pred_score2: score2,
      pred_advancer: isDraw ? advancer : null,
    })
    setSaving(false)
    if (error) {
      console.log("[v0] manual pred error:", error)
      toast.error(error.code === "23505" ? "Ya existe este pronóstico." : "No se pudo guardar.")
      return
    }
    toast.success(`Pronóstico de ${participant} guardado.`)
    await onSaved()
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Partido {match.position}</span>
        {locked ? <span className="text-xs font-medium text-primary">Ya cargado</span> : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-right text-sm font-semibold leading-tight text-balance">
          {team1}
        </span>
        <div className="flex items-center gap-2">
          <ScoreInput
            value={existing ? existing.pred_score1 : score1}
            onChange={setScore1}
            disabled={locked || !teamsResolved}
          />
          <span className="text-muted-foreground">-</span>
          <ScoreInput
            value={existing ? existing.pred_score2 : score2}
            onChange={setScore2}
            disabled={locked || !teamsResolved}
          />
        </div>
        <span className="flex-1 text-left text-sm font-semibold leading-tight text-balance">
          {team2}
        </span>
      </div>

      {!teamsResolved ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">Equipos sin definir.</p>
      ) : locked ? null : (
        <>
          {isDraw ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={advancer === "team1" ? "default" : "outline"}
                onClick={() => setAdvancer("team1")}
                className="truncate"
              >
                {team1}
              </Button>
              <Button
                size="sm"
                variant={advancer === "team2" ? "default" : "outline"}
                onClick={() => setAdvancer("team2")}
                className="truncate"
              >
                {team2}
              </Button>
            </div>
          ) : null}
          <Button className="mt-4 w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar pronóstico"}
          </Button>
        </>
      )}
    </div>
  )
}
