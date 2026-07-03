"use client"

import { PARTICIPANTS, ROUND_MAP } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import { computeMatchPoints, resolveAdvancer } from "@/lib/scoring"
import type { Match, Prediction } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"

interface MatchDetailDialogProps {
  match: Match | null
  matches: Match[]
  predictions: Prediction[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchDetailDialog({
  match,
  matches,
  predictions,
  open,
  onOpenChange,
}: MatchDetailDialogProps) {
  if (!match) return null

  const slot1 = resolveSlot(matches, match, "team1")
  const slot2 = resolveSlot(matches, match, "team2")
  const team1 = slot1.name ?? slot1.placeholder ?? "Equipo 1"
  const team2 = slot2.name ?? slot2.placeholder ?? "Equipo 2"

  const hasOfficial = match.official_score1 !== null && match.official_score2 !== null
  const officialAdvancer = hasOfficial
    ? resolveAdvancer(match.official_score1!, match.official_score2!, match.official_advancer)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {ROUND_MAP[match.round].label} · Partido {match.position}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalle de pronósticos y puntos del partido
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-secondary p-3 text-center">
          <div className="flex items-center justify-center gap-3 text-sm font-semibold">
            <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
              <span className="min-w-0 truncate">{team1}</span>
              <TeamFlag name={slot1.name} />
            </span>
            <span className="shrink-0 rounded bg-background px-2 py-1 tabular-nums">
              {hasOfficial ? `${match.official_score1} - ${match.official_score2}` : "vs"}
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-start gap-1.5">
              <TeamFlag name={slot2.name} />
              <span className="min-w-0 truncate">{team2}</span>
            </span>
          </div>
          {hasOfficial ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Avanza:{" "}
              <span className="font-medium text-foreground">
                {officialAdvancer === "team1" ? team1 : officialAdvancer === "team2" ? team2 : "—"}
              </span>
              {match.official_score1 === match.official_score2 ? " (penales)" : ""}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Resultado oficial pendiente</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Pronósticos</p>
          {PARTICIPANTS.map((name) => {
            const pred = predictions.find(
              (p) => p.participant === name && p.match_id === match.id,
            )
            const pts = computeMatchPoints(match, pred)
            return (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span className="font-medium">{name}</span>
                <div className="flex items-center gap-2">
                  {pred ? (
                    <span className="tabular-nums text-muted-foreground">
                      {pred.pred_score1}-{pred.pred_score2}
                      {pred.pred_score1 === pred.pred_score2 && pred.pred_advancer
                        ? ` (${pred.pred_advancer === "team1" ? team1 : team2})`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted-foreground">sin pronóstico</span>
                  )}
                  {hasOfficial && pred ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "tabular-nums",
                        pts.total > 0 && "bg-primary text-primary-foreground",
                      )}
                    >
                      +{pts.total}
                    </Badge>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}