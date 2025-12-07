"use client"

import { useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, Save, CheckCircle, AlertCircle, Download } from "lucide-react"

import { useTagesdetail, useUpdateSubmission } from "@/hooks/useTagesdetail"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DynamicFormRenderer } from "@/components/tagesdetail/DynamicFormRenderer"
import { StreetwatchTable } from "@/components/tagesdetail/StreetwatchTable"
import { ValidationPanel } from "@/components/tagesdetail/ValidationPanel"
import { ValidationIssue } from "@/types/tagesdetail"
import { useToast } from "@/hooks/use-toast"

export default function TagesdetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string; datum: string }>()
  const employeeId = params?.id ?? ""
  const dateString = params?.datum ?? "" // YYYY-MM-DD
  const { toast } = useToast()

  const { data: tagesdetail, isLoading, isError, refetch } = useTagesdetail(employeeId, dateString)
  const updateMutation = useUpdateSubmission()

  // Track edit mode and changes
  const [isEditMode, setIsEditMode] = useState(false)
  const [changes, setChanges] = useState<Record<string, Record<string, any>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const formattedDate = dateString
    ? format(new Date(dateString), "EEEE, dd.MM.yyyy", { locale: de })
    : ""

  const hasUnsavedChanges = Object.keys(changes).length > 0

  const handleFieldChange = useCallback((submissionId: string, fieldId: string, value: any) => {
    setChanges((prev) => ({
      ...prev,
      [submissionId]: {
        ...(prev[submissionId] || {}),
        [fieldId]: value,
      },
    }))
  }, [])

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast({
        title: "Keine Änderungen",
        description: "Es gibt keine ungespeicherten Änderungen.",
      })
      return
    }

    setIsSaving(true)
    try {
      // Save all changes
      for (const [submissionId, fields] of Object.entries(changes)) {
        for (const [fieldId, value] of Object.entries(fields)) {
          await updateMutation.mutateAsync({ submissionId, fieldId, value })
        }
      }

      // Clear changes and exit edit mode BEFORE refetch
      setChanges({})
      setIsEditMode(false)

      // Refetch data from server (with loading state)
      await refetch()

      toast({
        title: "Gespeichert",
        description: "Alle Änderungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern. Bitte versuche es erneut.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFreigeben = async () => {
    // TODO: Implement approval workflow
    toast({
      title: "Freigabe",
      description: "Freigabe-Funktion wird noch implementiert.",
    })
  }

  const handleIssueClick = useCallback((issue: ValidationIssue) => {
    const element = document.getElementById(issue.fieldId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.focus()
    }
  }, [])

  const handleDiscard = () => {
    setChanges({})
    setIsEditMode(false)
    toast({
      title: "Verworfen",
      description: "Alle Änderungen wurden verworfen.",
    })
  }

  const handleEdit = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setChanges({})
    setIsEditMode(false)
  }

  const handleDownloadPdf = (pdfUrl: string, formName: string) => {
    if (!pdfUrl) {
      toast({
        title: "Fehler",
        description: "PDF-URL nicht verfügbar",
        variant: "destructive",
      })
      return
    }
    
    // Open PDF in new tab (presigned URL allows direct access)
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-[1800px]">
      {/* Header */}
      <Card className="mb-6 border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="border-montron-contrast/30 text-montron-contrast dark:text-montron-extra dark:border-montron-contrast/50 flex-shrink-0"
                onClick={() => router.push(`/mitarbeiter/${employeeId}/datumsauswahl`)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Zurück</span>
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-montron-text dark:text-white">
                  {tagesdetail?.employeeName || "Laden..."}
                </h1>
                <p className="text-base sm:text-lg text-montron-contrast dark:text-montron-extra mt-1">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditMode ? (
                // Edit mode: Show Cancel and Save buttons
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="border-montron-contrast/30 hover:border-red-500 hover:text-red-500"
                    disabled={isSaving || isLoading}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    className="border-montron-contrast/30 hover:text-montron-primary hover:border-montron-primary"
                    disabled={!hasUnsavedChanges || isSaving || isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                    {hasUnsavedChanges && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                        {Object.keys(changes).length}
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                // Read-only mode: Show Edit button
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="border-montron-contrast/30 hover:text-montron-primary hover:border-montron-primary"
                  disabled={isLoading}
                >
                  Bearbeiten
                </Button>
              )}
              
              {/* Freigeben button - ALWAYS VISIBLE */}
              <Button
                onClick={handleFreigeben}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={hasUnsavedChanges || isSaving || isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Freigeben
              </Button>
            </div>
          </div>

          {/* Unsaved changes alert - only in edit mode */}
          {isEditMode && hasUnsavedChanges && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                Du hast ungespeicherte Änderungen. Bitte speichere oder verwerfe sie.
              </AlertDescription>
            </Alert>
          )}

          {/* Old values note - show when there are corrections */}
          {tagesdetail && (tagesdetail.tagesbericht?.hasChanges || tagesdetail.regiescheine.some(rs => rs.hasChanges)) && (
            <div className="mt-4 text-xs text-montron-contrast dark:text-montron-extra italic">
              Korrigierte Felder zeigen den Originalwert durchgestrichen darunter.
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading || isSaving ? (
        <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
          <Spinner className="h-4 w-4" />
          <span>{isSaving ? "Speichere Änderungen…" : "Lade Tagesdetail…"}</span>
        </div>
      ) : isError ? (
        <Card className="border-red-500/50 dark:bg-montron-text">
          <CardContent className="p-8 text-center">
            <p className="text-red-500">
              Fehler beim Laden der Daten. Bitte versuche es erneut.
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : !tagesdetail ? (
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardContent className="p-8 text-center">
            <p className="text-montron-contrast dark:text-montron-extra">
              Keine Daten für diesen Tag gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Tagesbericht */}
          <div className="col-span-1">
            <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-montron-text dark:text-white">
                    📋 Tagesbericht
                  </CardTitle>
                  {tagesdetail.tagesbericht?.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPdf(
                        tagesdetail.tagesbericht!.pdfUrl,
                        tagesdetail.tagesbericht!.formDefinition.name
                      )}
                      className="border-montron-contrast/30 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:border-montron-primary"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tagesdetail.tagesbericht ? (
                  <DynamicFormRenderer
                    formWithSubmission={tagesdetail.tagesbericht}
                    editMode={isEditMode}
                    pendingChanges={changes[tagesdetail.tagesbericht.submissionId] || {}}
                    onFieldChange={(fieldId, value) => {
                      handleFieldChange(tagesdetail.tagesbericht!.submissionId, fieldId, value)
                    }}
                  />
                ) : (
                  <p className="text-sm text-montron-contrast dark:text-montron-extra">
                    Kein Tagesbericht vorhanden
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Regiescheine */}
          <div className="col-span-1">
            <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-montron-text dark:text-white">
                  📄 Regiescheine
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tagesdetail.regiescheine.length > 0 ? (
                  <div className="space-y-6">
                    {tagesdetail.regiescheine.map((rs, idx) => {
                      // Capture variables explicitly to avoid closure issues
                      const pdfUrl = rs.pdfUrl
                      const formName = rs.formDefinition.name
                      const submissionId = rs.submissionId
                      
                      return (
                        <div key={submissionId}>
                          {idx > 0 && (
                            <div className="border-t border-montron-contrast/20 my-4" />
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-medium text-montron-contrast dark:text-montron-extra">
                              Regieschein #{idx + 1}
                            </div>
                            {pdfUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log(`Downloading PDF for Regieschein #${idx + 1}, submissionId: ${submissionId}, URL: ${pdfUrl}`)
                                  handleDownloadPdf(pdfUrl, formName)
                                }}
                                className="border-montron-contrast/30 text-montron-contrast dark:text-montron-extra hover:text-montron-primary hover:border-montron-primary"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                            )}
                          </div>
                          <DynamicFormRenderer
                            formWithSubmission={rs}
                            editMode={isEditMode}
                            pendingChanges={changes[submissionId] || {}}
                            onFieldChange={(fieldId, value) => {
                              handleFieldChange(submissionId, fieldId, value)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-montron-contrast dark:text-montron-extra">
                    Keine Regiescheine vorhanden
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Streetwatch + Prüfhinweise */}
          <div className="col-span-1 space-y-6">
            <StreetwatchTable data={tagesdetail.streetwatch} />
            <ValidationPanel
              issues={tagesdetail.validationIssues}
              onIssueClick={handleIssueClick}
            />
          </div>
        </div>
      )}
    </div>
  )
}
