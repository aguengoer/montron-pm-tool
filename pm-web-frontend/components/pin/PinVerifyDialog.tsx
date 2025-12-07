"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PinInput } from "./PinInput"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Lock } from "lucide-react"
import { useVerifyPin } from "@/hooks/usePin"
import { PinLockedError } from "@/lib/api/pin"
import { formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"

interface PinVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (pin: string) => void
  title?: string
  description?: string
}

/**
 * Dialog for verifying user PIN (e.g., before release)
 */
export function PinVerifyDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Freigabe bestätigen",
  description = "Geben Sie Ihren 4-stelligen PIN ein, um die Freigabe zu bestätigen.",
}: PinVerifyDialogProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)

  const verifyMutation = useVerifyPin()

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPin("")
      setError(null)
      setLockedUntil(null)
    }
  }, [open])

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !verifyMutation.isPending) {
      handleVerify()
    }
  }, [pin])

  const handleVerify = async () => {
    if (pin.length !== 4) return

    setError(null)

    try {
      await verifyMutation.mutateAsync(pin)
      // Success!
      onSuccess(pin)
      handleClose()
    } catch (err) {
      if (err instanceof PinLockedError) {
        setLockedUntil(new Date(err.lockedUntil))
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : "PIN-Überprüfung fehlgeschlagen")
      }
      setPin("") // Clear PIN on error for retry
    }
  }

  const handleClose = () => {
    setPin("")
    setError(null)
    setLockedUntil(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="pin">PIN eingeben</Label>
            <PinInput
              value={pin}
              onChange={setPin}
              disabled={verifyMutation.isPending || !!lockedUntil}
              autoFocus
              error={!!error}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              {lockedUntil ? (
                <Lock className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {error}
                {lockedUntil && (
                  <div className="mt-1 text-xs">
                    Entsperrt{" "}
                    {formatDistanceToNow(lockedUntil, {
                      addSuffix: true,
                      locale: de,
                    })}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Info */}
          {!error && (
            <div className="text-xs text-muted-foreground">
              {verifyMutation.isPending
                ? "Überprüfe PIN..."
                : "PIN wird automatisch überprüft, wenn Sie alle 4 Ziffern eingegeben haben."}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

