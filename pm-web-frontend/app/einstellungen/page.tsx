"use client"

import { useCallback, useState, useEffect } from "react"
import { Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { useFormApiConfig, useUpdateFormApiConfig } from "@/hooks/useFormApiConfig"

export default function EinstellungenPage() {
  const { logout } = useAuth()
  const { data: config, isLoading: configLoading } = useFormApiConfig()
  const updateConfigMutation = useUpdateFormApiConfig()

  const [baseUrl, setBaseUrl] = useState("")
  const [serviceToken, setServiceToken] = useState("")

  // Initialize form when config loads (only once)
  useEffect(() => {
    if (config && baseUrl === "") {
      setBaseUrl(config.baseUrl || "")
      // Don't initialize serviceToken - user must always enter it manually for security
    }
  }, [config, baseUrl])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleSaveConfig = useCallback(() => {
    if (!serviceToken || serviceToken.trim() === "") {
      alert("Bitte geben Sie einen Service-Token ein.")
      return
    }

    updateConfigMutation.mutate({
      baseUrl: baseUrl || null,
      serviceToken: serviceToken.trim(),
    })
  }, [baseUrl, serviceToken, updateConfigMutation])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Session Settings */}
      <Card className="mb-6 border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
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
        </CardContent>
      </Card>

      {/* Form API Configuration */}
      <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-montron-text dark:text-white">Form API-Konfiguration</CardTitle>
              <CardDescription>
                Konfiguriere die Verbindung zum Form Builder Backend für die Kommunikation zwischen Anwendungen.
              </CardDescription>
            </div>
            {config?.serviceTokenConfigured && (
              <Badge variant="default" className="bg-green-500 hover:bg-green-500/90 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Konfiguriert
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {configLoading ? (
            <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
              <Spinner className="h-4 w-4" />
              <span>Lade Konfiguration…</span>
            </div>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wichtig</AlertTitle>
                <AlertDescription>
                  Der Service-Token wird verschlüsselt in der Datenbank gespeichert. Sie erhalten den Token aus der
                  Form Builder Admin-UI unter{" "}
                  <code className="px-1 py-0.5 bg-montron-extra dark:bg-montron-contrast/20 rounded text-xs">
                    /service-tokens
                  </code>
                  .
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-montron-text dark:text-white">
                    Base URL (optional)
                  </Label>
                  <Input
                    id="baseUrl"
                    type="url"
                    placeholder="https://form-api.example.com/api"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                  <p className="text-xs text-montron-contrast dark:text-montron-extra">
                    Die Base URL des Form Builder Backends. Wird standardmäßig aus der Konfiguration verwendet.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceToken" className="text-montron-text dark:text-white">
                    Service-Token <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="serviceToken"
                    type="password"
                    placeholder="Fügen Sie hier den Service-Token ein..."
                    value={serviceToken}
                    onChange={(e) => setServiceToken(e.target.value)}
                    className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white font-mono"
                  />
                  <p className="text-xs text-montron-contrast dark:text-montron-extra">
                    Der Service-Token für die Kommunikation mit dem Form Builder Backend. Wird verschlüsselt
                    gespeichert.
                  </p>
                </div>
              </div>

              <Separator className="bg-montron-contrast/10 dark:bg-montron-contrast/40" />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBaseUrl(config?.baseUrl || "")
                    setServiceToken("")
                  }}
                  disabled={updateConfigMutation.isPending}
                  className="border-montron-contrast/30 dark:border-montron-contrast/50"
                >
                  Zurücksetzen
                </Button>
                <Button
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending || !serviceToken.trim()}
                  className="bg-montron-primary text-white hover:bg-montron-primary/90"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Konfiguration speichern
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

