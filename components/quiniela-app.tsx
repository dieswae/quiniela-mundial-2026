"use client"

import { useState } from "react"
import { ClipboardList, ListOrdered, Network, Settings, Trophy, UserRound } from "lucide-react"
import { useParticipant } from "@/hooks/use-participant"
import { useQuiniela } from "@/hooks/use-quiniela"
import { ParticipantSelector } from "@/components/participant-selector"
import { PredictionsView } from "@/components/predictions-view"
import { Leaderboard } from "@/components/leaderboard"
import { BracketView } from "@/components/bracket-view"
import { AdminPanel } from "@/components/admin-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function QuinielaApp() {
  const { participant, setParticipant, clearParticipant, ready } = useParticipant()
  const data = useQuiniela()
  const [tab, setTab] = useState("pronosticos")

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </main>
    )
  }

  if (!participant) {
    return <ParticipantSelector onSelect={setParticipant} />
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b bg-background/90 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold">Quiniela 2026</p>
              <p className="text-xs text-muted-foreground">Fase eliminatoria</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={clearParticipant}
          >
            <UserRound className="size-4" />
            <span className="max-w-24 truncate">{participant}</span>
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="flex flex-1 flex-col gap-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-5">
          <TabsContent value="pronosticos" className="mt-0">
            <PredictionsView data={data} participant={participant} />
          </TabsContent>
          <TabsContent value="tabla" className="mt-0">
            <Leaderboard data={data} />
          </TabsContent>
          <TabsContent value="cuadro" className="mt-0">
            <BracketView data={data} />
          </TabsContent>
          <TabsContent value="admin" className="mt-0">
            <AdminPanel data={data} />
          </TabsContent>
        </main>

        <TabsList className="grid h-auto w-full shrink-0 grid-cols-4 gap-0 rounded-none border-t bg-background p-0 pb-[env(safe-area-inset-bottom)]">
          <TabBarItem value="pronosticos" icon={<ClipboardList className="size-5" />} label="Pronósticos" />
          <TabBarItem value="tabla" icon={<ListOrdered className="size-5" />} label="Tabla" />
          <TabBarItem value="cuadro" icon={<Network className="size-5" />} label="Cuadro" />
          <TabBarItem value="admin" icon={<Settings className="size-5" />} label="Admin" />
        </TabsList>
      </Tabs>
    </div>
  )
}

function TabBarItem({
  value,
  icon,
  label,
}: {
  value: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="flex h-16 flex-col items-center justify-center gap-1 rounded-none border-0 text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </TabsTrigger>
  )
}