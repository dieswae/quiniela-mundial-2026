"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Crown, Medal } from "lucide-react"
import { PARTICIPANTS } from "@/lib/constants"
import { computeStandings } from "@/lib/scoring"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { ParticipantDetailDialog } from "@/components/participant-detail-dialog"
import { cn } from "@/lib/utils"

interface LeaderboardProps {
  data: QuinielaData
}

export function Leaderboard({ data }: LeaderboardProps) {
  const { matches, predictions, specials, loading } = data
  const [selected, setSelected] = useState<string | null>(null)

  const standings = useMemo(
    () => computeStandings(PARTICIPANTS, matches, predictions, specials),
    [matches, predictions, specials],
  )

  const totalScored = matches.filter(
    (m) => m.official_score1 !== null && m.official_score2 !== null,
  ).length

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted/40" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Tabla de posiciones</h2>
        <p className="text-sm text-muted-foreground">
          {totalScored} partido{totalScored === 1 ? "" : "s"} con resultado oficial
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {standings.map((row, index) => (
          <button
            key={row.participant}
            type="button"
            onClick={() => setSelected(row.participant)}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/10",
              index === 0 && "border-accent/60 bg-accent/10",
            )}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold tabular-nums text-secondary-foreground">
              {index === 0 ? (
                <Crown className="size-4 text-accent-foreground" />
              ) : index === 1 || index === 2 ? (
                <Medal className="size-4 text-muted-foreground" />
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{row.participant}</p>
              <p className="text-xs text-muted-foreground">
                {row.exactCount} exactos · {row.resultPoints} resultado · {row.advancePoints} avance
                {row.specialPoints > 0 ? ` · ${row.specialPoints} especial` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold tabular-nums">{row.total}</span>
              <span className="text-xs text-muted-foreground">pts</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Toca un participante para ver el detalle de sus puntos.
      </p>

      <ParticipantDetailDialog
        participant={selected}
        matches={matches}
        predictions={predictions}
        specials={specials}
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  )
}
