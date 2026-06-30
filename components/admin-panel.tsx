"use client"

import { useState } from "react"
import { ListChecks, ShieldCheck, Trophy, Users } from "lucide-react"
import { toast } from "sonner"
import { ADMIN_PIN } from "@/lib/constants"
import type { QuinielaData } from "@/hooks/use-quiniela"
import { AdminTeams } from "@/components/admin/admin-teams"
import { AdminRounds } from "@/components/admin/admin-rounds"
import { AdminResults } from "@/components/admin/admin-results"
import { AdminLoadPredictions } from "@/components/admin/admin-load-predictions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Section = "rounds" | "results" | "teams" | "predictions"

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "rounds", label: "Rondas", icon: <ShieldCheck className="size-4" /> },
  { id: "results", label: "Resultados", icon: <Trophy className="size-4" /> },
  { id: "teams", label: "Equipos", icon: <Users className="size-4" /> },
  { id: "predictions", label: "Cargar pronósticos", icon: <ListChecks className="size-4" /> },
]

export function AdminPanel({ data }: { data: QuinielaData }) {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState("")
  const [section, setSection] = useState<Section>("rounds")

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      setAuthed(true)
      toast.success("Acceso de administrador concedido.")
    } else {
      toast.error("PIN incorrecto.")
      setPin("")
    }
  }

  if (!authed) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold">Panel de administrador</h2>
          <p className="text-sm text-muted-foreground">Ingresa el PIN para continuar.</p>
        </div>
        <form
          onSubmit={handleUnlock}
          className="flex flex-col gap-3 rounded-xl border bg-card p-5"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pin">PIN de administrador</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              autoFocus
            />
          </div>
          <Button type="submit">Entrar</Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Administrador</h2>
          <p className="text-sm text-muted-foreground">Gestiona el torneo</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAuthed(false)}>
          Salir
        </Button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {SECTIONS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={section === s.id ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => setSection(s.id)}
            >
              {s.icon}
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {section === "rounds" ? <AdminRounds data={data} /> : null}
      {section === "results" ? <AdminResults data={data} /> : null}
      {section === "teams" ? <AdminTeams data={data} /> : null}
      {section === "predictions" ? <AdminLoadPredictions data={data} /> : null}
    </div>
  )
}
