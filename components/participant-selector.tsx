"use client"

import { Trophy } from "lucide-react"
import { PARTICIPANTS } from "@/lib/constants"
import { Button } from "@/components/ui/button"

interface ParticipantSelectorProps {
  onSelect: (name: string) => void
}

export function ParticipantSelector({ onSelect }: ParticipantSelectorProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Trophy className="size-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Quiniela Mundial 2026
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Fase eliminatoria. Elige tu nombre para empezar a pronosticar.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-card-foreground">
            ¿Quién eres?
          </p>
          <div className="flex flex-col gap-2.5">
            {PARTICIPANTS.map((name) => (
              <Button
                key={name}
                variant="outline"
                size="lg"
                className="h-12 justify-start text-base font-medium"
                onClick={() => onSelect(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sin contraseñas. Grupo cerrado de 6 amigos.
        </p>
      </div>
    </main>
  )
}
