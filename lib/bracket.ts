import { ROUND_ORDER, type RoundName } from "./constants"
import { resolveAdvancer } from "./scoring"
import type { Match } from "./types"

export function matchWinner(match: Match): string | null {
  if (match.official_score1 === null || match.official_score2 === null) return null
  const adv = resolveAdvancer(match.official_score1, match.official_score2, match.official_advancer)
  if (!adv) return null
  return adv === "team1" ? match.team1 : match.team2
}

export function matchLoser(match: Match): string | null {
  if (match.official_score1 === null || match.official_score2 === null) return null
  const adv = resolveAdvancer(match.official_score1, match.official_score2, match.official_advancer)
  if (!adv) return null
  return adv === "team1" ? match.team2 : match.team1
}

function findMatch(matches: Match[], round: RoundName, position: number): Match | undefined {
  return matches.find((m) => m.round === round && m.position === position)
}

export interface SlotSource {
  // Human-readable placeholder when not yet resolved, e.g. "Ganador Partido 1"
  placeholder: string
  // The resolved team name, or null if the feeding match isn't decided yet
  team: string | null
}

/**
 * Returns the source (placeholder + resolved team) for a given slot of a match.
 * `slot` is "team1" or "team2". Dieciseisavos are loaded manually so they have no source.
 */
export function slotSource(
  matches: Match[],
  round: RoundName,
  position: number,
  slot: "team1" | "team2",
): SlotSource | null {
  if (round === "dieciseisavos") return null

  if (round === "octavos" || round === "cuartos" || round === "semifinal") {
    const prevRound = ROUND_ORDER[ROUND_ORDER.indexOf(round) - 1]
    const feederPos = slot === "team1" ? position * 2 - 1 : position * 2
    const feeder = findMatch(matches, prevRound, feederPos)
    return {
      placeholder: `Ganador P${feederPos} ${prevRoundShort(prevRound)}`,
      team: feeder ? matchWinner(feeder) : null,
    }
  }

  if (round === "final") {
    const feederPos = slot === "team1" ? 1 : 2
    const feeder = findMatch(matches, "semifinal", feederPos)
    return {
      placeholder: `Ganador Semifinal ${feederPos}`,
      team: feeder ? matchWinner(feeder) : null,
    }
  }

  // tercer_lugar — losers of the semifinals
  if (round === "tercer_lugar") {
    const feederPos = slot === "team1" ? 1 : 2
    const feeder = findMatch(matches, "semifinal", feederPos)
    return {
      placeholder: `Perdedor Semifinal ${feederPos}`,
      team: feeder ? matchLoser(feeder) : null,
    }
  }

  return null
}

function prevRoundShort(round: RoundName): string {
  switch (round) {
    case "dieciseisavos":
      return "16avos"
    case "octavos":
      return "8vos"
    case "cuartos":
      return "4tos"
    case "semifinal":
      return "Semis"
    default:
      return ""
  }
}

/**
 * Computes the team names that should populate every derived match (all rounds
 * except dieciseisavos) given the current official results. Used by the admin
 * "advance bracket" action. Returns updates only where a team can be resolved
 * and differs from what's currently stored.
 */
export interface BracketUpdate {
  id: string
  team1: string | null
  team2: string | null
}

export function computeBracketUpdates(matches: Match[]): BracketUpdate[] {
  const updates: BracketUpdate[] = []
  for (const round of ROUND_ORDER) {
    if (round === "dieciseisavos") continue
    const roundMatches = matches.filter((m) => m.round === round)
    for (const m of roundMatches) {
      const s1 = slotSource(matches, round, m.position, "team1")
      const s2 = slotSource(matches, round, m.position, "team2")
      const newTeam1 = s1?.team ?? m.team1
      const newTeam2 = s2?.team ?? m.team2
      if (newTeam1 !== m.team1 || newTeam2 !== m.team2) {
        updates.push({ id: m.id, team1: newTeam1, team2: newTeam2 })
      }
    }
  }
  return updates
}

/** Resolves the display name of a match slot: stored team, or live-resolved, or placeholder. */
export function resolveSlot(
  matches: Match[],
  match: Match,
  slot: "team1" | "team2",
): { name: string | null; placeholder: string | null } {
  const stored = slot === "team1" ? match.team1 : match.team2
  if (stored) return { name: stored, placeholder: null }
  const src = slotSource(matches, match.round, match.position, slot)
  if (src) {
    return { name: src.team, placeholder: src.placeholder }
  }
  return { name: null, placeholder: null }
}
