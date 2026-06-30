"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Match } from "@/lib/types"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AdminTeamsProps {
  data: QuinielaData
}

// Loads the 16 dieciseisavos teams (8 matches worth of team1/team2) in bracket order.
export function AdminTeams({ data }: AdminTeamsProps) {
  const dieciseisavos = data.matches
    .filter((m) => m.round === "dieciseisavos")
    .sort((a, b) => a.position - b.position)

  const [draft, setDraft] = useState<Record<string, { team1: string; team2: string }>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next: Record<string, { team1: string; team2: string }> = {}
    for (const m of dieciseisavos) {
      next[m.id] = { team1: m.team1 ?? "", team2: m.team2 ?? "" }
    }
    setDraft(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.matches.length])

  function update(id: string, slot: "team1" | "team2", value: string) {
    setDraft((d) => ({ ...d, [id]: { ...d[id], [slot]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    try {
      for (const m of dieciseisavos) {
        const d = draft[m.id]
        if (!d) continue
        const team1 = d.team1.trim() || null
        const team2 = d.team2.trim() || null
        if (team1 === m.team1 && team2 === m.team2) continue
        const { error } = await supabase
          .from("matches")
          .update({ team1, team2 })
          .eq("id", m.id)
        if (error) throw error
      }
      toast.success("Equipos guardados.")
      await data.refresh()
    } catch (err) {
      console.log("[v0] save teams error:", err)
      toast.error("No se pudieron guardar los equipos.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Carga los 16 equipos de dieciseisavos en el orden del cuadro real. Los partidos 1 y 2
        alimentan al partido 1 de octavos, y así sucesivamente.
      </p>
      <div className="flex flex-col gap-3">
        {dieciseisavos.map((m: Match) => (
          <div key={m.id} className="rounded-lg border bg-card p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Partido {m.position}
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={draft[m.id]?.team1 ?? ""}
                onChange={(e) => update(m.id, "team1", e.target.value)}
                placeholder="Equipo 1"
                className="h-9"
              />
              <span className="text-xs text-muted-foreground">vs</span>
              <Input
                value={draft[m.id]?.team2 ?? ""}
                onChange={(e) => update(m.id, "team2", e.target.value)}
                placeholder="Equipo 2"
                className="h-9"
              />
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar equipos"}
      </Button>
    </div>
  )
}
