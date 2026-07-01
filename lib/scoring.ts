import { ROUND_MAP } from "./constants"
import type { Advancer, Match, Prediction, SpecialPrediction } from "./types"

/**
 * Determines who advances given a score and an explicit advancer choice.
 * If the score is not a draw, the higher score advances automatically.
 * If it is a draw, the explicit advancer (penalties) is used.
 */
export function resolveAdvancer(
  score1: number,
  score2: number,
  explicit: Advancer | null,
): Advancer | null {
  if (score1 > score2) return "team1"
  if (score2 > score1) return "team2"
  return explicit
}

export interface MatchPoints {
  result: number // Category A
  advance: number // Category B
  total: number
  scored: boolean // whether the official result is available to score against
}

/**
 * Computes the points a single prediction earns for a match.
 * Category A (Resultado): 3 exact score, 1 right outcome, else 0.
 * Category B (Avance): solo existe en dieciseisavos, octavos, cuartos y
 * semifinal, y solo si el partido se definió por penales (empate a 120 min).
 * 1 punto si predijiste un ganador directo que resultó ser quien avanzó por
 * penales, o 2 puntos si predijiste el empate y también acertaste quién
 * avanzaba por penales.
 * Los partidos de Tercer Lugar y Final NO otorgan avance aquí: el bono de
 * acertar el tercer lugar (4) y el campeón (10) se maneja por separado, como
 * una predicción especial hecha con anticipación (ver computeSpecialPoints).
 */
export function computeMatchPoints(match: Match, pred: Prediction | undefined): MatchPoints {
  const empty: MatchPoints = { result: 0, advance: 0, total: 0, scored: false }

  const hasOfficial =
    match.official_score1 !== null && match.official_score2 !== null
  if (!hasOfficial || !pred) return empty

  const os1 = match.official_score1 as number
  const os2 = match.official_score2 as number
  const officialDraw = os1 === os2
  const officialAdvancer = resolveAdvancer(os1, os2, match.official_advancer)

  // Category A — Resultado
  let result = 0
  const exact = pred.pred_score1 === os1 && pred.pred_score2 === os2
  if (exact) {
    result = 3
  } else {
    const predDraw = pred.pred_score1 === pred.pred_score2
    if (officialDraw && predDraw) {
      result = 1
    } else if (!officialDraw && !predDraw) {
      // right winner (by higher score)?
      const officialWinner = os1 > os2 ? "team1" : "team2"
      const predWinner = pred.pred_score1 > pred.pred_score2 ? "team1" : "team2"
      if (officialWinner === predWinner) result = 1
    }
  }

  // Category B — Avance (no aplica en tercer_lugar ni final, ver docstring arriba)
  let advance = 0
  if (match.round !== "tercer_lugar" && match.round !== "final" && officialDraw) {
    const predAdvancer = resolveAdvancer(pred.pred_score1, pred.pred_score2, pred.pred_advancer)
    if (officialAdvancer && predAdvancer && officialAdvancer === predAdvancer) {
      const predDraw = pred.pred_score1 === pred.pred_score2
      advance = predDraw ? 2 : 1
    }
  }

  return { result, advance, total: result + advance, scored: true }
}

/**
 * Points from the special early picks (campeón / tercer lugar), evaluated
 * once the Final and Tercer Lugar matches have an official result.
 * Campeón = ganador oficial de la Final (10 pts si coincide con el pick).
 * Tercer lugar = ganador oficial del partido de Tercer Lugar (4 pts).
 */
export function computeSpecialPoints(
  participant: string,
  specials: SpecialPrediction[],
  matches: Match[],
): number {
  let points = 0

  const finalMatch = matches.find((m) => m.round === "final")
  const thirdMatch = matches.find((m) => m.round === "tercer_lugar")

  const champPick = specials.find(
    (s) => s.participant === participant && s.category === "campeon",
  )
  const thirdPick = specials.find(
    (s) => s.participant === participant && s.category === "tercer_lugar",
  )

  if (champPick && finalMatch?.official_score1 !== null && finalMatch?.official_score2 !== null && finalMatch) {
    const adv = resolveAdvancer(
      finalMatch.official_score1 as number,
      finalMatch.official_score2 as number,
      finalMatch.official_advancer,
    )
    const championTeam = adv === "team1" ? finalMatch.team1 : adv === "team2" ? finalMatch.team2 : null
    if (championTeam && championTeam === champPick.team) points += 10
  }

  if (thirdPick && thirdMatch?.official_score1 !== null && thirdMatch?.official_score2 !== null && thirdMatch) {
    const adv = resolveAdvancer(
      thirdMatch.official_score1 as number,
      thirdMatch.official_score2 as number,
      thirdMatch.official_advancer,
    )
    const thirdTeam = adv === "team1" ? thirdMatch.team1 : adv === "team2" ? thirdMatch.team2 : null
    if (thirdTeam && thirdTeam === thirdPick.team) points += 4
  }

  return points
}

export interface StandingRow {
  participant: string
  total: number
  resultPoints: number
  advancePoints: number
  specialPoints: number
  exactCount: number
  scoredMatches: number
}

/**
 * Builds the leaderboard across all matches, predictions, and special picks.
 */
export function computeStandings(
  participants: readonly string[],
  matches: Match[],
  predictions: Prediction[],
  specials: SpecialPrediction[] = [],
): StandingRow[] {
  const rows: StandingRow[] = participants.map((participant) => {
    let total = 0
    let resultPoints = 0
    let advancePoints = 0
    let exactCount = 0
    let scoredMatches = 0

    for (const match of matches) {
      const pred = predictions.find(
        (pr) => pr.participant === participant && pr.match_id === match.id,
      )
      const pts = computeMatchPoints(match, pred)
      if (pts.scored && pred) scoredMatches += 1
      total += pts.total
      resultPoints += pts.result
      advancePoints += pts.advance
      if (pts.result === 3) exactCount += 1
    }

    const specialPoints = computeSpecialPoints(participant, specials, matches)
    total += specialPoints

    return {
      participant,
      total,
      resultPoints,
      advancePoints,
      specialPoints,
      exactCount,
      scoredMatches,
    }
  })

  rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount
    return a.participant.localeCompare(b.participant)
  })

  return rows
}

/** Max possible points for a match in a given round (categoría A + B, sin contar predicciones especiales). */
export function maxPointsForRound(round: Match["round"]): number {
  if (round === "tercer_lugar" || round === "final") return 3
  return 3 + ROUND_MAP[round].advancePoints
}
