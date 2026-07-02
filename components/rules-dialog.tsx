"use client"

import { useState } from "react"
import { BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function RulesDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="size-4" />
        Reglamento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80dvh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reglamento de puntuación</DialogTitle>
            <DialogDescription>
              Así se calculan los puntos de cada partido
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 text-sm">
            <section className="flex flex-col gap-1.5">
              <p className="font-semibold">Resultado del partido</p>
              <p className="text-muted-foreground">
                Se toma en cuenta el marcador a 120 minutos (incluye tiempo
                extra si lo hubo).
              </p>
              <ul className="flex flex-col gap-1 rounded-lg border p-3">
                <RuleRow
                  points={3}
                  label="Marcador exacto (ganador o empate exacto)"
                />
                <RuleRow
                  points={1}
                  label="Acertaste el ganador, pero no el marcador"
                />
                <RuleRow
                  points={1}
                  label="Acertaste que era empate, pero no el marcador"
                />
                <RuleRow
                  points={0}
                  label="No acertaste ninguno de los anteriores"
                />
              </ul>
              <p className="text-xs text-muted-foreground">
                Ojo: estos puntos no se suman entre sí, se otorga solo el más
                alto que aplique.
              </p>
            </section>

            <section className="flex flex-col gap-1.5">
              <p className="font-semibold">Avance a la siguiente ronda</p>
              <p className="text-muted-foreground">
                Solo aplica en 16avos, 8vos, cuartos y semifinal. Se suma
                aparte del punto de resultado, y solo cuando tu predicción o
                el resultado real (o ambos) terminaron definiéndose por
                penales.
              </p>
              <ul className="flex flex-col gap-1 rounded-lg border p-3">
                <RuleRow
                  points={2}
                  label="Pusiste el empate y el partido real también fue a penales, y acertaste quién avanzaba"
                />
                <RuleRow
                  points={1}
                  label="Pusiste el empate (penales) pero ese equipo ganó directo en el tiempo reglamentario"
                />
                <RuleRow
                  points={1}
                  label="Pusiste un ganador directo, pero el partido real fue a penales y ese equipo avanzó"
                />
                <RuleRow points={0} label="Ninguno de los dos casos fue a penales" />
              </ul>
              <p className="text-xs text-muted-foreground">
                Si ninguno fue a penales, no hay puntos de avance — el ganador
                ya quedó premiado en la categoría de resultado.
              </p>
            </section>

            <section className="flex flex-col gap-1.5">
              <p className="font-semibold">Predicciones especiales</p>
              <p className="text-muted-foreground">
                Se eligen una sola vez, con anticipación, desde la sección de
                Pronósticos. Se comparan contra el resultado real cuando termine
                el Mundial.
              </p>
              <ul className="flex flex-col gap-1 rounded-lg border p-3">
                <RuleRow points={10} label="Acertar el campeón del Mundial" />
                <RuleRow
                  points={4}
                  label="Acertar el tercer lugar del Mundial"
                />
              </ul>
            </section>

            <section className="flex flex-col gap-1.5">
              <p className="font-semibold">Puntaje máximo por partido</p>
              <p className="text-muted-foreground">
                5 puntos (3 de resultado + 2 de avance) en 16avos, 8vos, cuartos
                y semifinal — solo alcanzable si el partido fue a penales. 3
                puntos en la Final y el partido por el Tercer Lugar (el bono de
                campeón/tercer lugar se gana aparte, con la predicción
                especial).
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RuleRow({ points, label }: { points: number; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums">
        +{points}
      </span>
    </li>
  )
}