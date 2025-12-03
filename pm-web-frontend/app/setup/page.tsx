"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Key, Loader2, CheckCircle2, AlertCircle, Copy, ExternalLink, Info } from "lucide-react"
import { PM_API_BASE_URL } from "@/lib/config"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSetupState } from "@/hooks/useSetupState"

export default function SetupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: setupState, isLoading: stateLoading, refetch: refetchState } = useSetupState()

  const [serviceToken, setServiceToken] = useState("")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("token")

  // Redirect if already configured
  if (!stateLoading && setupState?.state === "CONFIGURED") {
    router.replace("/mitarbeiter")
    return null
  }

  const handleTokenSubmit = useCallback(async () => {
    if (!serviceToken || serviceToken.trim() === "") {
      setError("Bitte geben Sie einen Service-Token ein.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${PM_API_BASE_URL}/setup/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceToken: serviceToken.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unbekannter Fehler" }))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      toast({
        title: "Installation erfolgreich",
        description: "Die PM Tool Installation wurde erfolgreich konfiguriert.",
      })

      // Refetch state and redirect
      await refetchState()
      router.push("/mitarbeiter")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }, [serviceToken, router, toast, refetchState])

  const handleCodeSubmit = useCallback(async () => {
    // TODO: Implement when code exchange is available
    toast({
      title: "Noch nicht verfügbar",
      description: "Die Code-Austausch-Funktion wird in einer zukünftigen Version verfügbar sein.",
      variant: "destructive",
    })
  }, [toast])

  const copyInstructions = useCallback(() => {
    const instructions = `1. Loggen Sie sich in die Form Builder Admin-UI ein
2. Navigieren Sie zu Einstellungen → Service-Tokens
3. Klicken Sie auf "Neuen Token erstellen"
4. Geben Sie einen Namen ein (z.B. "PM Tool Production")
5. Kopieren Sie den generierten Token (wird nur einmal angezeigt!)
6. Fügen Sie den Token hier ein`

    navigator.clipboard.writeText(instructions).then(() => {
      toast({
        title: "Anleitung kopiert",
        description: "Die Anleitung wurde in die Zwischenablage kopiert.",
      })
    })
  }, [toast])

  if (stateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-montron-text">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-montron-primary" />
          <p className="text-montron-contrast dark:text-montron-extra">Lade Setup-Status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-montron-text flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-montron-text dark:text-white">
            PM Tool Setup
          </CardTitle>
          <CardDescription>
            Verbinden Sie das PM Tool mit dem Mobile App Backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Erste Schritte</AlertTitle>
            <AlertDescription>
              Um das PM Tool zu verwenden, müssen Sie es mit dem Mobile App Backend verbinden.
              Sie benötigen einen Service-Token, den Sie in der Form Builder Admin-UI erstellen
              können.
            </AlertDescription>
          </Alert>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token">Service Token verwenden</TabsTrigger>
              <TabsTrigger value="code" disabled>
                Einmal-Code (Kommt bald)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="token" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceToken" className="text-montron-text dark:text-white">
                  Service-Token <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="serviceToken"
                  type="password"
                  placeholder="Fügen Sie hier den Service-Token ein..."
                  value={serviceToken}
                  onChange={(e) => {
                    setServiceToken(e.target.value)
                    setError(null)
                  }}
                  className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white font-mono"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-montron-contrast dark:text-montron-extra">
                  Der Service-Token wird verschlüsselt gespeichert und für die Kommunikation mit
                  dem Mobile App Backend verwendet.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wie erhalte ich einen Service-Token?</AlertTitle>
                <AlertDescription className="space-y-2">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Loggen Sie sich in die Form Builder Admin-UI ein</li>
                    <li>Navigieren Sie zu Einstellungen → Service-Tokens</li>
                    <li>Klicken Sie auf "Neuen Token erstellen"</li>
                    <li>Geben Sie einen Namen ein (z.B. "PM Tool Production")</li>
                    <li>Kopieren Sie den generierten Token (wird nur einmal angezeigt!)</li>
                    <li>Fügen Sie den Token oben ein</li>
                  </ol>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyInstructions}
                      className="text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Anleitung kopieren
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleTokenSubmit}
                disabled={isSubmitting || !serviceToken.trim()}
                className="w-full bg-montron-primary text-white hover:bg-montron-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Konfiguriere...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Installation konfigurieren
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Noch nicht verfügbar</AlertTitle>
                <AlertDescription>
                  Die Code-Austausch-Funktion wird in einer zukünftigen Version verfügbar sein.
                  Bitte verwenden Sie vorerst den Service-Token.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-montron-text dark:text-white">
                  Einmal-Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Code wird hier eingegeben..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={true}
                  className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                />
              </div>

              <Button
                onClick={handleCodeSubmit}
                disabled={true}
                className="w-full bg-montron-primary text-white hover:bg-montron-primary/90 opacity-50"
              >
                Code einlösen (Kommt bald)
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

