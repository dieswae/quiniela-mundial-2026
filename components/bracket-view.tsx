"use client"

import { useState } from "react"
import { ROUNDS } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import { resolveAdvancer } from "@/lib/scoring"
import type { Match } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { MatchDetailDialog } from "@/components/match-detail-dialog"
import { cn } from "@/lib/utils"

interface BracketViewProps {
  data: QuinielaData
}

export function BracketView({ data }: BracketViewProps) {
  const { matches, predictions, loading } = data
  const [selected, setSelected] = useState<Match | null>(null)

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl border bg-muted/40" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Cuadro completo</h2>
        <p className="text-sm text-muted-foreground">
          Desliza horizontalmente para ver todas las rondas. Toca un partido para el detalle.
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex w-max gap-4">
          {ROUNDS.map((round) => {
            const roundMatches = matches.filter((m) => m.round === round.name)
            return (
              <div key={round.name} className="flex w-44 shrink-0 flex-col gap-2">
                <p className="sticky top-0 text-center text-xs font-bold text-muted-foreground">
                  {round.label}
                </p>
                {roundMatches.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    matches={matches}
                    onClick={() => setSelected(match)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      <MatchDetailDialog
        match={selected}
        matches={matches}
        predictions={predictions}
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  )
}

function BracketMatch({
  match,
  matches,
  onClick,
}: {
  match: Match
  matches: Match[]
  onClick: () => void
}) {
  const slot1 = resolveSlot(matches, match, "team1")
  const slot2 = resolveSlot(matches, match, "team2")
  const hasOfficial = match.official_score1 !== null && match.official_score2 !== null
  const advancer = hasOfficial
    ? resolveAdvancer(match.official_score1!, match.official_score2!, match.official_advancer)
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-colors hover:border-primary/40"
    >
      <BracketRow
        name={slot1.name}
        placeholder={slot1.placeholder}
        score={match.official_score1}
        winner={advancer === "team1"}
        decided={hasOfficial}
      />
      <div className="h-px bg-border" />
      <BracketRow
        name={slot2.name}
        placeholder={slot2.placeholder}
        score={match.official_score2}
        winner={advancer === "team2"}
        decided={hasOfficial}
      />
    </button>
  )
}

function BracketRow({
  name,
  placeholder,
  score,
  winner,
  decided,
}: {
  name: string | null
  placeholder: string | null
  score: number | null
  winner: boolean
  decided: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2.5 py-1.5",
        decided && winner && "bg-primary/10",
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs",
          name ? "font-medium" : "italic text-muted-foreground",
          decided && winner && "font-bold text-primary",
          decided && !winner && name && "text-muted-foreground",
        )}
      >
        {name ?? placeholder ?? "Por definir"}
      </span>
      <span className="w-4 text-center text-xs font-bold tabular-nums text-muted-foreground">
        {score ?? ""}
      </span>
    </div>
  )
}
