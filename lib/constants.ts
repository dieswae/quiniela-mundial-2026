export const PARTICIPANTS = ["Diego", "Dervin", "Chucho", "Paul", "Gabo", "Josue", "Manu"] as const

export type Participant = (typeof PARTICIPANTS)[number]

// Placeholder admin PIN (not real security — just prevents accidental edits).
export const ADMIN_PIN = "1234"

export type RoundName =
  | "dieciseisavos"
  | "octavos"
  | "cuartos"
  | "semifinal"
  | "tercer_lugar"
  | "final"

export interface RoundMeta {
  name: RoundName
  label: string
  shortLabel: string
  order: number
  matchCount: number
  advancePoints: number // Category B points for guessing the advancer
}

// Tournament structure, in order. Advance points follow the scoring rules:
// 2 pts for dieciseisavos..semifinal, 4 for third place, 10 for the final.
export const ROUNDS: RoundMeta[] = [
  { name: "dieciseisavos", label: "Dieciseisavos de Final", shortLabel: "16avos", order: 1, matchCount: 16, advancePoints: 2 },
  { name: "octavos", label: "Octavos de Final", shortLabel: "8vos", order: 2, matchCount: 8, advancePoints: 2 },
  { name: "cuartos", label: "Cuartos de Final", shortLabel: "4tos", order: 3, matchCount: 4, advancePoints: 2 },
  { name: "semifinal", label: "Semifinal", shortLabel: "Semis", order: 4, matchCount: 2, advancePoints: 2 },
  { name: "tercer_lugar", label: "Tercer Lugar", shortLabel: "3er", order: 5, matchCount: 1, advancePoints: 4 },
  { name: "final", label: "Final", shortLabel: "Final", order: 6, matchCount: 1, advancePoints: 10 },
]

export const ROUND_MAP: Record<RoundName, RoundMeta> = ROUNDS.reduce(
  (acc, r) => {
    acc[r.name] = r
    return acc
  },
  {} as Record<RoundName, RoundMeta>,
)

export const ROUND_ORDER: RoundName[] = ROUNDS.map((r) => r.name)
