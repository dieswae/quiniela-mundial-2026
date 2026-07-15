"use client"

import { useState } from "react"
import { ROUNDS, type RoundName } from "@/lib/constants"
import { resolveSlot } from "@/lib/bracket"
import { resolveAdvancer } from "@/lib/scoring"
import type { Match } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { MatchDetailDialog } from "@/components/match-detail-dialog"
import { TeamFlag } from "@/components/team-flag"
import { cn } from "@/lib/utils"

interface BracketViewProps {
  data: QuinielaData
}

// Rondas que dibujan una línea conectora hacia la ronda siguiente (la
// progresión limpia de "el ganador pasa"). Semifinal queda afuera a
// propósito: en el orden de columnas, lo que sigue después de semifinal es
// Tercer Lugar (donde juegan los PERDEDORES), no la Final — dibujar una
// línea ahí confundiría más de lo que ayuda.
const CONNECTOR_ROUNDS = new Set<RoundName>(["dieciseisavos", "octavos", "cuartos"])

function chunkPairs<T>(arr: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2))
  return out
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
        <div className="flex w-max gap-6">
          {ROUNDS.filter((r) => r.name !== "tercer_lugar").map((round) => {
            if (round.name === "final") {
              // Columna combinada: Final arriba, Tercer Lugar abajo. Se unen
              // porque cada una tiene un solo partido — si se dejan como
              // columnas separadas, cada una queda centrada en el medio de
              // TODA la altura del cuadro y termina flotando lejos de
              // semifinal. Juntas como pareja, se posicionan alineadas con
              // los dos partidos de semifinal (igual que cualquier otra
              // pareja), sin necesidad de dibujarles línea.
              const finalMatches = matches.filter((m) => m.round === "final")
              const tercerLugarMatches = matches.filter((m) => m.round === "tercer_lugar")
              return (
                <div key="final-stage" className="flex w-44 shrink-0 flex-col">
                  <div className="flex flex-1 flex-col justify-around">
                    {[...finalMatches.map((m) => ({ m, label: "Final" })), ...tercerLugarMatches.map((m) => ({ m, label: "Tercer Lugar" }))].map(
                      ({ m, label }) => (
                        <div key={m.id} className="flex flex-col gap-1.5">
                          <p className="text-center text-xs font-bold text-muted-foreground">
                            {label}
                          </p>
                          <BracketMatch
                            match={m}
                            matches={matches}
                            onClick={() => setSelected(m)}
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )
            }

            const roundMatches = matches.filter((m) => m.round === round.name)
            const showConnectors = CONNECTOR_ROUNDS.has(round.name) && roundMatches.length >= 2

            return (
              <div key={round.name} className="flex w-44 shrink-0 flex-col">
                <p className="mb-2 text-center text-xs font-bold text-muted-foreground">
                  {round.label}
                </p>
                <div className="flex flex-1 flex-col justify-around">
                  {showConnectors
                    ? chunkPairs(roundMatches).map((pair, idx) => (
                        <div
                          key={idx}
                          className="relative flex flex-col gap-2 after:absolute after:bottom-8 after:left-full after:top-8 after:w-6 after:rounded-r-md after:border-y-2 after:border-r-2 after:border-border after:content-['']"
                        >
                          {pair.map((match) => (
                            <BracketMatch
                              key={match.id}
                              match={match}
                              matches={matches}
                              onClick={() => setSelected(match)}
                            />
                          ))}
                        </div>
                      ))
                    : roundMatches.map((match) => (
                        <BracketMatch
                          key={match.id}
                          match={match}
                          matches={matches}
                          onClick={() => setSelected(match)}
                        />
                      ))}
                </div>
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
        "flex h-8 items-center justify-between gap-2 px-2.5",
        decided && winner && "bg-primary/10",
      )}
    >
      <span
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 text-xs",
          name ? "font-medium" : "italic text-muted-foreground",
          decided && winner && "font-bold text-primary",
          decided && !winner && name && "text-muted-foreground",
        )}
      >
        <TeamFlag name={name} />
        <span className="min-w-0 truncate">{name ?? placeholder ?? "Por definir"}</span>
      </span>
      <span className="w-4 text-center text-xs font-bold tabular-nums text-muted-foreground">
        {score ?? ""}
      </span>
    </div>
  )
}