"use client"

import { ROUND_MAP, ROUND_ORDER } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import { computeMatchPoints } from "@/lib/scoring"
import type { Match, Prediction } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ParticipantDetailDialogProps {
  participant: string | null
  matches: Match[]
  predictions: Prediction[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ParticipantDetailDialog({
  participant,
  matches,
  predictions,
  open,
  onOpenChange,
}: ParticipantDetailDialogProps) {
  if (!participant) return null

  const scored = matches.filter(
    (m) => m.official_score1 !== null && m.official_score2 !== null,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{participant}</DialogTitle>
          <DialogDescription>Puntos obtenidos en partidos ya jugados</DialogDescription>
        </DialogHeader>

        {scored.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Todavía no hay partidos con resultado oficial.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {ROUND_ORDER.map((round) => {
              const roundScored = scored.filter((m) => m.round === round)
              if (roundScored.length === 0) return null
              return (
                <div key={round}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {ROUND_MAP[round].label}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {roundScored.map((m) => {
                      const pred = predictions.find(
                        (p) => p.participant === participant && p.match_id === m.id,
                      )
                      const pts = computeMatchPoints(m, pred)
                      const slot1 = resolveSlot(matches, m, "team1")
                      const slot2 = resolveSlot(matches, m, "team2")
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs">
                              {slot1.name ?? "?"} vs {slot2.name ?? "?"}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              Oficial {m.official_score1}-{m.official_score2}
                              {pred ? ` · Tú ${pred.pred_score1}-${pred.pred_score2}` : " · sin pronóstico"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              R{pts.result}+A{pts.advance}
                            </span>
                            <Badge
                              variant="secondary"
                              className={pts.total > 0 ? "bg-primary text-primary-foreground" : ""}
                            >
                              +{pts.total}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
