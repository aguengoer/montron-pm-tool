"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { 
  multiFactor, 
  TotpMultiFactorGenerator,
  getAuth,
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MfaSetupDialog({ open, onOpenChange, onSuccess }: MfaSetupDialogProps) {
  const [step, setStep] = useState<"generate" | "verify">("generate");
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("generate");
      setTotpSecret(null);
      setQrCodeUrl(null);
      setVerificationCode("");
      setDisplayName("TOTP Authenticator");
      setError(null);
    }
  }, [open]);

  const handleGenerateSecret = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("Nicht angemeldet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const multiFactorUser = multiFactor(user);
      
      // Get session first, then generate TOTP secret
      const session = await multiFactorUser.getSession();
      const totpSecret = TotpMultiFactorGenerator.generateSecret(session);

      setTotpSecret(totpSecret);

      // Generate QR code URL
      // Format: otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}
      const issuer = "Montron Solutions";
      const email = user.email || "";
      const qrUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
      
      // Use QR code API to generate image
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`);
      
      setStep("verify");
    } catch (err: any) {
      console.error("Error generating TOTP secret:", err);
      setError(err.message || "Fehler beim Generieren des TOTP-Secrets");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerifyAndEnroll = useCallback(async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Bitte geben Sie einen 6-stelligen Code ein");
      return;
    }

    const user = auth.currentUser;
    if (!user || !totpSecret) {
      setError("Fehler: User oder Secret nicht gefunden");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const multiFactorUser = multiFactor(user);

      // Create TOTP assertion for enrollment
      const totpAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      // Enroll the TOTP as a second factor
      await multiFactorUser.enroll(totpAssertion, displayName || "TOTP Authenticator");

      setError(null);
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error enrolling TOTP:", err);
      if (err.code === "auth/invalid-verification-code") {
        setError("Ungültiger Verifizierungscode. Bitte versuchen Sie es erneut.");
      } else {
        setError(err.message || "Fehler beim Aktivieren der 2FA");
      }
    } finally {
      setLoading(false);
    }
  }, [verificationCode, totpSecret, displayName, onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2-Faktor-Authentifizierung einrichten
          </DialogTitle>
          <DialogDescription>
            Schützen Sie Ihr Konto mit einer zusätzlichen Sicherheitsebene.
          </DialogDescription>
        </DialogHeader>

        {step === "generate" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Scannen Sie den QR-Code mit einer Authenticator-App (z.B. Google Authenticator, Authy).
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Anzeigename (optional)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="z.B. TOTP Authenticator"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                onClick={handleGenerateSecret}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Generiere QR-Code...
                  </>
                ) : (
                  "QR-Code generieren"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "verify" && totpSecret && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              {qrCodeUrl && (
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <img src={qrCodeUrl} alt="TOTP QR Code" className="w-48 h-48" />
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("generate")}
                disabled={loading}
              >
                Zurück
              </Button>
              <Button
                onClick={handleVerifyAndEnroll}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Aktiviere...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aktivieren
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
