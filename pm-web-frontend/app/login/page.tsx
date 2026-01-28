"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { beginSignIn, completeTotpSignIn, completeLoginFlow } from "@/services/auth";
import { MfaVerifyDialog } from "@/components/mfa/MfaVerifyDialog";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setMfaError(null);

    try {
      // Step 1: Begin sign-in (email/password)
      const result = await beginSignIn(email, password);

      if (result.type === "MFA_REQUIRED") {
        // MFA required - show dialog
        setMfaResolver(result.resolver);
        setMfaDialogOpen(true);
        setIsLoginLoading(false);
        return;
      }

      // Step 2: Complete login flow (email verification check + backend token exchange)
      await completeLoginFlow(result.userCredential.user);

      // Login successful
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen im PM Tool!",
      });
      
      router.push("/mitarbeiter");
    } catch (error: any) {
      console.error("Login error:", error);
      // Handle email not verified
      if (error.message === "EMAIL_NOT_VERIFIED") {
        router.push("/security/verify-email");
        return;
      }
      // Error handling (toast) is done in beginSignIn for Firebase errors
      // If we get here, it might be a different error, so show a generic message
      if (!error.code?.startsWith("auth/")) {
        toast({
          title: "Anmeldung fehlgeschlagen",
          description: error.message || "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleMfaVerify = async (code: string) => {
    if (!mfaResolver) return;

    setMfaLoading(true);
    setMfaError(null);

    try {
      // Complete TOTP sign-in
      const user = await completeTotpSignIn(mfaResolver, code);
      
      // Complete login flow (email verification check + backend token exchange)
      await completeLoginFlow(user);
      
      setMfaDialogOpen(false);
      setMfaResolver(null);
      
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen im PM Tool!",
      });
      
      router.push("/mitarbeiter");
    } catch (error: any) {
      // Handle email not verified
      if (error.message === "EMAIL_NOT_VERIFIED") {
        setMfaDialogOpen(false);
        setMfaResolver(null);
        router.push("/security/verify-email");
        return;
      }
      
      if (error.code === "auth/invalid-verification-code") {
        setMfaError("Ungültiger Verifizierungscode. Bitte versuchen Sie es erneut.");
      } else if (error.code === "auth/code-expired") {
        setMfaError("Der Verifizierungscode ist abgelaufen. Bitte versuchen Sie es erneut.");
      } else {
        setMfaError(error.message || "Ungültiger Verifizierungscode");
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaDialogClose = (open: boolean) => {
    if (!open) {
      setMfaResolver(null);
      setMfaError(null);
      setMfaDialogOpen(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-montron-contrast dark:text-montron-extra">
              Anmeldung
            </CardTitle>
            <CardDescription>
              Bitte melden Sie sich mit Ihrer E-Mail-Adresse an.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isLoginLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoginLoading}>
                {isLoginLoading ? <Spinner className="mr-2" /> : null}
                {isLoginLoading ? "Wird angemeldet..." : "Anmelden"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <MfaVerifyDialog
        open={mfaDialogOpen}
        onOpenChange={handleMfaDialogClose}
        onVerify={handleMfaVerify}
        loading={mfaLoading}
        error={mfaError}
      />
    </>
  );
}
