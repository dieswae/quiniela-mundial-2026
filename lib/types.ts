import type { RoundName } from "./constants"

export type Advancer = "team1" | "team2"

export interface Match {
  id: string
  round: RoundName
  position: number
  team1: string | null
  team2: string | null
  official_score1: number | null
  official_score2: number | null
  official_advancer: Advancer | null
  round_locked: boolean
  created_at: string
}

export interface Prediction {
  id: string
  participant: string
  match_id: string
  pred_score1: number
  pred_score2: number
  pred_advancer: Advancer | null
  submitted_at: string
}

export interface RoundConfig {
  name: RoundName
  sort_order: number
  label: string
  is_open: boolean
}

export type SpecialCategory = "campeon" | "tercer_lugar"

export interface SpecialPrediction {
  id: string
  participant: string
  category: SpecialCategory
  team: string
  submitted_at: string
}