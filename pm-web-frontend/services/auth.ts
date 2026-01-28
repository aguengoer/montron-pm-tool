/**
 * Authentication service for backend integration
 */
import { formApiFetch } from "@/lib/formApiClient"
import { setAccessToken } from "@/lib/authToken"
import { toast } from "@/hooks/use-toast"
import {
  signInWithEmailAndPassword,
  getIdToken,
  signOut,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  User,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

export interface LoginResponse {
  accessToken: string
}

export interface BeginSignInResult {
  type: "SIGNED_IN"
  userCredential: any
}

export interface MfaRequiredResult {
  type: "MFA_REQUIRED"
  resolver: any
  hints: any[]
}

export type SignInResult = BeginSignInResult | MfaRequiredResult

/**
 * Begin sign-in process with email and password
 * Returns either successful sign-in or MFA required result
 */
export async function beginSignIn(email: string, password: string): Promise<SignInResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
    return { type: "SIGNED_IN", userCredential }
  } catch (error: any) {
    console.error("❌ Firebase sign-in error:", {
      code: error.code,
      message: error.message,
      email: email.trim()
    })
    
    // Check if MFA is required
    if (error.code === "auth/multi-factor-auth-required") {
      const resolver = getMultiFactorResolver(auth, error)
      return {
        type: "MFA_REQUIRED",
        resolver,
        hints: resolver.hints,
      }
    }
    
    // Handle Firebase authentication errors with German messages
    let errorMessage = "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."
    
    if (error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-email") {
      errorMessage = "Ungültige E-Mail-Adresse oder Passwort"
    } else if (error.code === "auth/user-disabled") {
      errorMessage = "Dieses Konto wurde deaktiviert. Bitte kontaktieren Sie den Administrator."
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuchen Sie es später erneut."
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung."
    } else if (error.code === "auth/operation-not-allowed") {
      errorMessage = "E-Mail/Passwort-Anmeldung ist nicht aktiviert. Bitte kontaktieren Sie den Administrator."
    } else if (error.message) {
      errorMessage = `Fehler: ${error.message}`
    }
    
    // Show toast with error message
    toast({
      title: "Anmeldung fehlgeschlagen",
      description: errorMessage,
      variant: "destructive",
    })
    
    throw error
  }
}

/**
 * Complete TOTP sign-in with MFA code
 */
export async function completeTotpSignIn(resolver: any, otp: string): Promise<User> {
  const totpHint = resolver.hints.find(
    (hint: any) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
  )

  if (!totpHint) {
    throw new Error("TOTP als zweiter Faktor nicht gefunden")
  }

  // Create TOTP assertion for sign-in
  const totpAssertion = TotpMultiFactorGenerator.assertionForSignIn(totpHint.uid, otp)

  // Complete sign-in with MFA
  const userCredential = await resolver.resolveSignIn(totpAssertion)

  return userCredential.user
}

/**
 * Complete login flow after Firebase sign-in (with or without MFA)
 * Handles email verification check and backend token exchange
 */
export async function completeLoginFlow(user: User): Promise<void> {
  try {
    // Reload user to get latest email verification status
    await user.reload()

    // Check email verification - must be verified before proceeding
    if (!user.emailVerified) {
      // User needs to verify email - will be handled by guard/redirect
      throw new Error("EMAIL_NOT_VERIFIED")
    }

    // Get fresh ID token (force refresh to ensure latest claims)
    const idToken = await getIdToken(user, true)

    // Exchange Firebase token for our JWT token via /auth/firebase-login
    const result = await formApiFetch<LoginResponse>("/auth/firebase-login", {
      method: "POST",
      body: JSON.stringify({ idToken }),
      credentials: "include", // Important: receive refresh cookie
    })

    setAccessToken(result.accessToken)
  } catch (error: any) {
    console.error("❌ Complete login flow error:", {
      code: error.code,
      message: error.message,
    })
    
    // Re-throw EMAIL_NOT_VERIFIED so it can be handled by caller
    if (error.message === "EMAIL_NOT_VERIFIED") {
      throw error
    }
    
    // Handle backend errors from formApiFetch (which throws Error with message like "Form API error 403: ...")
    const errorMessage = error?.message || ""
    
    if (errorMessage.includes("403") || errorMessage.includes("Email not verified")) {
      throw new Error("EMAIL_NOT_VERIFIED")
    } else if (errorMessage.includes("401")) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Ungültige Anmeldedaten oder Token ungültig",
        variant: "destructive",
      })
    } else if (errorMessage.includes("Form API error")) {
      // Extract status code from error message
      const statusMatch = errorMessage.match(/Form API error (\d+)/)
      const status = statusMatch ? parseInt(statusMatch[1]) : null
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: status ? `Server-Fehler (${status})` : errorMessage,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: errorMessage || "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive",
      })
    }
    
    throw error
  }
}

/**
 * Send email verification to current user
 */
export async function sendVerificationEmail(): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    throw new Error("Not authenticated")
  }

  try {
    await sendEmailVerification(user)
  } catch (error: any) {
    if (error.code === "auth/too-many-requests") {
      throw new Error("Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.")
    }
    throw error
  }
}

/**
 * Re-authenticate user with password (required for MFA enrollment)
 */
export async function reauthenticateUser(email: string, password: string): Promise<void> {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error("Not authenticated")
  }

  const credential = EmailAuthProvider.credential(email, password)
  await reauthenticateWithCredential(user, credential)
}
