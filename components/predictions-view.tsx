"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Lock, ShieldQuestion } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ROUND_MAP, ROUND_ORDER, type RoundName } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import type { Advancer, Match, Prediction } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { Button } from "@/components/ui/button"
import { ScoreInput } from "@/components/score-input"
import { SpecialPicks } from "@/components/special-picks"
import { cn } from "@/lib/utils"

interface PredictionsViewProps {
  data: QuinielaData
  participant: string
}

export function PredictionsView({ data, participant }: PredictionsViewProps) {
  const { matches, predictions, rounds, specials, loading } = data

  const openRounds = useMemo(
    () =>
      rounds
        .filter((r) => r.is_open)
        .map((r) => r.name)
        .sort((a, b) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b)),
    [rounds],
  )

  const [activeRound, setActiveRound] = useState<RoundName | null>(null)
  const currentRound = activeRound ?? openRounds[0] ?? null

  if (loading) {
    return <LoadingState />
  }

  const roundMatches = currentRound ? matches.filter((m) => m.round === currentRound) : []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Mis pronósticos</h2>
        <p className="text-sm text-muted-foreground">
          Pronosticando como <span className="font-medium text-foreground">{participant}</span>
        </p>
      </div>

      <SpecialPicks
        matches={matches}
        specials={specials}
        participant={participant}
        onSaved={data.refresh}
      />

      {openRounds.length === 0 ? (
        <EmptyState
          title="No hay rondas abiertas"
          description="El administrador todavía no ha abierto ninguna ronda para pronosticar. Vuelve más tarde."
        />
      ) : (
        <>
          {openRounds.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {openRounds.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={r === currentRound ? "default" : "outline"}
                  onClick={() => setActiveRound(r)}
                >
                  {ROUND_MAP[r].shortLabel}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <span className="text-sm font-semibold text-secondary-foreground">
              {currentRound ? ROUND_MAP[currentRound].label : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {roundMatches.filter((m) => hasPrediction(predictions, participant, m.id)).length}/
              {roundMatches.length} enviados
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {roundMatches.map((match) => (
              <PredictionCard
                key={match.id}
                match={match}
                matches={matches}
                participant={participant}
                existing={predictions.find(
                  (p) => p.participant === participant && p.match_id === match.id,
                )}
                onSaved={data.refresh}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function hasPrediction(predictions: Prediction[], participant: string, matchId: string) {
  return predictions.some((p) => p.participant === participant && p.match_id === matchId)
}

interface PredictionCardProps {
  match: Match
  matches: Match[]
  participant: string
  existing: Prediction | undefined
  onSaved: () => Promise<void>
}

function PredictionCard({ match, matches, participant, existing, onSaved }: PredictionCardProps) {
  const slot1 = resolveSlot(matches, match, "team1")
  const slot2 = resolveSlot(matches, match, "team2")
  const team1Name = slot1.name ?? slot1.placeholder ?? `Equipo 1`
  const team2Name = slot2.name ?? slot2.placeholder ?? `Equipo 2`
  const teamsResolved = Boolean(slot1.name && slot2.name)

  const [score1, setScore1] = useState<number>(existing?.pred_score1 ?? 0)
  const [score2, setScore2] = useState<number>(existing?.pred_score2 ?? 0)
  const [advancer, setAdvancer] = useState<Advancer | null>(existing?.pred_advancer ?? null)
  const [saving, setSaving] = useState(false)

  const locked = Boolean(existing) || match.round_locked
  const isDraw = score1 === score2

  async function handleSubmit() {
    if (isDraw && !advancer) {
      toast.error("Empate: elige qué equipo avanza por penales.")
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
      console.log("[v0] insert prediction error:", error)
      if (error.code === "23505") {
        toast.error("Ya enviaste este pronóstico.")
      } else {
        toast.error("No se pudo guardar el pronóstico.")
      }
      return
    }
    toast.success("Pronóstico enviado y bloqueado.")
    await onSaved()
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        locked && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Partido {match.position}
        </span>
        {existing ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Lock className="size-3" /> Bloqueado
          </span>
        ) : match.round_locked ? (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3" /> Cerrado
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-right text-sm font-semibold leading-tight text-balance">
          {team1Name}
        </span>
        <div className="flex items-center gap-2">
          <ScoreInput
            value={existing ? existing.pred_score1 : score1}
            onChange={setScore1}
            disabled={locked || !teamsResolved}
            label={`Goles ${team1Name}`}
          />
          <span className="text-muted-foreground">-</span>
          <ScoreInput
            value={existing ? existing.pred_score2 : score2}
            onChange={setScore2}
            disabled={locked || !teamsResolved}
            label={`Goles ${team2Name}`}
          />
        </div>
        <span className="flex-1 text-left text-sm font-semibold leading-tight text-balance">
          {team2Name}
        </span>
      </div>

      {!teamsResolved ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Equipos aún no definidos para este partido.
        </p>
      ) : (
        <>
          {(existing ? existing.pred_score1 === existing.pred_score2 : isDraw) ? (
            <div className="mt-4">
              <p className="mb-2 flex items-center justify-center gap-1 text-center text-xs font-medium text-muted-foreground">
                <ShieldQuestion className="size-3.5" /> Empate — ¿quién avanza por penales?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    (existing ? existing.pred_advancer : advancer) === "team1"
                      ? "default"
                      : "outline"
                  }
                  disabled={locked}
                  onClick={() => setAdvancer("team1")}
                  className="truncate"
                >
                  {team1Name}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    (existing ? existing.pred_advancer : advancer) === "team2"
                      ? "default"
                      : "outline"
                  }
                  disabled={locked}
                  onClick={() => setAdvancer("team2")}
                  className="truncate"
                >
                  {team2Name}
                </Button>
              </div>
            </div>
          ) : null}

          {existing ? (
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs font-medium text-primary">
              <CheckCircle2 className="size-3.5" /> Pronóstico guardado
            </p>
          ) : match.round_locked ? null : (
            <Button
              className="mt-4 w-full"
              onClick={handleSubmit}
              disabled={saving || !teamsResolved}
            >
              {saving ? "Guardando..." : "Enviar pronóstico"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted/40" />
      ))}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground text-pretty">{description}</p>
    </div>
  )
}