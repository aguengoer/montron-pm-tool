"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, FileText, Calendar, User, Paperclip } from "lucide-react"

import { useEmployee } from "@/hooks/useEmployee"
import { useEmployeeSubmissions } from "@/hooks/useEmployeeSubmissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"

export default function TagesdetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string; datum: string }>()
  const employeeId = params?.id ?? ""
  const dateString = params?.datum ?? "" // YYYY-MM-DD

  const { data: employee } = useEmployee(employeeId)

  // Fetch submissions for this specific date
  const {
    data: workdays,
    isLoading,
    isError,
  } = useEmployeeSubmissions({
    employeeId,
    from: dateString,
    to: dateString,
  })

  // Find submissions for the selected date
  const submissions = useMemo(() => {
    if (!workdays || workdays.length === 0) return []
    const dayData = workdays.find((w) => w.date === dateString)
    return dayData?.submissions ?? []
  }, [workdays, dateString])

  const headerTitle = useMemo(() => {
    if (!employee) return "Tagesdetail"
    const lastName = employee.lastName ? employee.lastName.toUpperCase() : ""
    return `${lastName} ${employee.firstName ?? ""}`.trim()
  }, [employee])

  const formattedDate = useMemo(() => {
    try {
      return format(new Date(dateString), "EEEE, dd.MM.yyyy", { locale: de })
    } catch {
      return dateString
    }
  }, [dateString])

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <Card className="mb-6 border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader className="flex flex-row items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-montron-contrast/30 text-montron-contrast dark:text-montron-extra dark:border-montron-contrast/50"
            onClick={() => router.push(`/mitarbeiter/${employeeId}/datumsauswahl`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Zurück</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-montron-text dark:text-white">{headerTitle}</h1>
            <p className="text-lg text-montron-contrast dark:text-montron-extra mt-1">{formattedDate}</p>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
          <Spinner className="h-4 w-4" />
          <span>Lade Einträge…</span>
        </div>
      ) : isError ? (
        <div className="text-sm text-red-500">Fehler beim Laden der Einträge. Bitte versuche es erneut.</div>
      ) : submissions.length === 0 ? (
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardContent className="p-8 text-center">
            <p className="text-montron-contrast dark:text-montron-extra">
              Keine Einträge für diesen Tag gefunden.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card
              key={submission.id}
              className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-montron-primary" />
                    <div>
                      <CardTitle className="text-montron-text dark:text-white">{submission.formName}</CardTitle>
                      <p className="text-sm text-montron-contrast dark:text-montron-extra mt-1">
                        Version {submission.formVersion}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-montron-primary">
                    Freigegeben
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Separator className="bg-montron-contrast/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <Calendar className="h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                      <span className="font-medium">Eingereicht:</span>
                      <span>
                        {format(new Date(submission.submittedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <User className="h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                      <span className="font-medium">Mitarbeiter:</span>
                      <span>{submission.employeeUsername}</span>
                    </div>

                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <Paperclip className="h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                      <span className="font-medium">Anhänge:</span>
                      <span>{submission.hasAttachments ? "Ja" : "Nein"}</span>
                    </div>
                  </div>

                  <Separator className="bg-montron-contrast/20" />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-montron-contrast/30 hover:text-montron-primary hover:bg-montron-extra dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
                      onClick={() => {
                        // TODO: Implement detail view for individual submission
                        alert(`Submission ID: ${submission.id}\nForm: ${submission.formName}`)
                      }}
                    >
                      Details anzeigen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
