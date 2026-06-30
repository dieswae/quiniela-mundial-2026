import { ROUND_MAP } from "./constants"
import type { Advancer, Match, Prediction } from "./types"

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
 * Category B (Avance): advancePoints if predicted advancer matches official advancer.
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

  // Category B — Avance
  let advance = 0
  const predAdvancer = resolveAdvancer(pred.pred_score1, pred.pred_score2, pred.pred_advancer)
  if (officialAdvancer && predAdvancer && officialAdvancer === predAdvancer) {
    advance = ROUND_MAP[match.round].advancePoints
  }

  return { result, advance, total: result + advance, scored: true }
}

export interface StandingRow {
  participant: string
  total: number
  resultPoints: number
  advancePoints: number
  exactCount: number
  scoredMatches: number
}

/**
 * Builds the leaderboard across all matches and predictions.
 */
export function computeStandings(
  participants: readonly string[],
  matches: Match[],
  predictions: Prediction[],
): StandingRow[] {
  const byParticipant = new Map<string, Prediction[]>()
  for (const p of predictions) {
    const arr = byParticipant.get(p.participant) ?? []
    arr.push(p)
    byParticipant.set(p.participant, arr)
  }

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

    return { participant, total, resultPoints, advancePoints, exactCount, scoredMatches }
  })

  rows.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount
    return a.participant.localeCompare(b.participant)
  })

  return rows
}

/** Max possible points for a match in a given round. */
export function maxPointsForRound(round: Match["round"]): number {
  return 3 + ROUND_MAP[round].advancePoints
}
