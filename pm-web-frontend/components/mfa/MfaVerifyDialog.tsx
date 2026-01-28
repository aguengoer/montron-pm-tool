"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertCircle, Loader2 } from "lucide-react"

interface MfaVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerify: (code: string) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function MfaVerifyDialog({
  open,
  onOpenChange,
  onVerify,
  loading = false,
  error: externalError = null,
}: MfaVerifyDialogProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationCode("")
      setError(null)
    }
  }, [open])

  // Update error when external error changes
  useEffect(() => {
    setError(externalError)
  }, [externalError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (verificationCode.length !== 6) {
      setError("Bitte geben Sie einen 6-stelligen Code ein")
      return
    }

    setError(null)
    try {
      await onVerify(verificationCode)
      // Dialog will be closed by parent on success
    } catch (err: any) {
      setError(err.message || "Ungültiger Verifizierungscode")
    }
  }

  const handleCancel = () => {
    setVerificationCode("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2-Faktor-Authentifizierung erforderlich
          </DialogTitle>
          <DialogDescription>
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein, um den Anmeldevorgang abzuschließen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verifizierungscode</Label>
              <Input
                id="totp-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifizieren...
                  </>
                ) : (
                  "Verifizieren"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
