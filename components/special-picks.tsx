"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Lock, Trophy } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Match, SpecialCategory, SpecialPrediction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SpecialPicksProps {
  matches: Match[]
  specials: SpecialPrediction[]
  participant: string
  onSaved: () => Promise<void>
}

const CATEGORY_LABEL: Record<SpecialCategory, string> = {
  campeon: "Campeón del Mundial",
  tercer_lugar: "Tercer lugar del Mundial",
}

const CATEGORY_POINTS: Record<SpecialCategory, number> = {
  campeon: 10,
  tercer_lugar: 4,
}

export function SpecialPicks({ matches, specials, participant, onSaved }: SpecialPicksProps) {
  // Los 32 equipos originales de dieciseisavos, aunque ya estén eliminados.
  const teams = useMemo(() => {
    const set = new Set<string>()
    for (const m of matches) {
      if (m.round !== "dieciseisavos") continue
      if (m.team1) set.add(m.team1)
      if (m.team2) set.add(m.team2)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [matches])

  const champPick = specials.find((s) => s.participant === participant && s.category === "campeon")
  const thirdPick = specials.find(
    (s) => s.participant === participant && s.category === "tercer_lugar",
  )

  if (teams.length === 0) return null

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="size-4 text-primary" />
        <p className="text-sm font-semibold">Campeón y Tercer Lugar</p>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Se eligen una sola vez y quedan bloqueados de inmediato. Se comparan contra el resultado
        real al final del Mundial.
      </p>
      <div className="flex flex-col gap-3">
        <PickRow
          category="campeon"
          teams={teams}
          existing={champPick}
          otherPickedTeam={thirdPick?.team}
          participant={participant}
          onSaved={onSaved}
        />
        <PickRow
          category="tercer_lugar"
          teams={teams}
          existing={thirdPick}
          otherPickedTeam={champPick?.team}
          participant={participant}
          onSaved={onSaved}
        />
      </div>
    </div>
  )
}

interface PickRowProps {
  category: SpecialCategory
  teams: string[]
  existing: SpecialPrediction | undefined
  otherPickedTeam: string | undefined
  participant: string
  onSaved: () => Promise<void>
}

function PickRow({ category, teams, existing, otherPickedTeam, participant, onSaved }: PickRowProps) {
  const [team, setTeam] = useState<string>(existing?.team ?? "")
  const [saving, setSaving] = useState(false)
  const locked = Boolean(existing)

  async function handleSubmit() {
    if (!team) {
      toast.error("Elige un equipo primero.")
      return
    }
    if (otherPickedTeam && otherPickedTeam === team) {
      toast.error("Ya elegiste ese equipo para la otra categoría. Debe ser un equipo distinto.")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from("special_predictions").insert({
      participant,
      category,
      team,
    })
    setSaving(false)
    if (error) {
      console.log("[v0] insert special prediction error:", error)
      if (error.code === "23505") {
        toast.error("Ya enviaste esta predicción.")
      } else {
        toast.error("No se pudo guardar la predicción.")
      }
      return
    }
    toast.success("Predicción guardada y bloqueada.")
    await onSaved()
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border px-3 py-2.5",
        locked && "border-primary/30 bg-primary/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {CATEGORY_LABEL[category]} · +{CATEGORY_POINTS[category]} pts
        </span>
        {locked ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Lock className="size-3" /> Bloqueado
          </span>
        ) : null}
      </div>

      {locked ? (
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <CheckCircle2 className="size-3.5 text-primary" /> {existing!.team}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Select value={team} onValueChange={(v) => setTeam(v ?? "")}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona un equipo" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !team}>
            {saving ? "..." : "Enviar"}
          </Button>
        </div>
      )}
    </div>
  )
}