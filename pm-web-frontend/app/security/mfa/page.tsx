"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react"
import { auth } from "@/lib/firebase"
import { reauthenticateUser } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"
import { multiFactor, TotpMultiFactorGenerator } from "firebase/auth"
// QR Code will be generated via API URL

export default function MfaEnrollmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"password" | "qr" | "verify">("password")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [totpSecretObj, setTotpSecretObj] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [reauthenticating, setReauthenticating] = useState(false)
  const [user, setUser] = useState(auth.currentUser)

  // Update user state when auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    // Check if user is authenticated and email is verified
    if (!user) {
      router.push("/login")
      return
    }

    if (!user.emailVerified) {
      router.push("/security/verify-email")
      return
    }

    // Check if TOTP is already enrolled
    const checkExistingMfa = async () => {
      try {
        const multiFactorUser = multiFactor(user)
        const enrolledFactors = multiFactorUser.enrolledFactors || []
        const hasTotp = enrolledFactors.some(
          (factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID
        )

        if (hasTotp) {
          // Already enrolled, redirect to main page
          router.push("/mitarbeiter")
        } else {
          // Not enrolled yet - ensure we're on password step
          setStep("password")
        }
      } catch (error) {
        console.error("Error checking MFA status:", error)
        // On error, ensure password step is shown
        setStep("password")
      }
    }

    checkExistingMfa()
  }, [user, router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔐 handlePasswordSubmit called", { user: user?.email, hasPassword: !!password })

    if (!user || !user.email || !password) {
      console.error("❌ Missing user or password", { user: !!user, email: user?.email, password: !!password })
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Ihr Passwort ein.",
        variant: "destructive",
      })
      return
    }

    setReauthenticating(true)
    try {
      console.log("🔄 Re-authenticating user...")
      await reauthenticateUser(user.email, password)
      console.log("✅ Re-authentication successful, generating secret...")
      await handleGenerateSecret()
      console.log("✅ Secret generated successfully")
    } catch (error: any) {
      console.error("❌ Error in handlePasswordSubmit:", error)
      toast({
        title: "Fehler",
        description: error.message || "Ungültiges Passwort. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setReauthenticating(false)
    }
  }

  const handleGenerateSecret = useCallback(async () => {
    try {
      console.log("🔑 Generating TOTP secret...")
      if (!user) {
        throw new Error("Not authenticated")
      }

      const multiFactorUser = multiFactor(user)
      
      // Get session first, then generate TOTP secret
      const session = await multiFactorUser.getSession()
      const secret = TotpMultiFactorGenerator.generateSecret(session)

      // Generate QR code URL
      const issuer = "Montron Solutions"
      const email = user.email || ""
      const qrUrlString = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`

      setTotpSecret(secret) // String for display
      setTotpSecretObj(secret) // Secret for enrollment
      setQrUrl(qrUrlString)
      setStep("verify")
      console.log("✅ Step set to verify")
    } catch (error: any) {
      console.error("❌ Error generating secret:", error)
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Generieren des TOTP-Secrets.",
        variant: "destructive",
      })
      // Reset to password step on error
      setStep("password")
    }
  }, [user, toast])

  const handleVerifyAndEnroll = async () => {
    if (!verificationCode || verificationCode.length !== 6 || !totpSecretObj || !user) {
      return
    }

    try {
      const multiFactorUser = multiFactor(user)

      // Create TOTP assertion for enrollment
      const totpAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecretObj,
        verificationCode
      )

      // Enroll the TOTP as a second factor
      await multiFactorUser.enroll(totpAssertion, "Authenticator App")

      toast({
        title: "2FA aktiviert",
        description: "Die 2-Faktor-Authentifizierung wurde erfolgreich aktiviert.",
        variant: "default",
      })
      router.push("/mitarbeiter")
    } catch (error: any) {
      console.error("Error enrolling TOTP:", error)
      if (error.code === "auth/invalid-verification-code") {
        toast({
          title: "Fehler",
          description: "Ungültiger Verifizierungscode. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Fehler",
          description: error.message || "Fehler beim Aktivieren der 2FA",
          variant: "destructive",
        })
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">Lädt...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2-Faktor-Authentifizierung einrichten
          </CardTitle>
          <CardDescription>
            Als Administrator müssen Sie die 2FA aktivieren, um fortzufahren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Zur Sicherheit müssen Sie sich erneut mit Ihrem Passwort authentifizieren, um
                  die 2FA einzurichten.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ihr Passwort"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" disabled={reauthenticating} className="w-full">
                {reauthenticating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird authentifiziert...
                  </>
                ) : (
                  "Weiter"
                )}
              </Button>
            </form>
          )}

          {step === "verify" && qrUrl && (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Scannen Sie den QR-Code mit einer Authenticator-App (z.B. Google Authenticator,
                  Authy, Microsoft Authenticator).
                </AlertDescription>
              </Alert>

              <div className="flex flex-col items-center space-y-4">
                {qrUrl && (
                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                      alt="TOTP QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">
                    Oder geben Sie diesen Code manuell ein:
                  </p>
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                    {totpSecret}
                  </code>
                </div>

                <div className="w-full space-y-2">
                  <Label htmlFor="totp-code">Verifizierungscode</Label>
                  <Input
                    id="totp-code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground">
                    Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("password")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button
                  onClick={handleVerifyAndEnroll}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aktivieren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
