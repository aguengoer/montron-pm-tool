"use client"

import { useCallback } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function EinstellungenPage() {
  const { logout } = useAuth()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-xl border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader>
          <CardTitle className="text-montron-text dark:text-white">Einstellungen</CardTitle>
          <CardDescription>Verwalte deine Sitzung und App-Einstellungen.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-montron-text dark:text-white">Sitzung</h3>
            <p className="text-sm text-montron-contrast dark:text-montron-extra">
              Du bist angemeldet. Du kannst dich abmelden, um einen neuen Zugangstoken zu erhalten.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleLogout} className="bg-montron-primary text-white hover:bg-montron-primary/90">
                Abmelden
              </Button>
            </div>
          </div>

          <Separator className="bg-montron-contrast/10 dark:bg-montron-contrast/40" />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-montron-text dark:text-white">App</h3>
            <p className="text-sm text-montron-contrast dark:text-montron-extra">
              Weitere Einstellungen folgen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

