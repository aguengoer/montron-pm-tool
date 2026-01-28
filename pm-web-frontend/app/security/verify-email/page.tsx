"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { sendVerificationEmail, completeLoginFlow } from "@/services/auth"
import { useToast } from "@/hooks/use-toast"
import { getAccessToken } from "@/lib/authToken"
import { multiFactor, TotpMultiFactorGenerator } from "firebase/auth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState(auth.currentUser)

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login")
      return
    }

    // If email is already verified on mount, redirect appropriately
    if (user.emailVerified) {
      handleVerified()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Update user state when auth.currentUser changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  const handleVerified = async () => {
    if (!user) return

    // Ensure user is reloaded to get latest email verification status
    await user.reload()

    // Double-check email is verified
    if (!user.emailVerified) {
      toast({
        title: "E-Mail noch nicht verifiziert",
        description: "Bitte warten Sie einen Moment und versuchen Sie es erneut.",
        variant: "destructive",
      })
      return
    }

    // If user is not fully logged in (no backend token), complete login flow
    let token = getAccessToken()
    if (!token) {
      try {
        // Complete login flow to get backend JWT token
        // This will exchange Firebase ID token for backend JWT
        await completeLoginFlow(user)
        token = getAccessToken()
      } catch (error: any) {
        // If email verification check fails (backend still sees unverified)
        if (error.message === "EMAIL_NOT_VERIFIED" || error.message?.includes("403")) {
          toast({
            title: "E-Mail-Verifizierung wird verarbeitet",
            description: "Die E-Mail-Verifizierung wird noch verarbeitet. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
            variant: "default",
          })
          // Don't redirect - stay on page so user can try again
          return
        }
        // Other errors - show error but don't redirect to login (user is still logged in Firebase)
        console.error("Error completing login flow:", error)
        toast({
          title: "Fehler beim Abschluss der Anmeldung",
          description: error.message || "Bitte versuchen Sie es erneut.",
          variant: "destructive",
        })
        return
      }
    }

    // Now check if admin needs MFA enrollment
    if (!token) {
      // Token still not available - wait a bit and try again
      toast({
        title: "Wird verarbeitet",
        description: "Bitte warten Sie einen Moment...",
        variant: "default",
      })
      return
    }

    // Check if user has MFA enrolled (for admin users)
    if (user) {
      try {
        const multiFactorUser = multiFactor(user)
        const enrolledFactors = multiFactorUser.enrolledFactors || []
        const hasTotp = enrolledFactors.some(
          (factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID
        )

        // For now, redirect to main page - MFA can be set up later
        // If MFA is required, redirect to MFA setup page
        // if (!hasTotp) {
        //   router.push("/security/mfa")
        //   return
        // }
      } catch (error) {
        console.error("Error checking MFA status:", error)
      }
    }

    // All good, redirect to main page
    router.push("/mitarbeiter")
  }

  const handleSendVerification = async () => {
    if (!user) return

    setSending(true)
    try {
      await sendVerificationEmail()
      toast({
        title: "Bestätigungs-Mail gesendet",
        description: "Bitte prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Die Bestätigungs-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Reload user to get latest email verification status
      await user.reload()

      if (user.emailVerified) {
        toast({
          title: "E-Mail verifiziert",
          description: "Ihre E-Mail-Adresse wurde erfolgreich verifiziert.",
          variant: "default",
        })
        
        // Update user state
        setUser(user)
        
        // Call handleVerified which will complete login flow if needed and redirect
        await handleVerified()
      } else {
        toast({
          title: "Noch nicht verifiziert",
          description: "Bitte klicken Sie auf den Link in der E-Mail oder senden Sie eine neue Bestätigungs-Mail.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Fehler beim Prüfen des Verifizierungsstatus.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail-Adresse verifizieren
          </CardTitle>
          <CardDescription>
            Bitte verifizieren Sie Ihre E-Mail-Adresse, um fortzufahren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Eine Bestätigungs-Mail wurde an <strong>{user.email}</strong> gesendet. Bitte
              klicken Sie auf den Link in der E-Mail, um Ihre Adresse zu verifizieren.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={handleSendVerification} disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Bestätigungs-Mail erneut senden
                </>
              )}
            </Button>

            <Button
              onClick={handleCheckVerification}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird geprüft...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Ich habe verifiziert
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
