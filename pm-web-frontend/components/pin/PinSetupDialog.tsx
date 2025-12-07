"use client"

import { useState } from "react"
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
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useSetPin } from "@/hooks/usePin"

interface PinSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Dialog for setting up or changing user PIN
 */
export function PinSetupDialog({ open, onOpenChange, onSuccess }: PinSetupDialogProps) {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setPinMutation = useSetPin()

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (pin.length !== 4) {
      setError("PIN muss genau 4 Ziffern enthalten")
      return
    }

    if (pin !== confirmPin) {
      setError("PINs stimmen nicht überein")
      return
    }

    try {
      await setPinMutation.mutateAsync(pin)
      setSuccess(true)
      
      // Close dialog after short delay
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Setzen des PINs")
    }
  }

  const handleClose = () => {
    setPin("")
    setConfirmPin("")
    setError(null)
    setSuccess(false)
    onOpenChange(false)
  }

  const isValid = pin.length === 4 && confirmPin.length === 4 && pin === confirmPin

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Freigabe-PIN einrichten</DialogTitle>
          <DialogDescription>
            Legen Sie einen 4-stelligen PIN fest, den Sie zur Freigabe von Tagesberichten benötigen.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                PIN erfolgreich gesetzt!
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* PIN Input */}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN eingeben</Label>
              <PinInput
                value={pin}
                onChange={setPin}
                disabled={setPinMutation.isPending}
                autoFocus
                error={!!error && pin.length === 4}
              />
            </div>

            {/* Confirm PIN Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPin">PIN bestätigen</Label>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={setPinMutation.isPending}
                error={!!error && confirmPin.length === 4}
              />
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Security Note */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Hinweis:</strong> Der PIN wird verschlüsselt gespeichert. Nach 3 Fehlversuchen
              wird der PIN für 30 Minuten gesperrt.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={setPinMutation.isPending || success}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || setPinMutation.isPending || success}
          >
            {setPinMutation.isPending ? "Speichern..." : "PIN speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

