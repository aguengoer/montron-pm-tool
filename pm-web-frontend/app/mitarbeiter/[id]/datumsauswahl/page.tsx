"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, FileText, ClipboardList, MapPin, ArrowLeft } from "lucide-react"

import { useEmployee } from "@/hooks/useEmployee"
import { useEmployeeWorkdays } from "@/hooks/useEmployeeWorkdays"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

function formatDateRange(value: Date | null | undefined) {
  return value ? format(value, "dd.MM.yyyy", { locale: de }) : "Datum auswählen"
}

function toIsoDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : ""
}

function getStatusLabel(status: string | undefined) {
  switch (status) {
    case "RELEASED":
      return "Freigegeben"
    case "READY":
      return "In Prüfung"
    case "DRAFT":
    default:
      return "Entwurf"
  }
}

export default function DatumsauswahlPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const employeeId = params?.id ?? ""

  const today = useMemo(() => new Date(), [])
  const initialFrom = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date
  }, [])

  const [vonDatum, setVonDatum] = useState<Date | undefined>(initialFrom)
  const [bisDatum, setBisDatum] = useState<Date | undefined>(today)

  const fromIso = toIsoDate(vonDatum)
  const toIso = toIsoDate(bisDatum)

  const { data: employee } = useEmployee(employeeId)
  const {
    data: workdays,
    isLoading,
    isError,
    refetch,
  } = useEmployeeWorkdays({ employeeId, from: fromIso, to: toIso })

  const headerTitle = useMemo(() => {
    if (!employee) {
      return "Mitarbeiter – DATUMSAUSWAHL"
    }
    const lastName = employee.lastName ? employee.lastName.toUpperCase() : ""
    return `${lastName} ${employee.firstName ?? ""}`.trim() + " – DATUMSAUSWAHL"
  }, [employee])

  const handleFilterClick = () => {
    refetch()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6 border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader className="flex flex-row items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-montron-contrast/30 text-montron-contrast dark:text-montron-extra dark:border-montron-contrast/50"
            onClick={() => router.push("/mitarbeiter")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Zurück</span>
          </Button>
          <h1 className="text-3xl font-bold text-montron-text dark:text-white">{headerTitle}</h1>
        </CardHeader>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-1 text-montron-text dark:text-white">Von-Datum</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[200px] justify-start text-left border-montron-contrast/30 dark:border-montron-contrast/50 dark:text-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                {formatDateRange(vonDatum ?? null)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 dark:bg-montron-text dark:border-montron-contrast/50">
              <Calendar
                mode="single"
                selected={vonDatum}
                onSelect={setVonDatum}
                initialFocus
                className="dark:bg-montron-text"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-montron-text dark:text-white">Bis-Datum</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-[200px] justify-start text-left border-montron-contrast/30 dark:border-montron-contrast/50 dark:text-white"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                {formatDateRange(bisDatum ?? null)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 dark:bg-montron-text dark:border-montron-contrast/50">
              <Calendar
                mode="single"
                selected={bisDatum}
                onSelect={setBisDatum}
                initialFocus
                className="dark:bg-montron-text"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button className="self-end bg-montron-primary hover:bg-montron-primary/90" onClick={handleFilterClick}>
          Filtern
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
          <Spinner className="h-4 w-4" />
          <span>Lade Berichte…</span>
        </div>
      ) : isError ? (
        <div className="text-sm text-red-500">Fehler beim Laden der Berichte. Bitte versuche es erneut.</div>
      ) : workdays && workdays.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workdays.map((workday) => {
            const statusLabel = getStatusLabel(workday.status)
            const isReleased = workday.status === "RELEASED"

            return (
              <Card
                key={workday.id}
                className="hover:shadow-md transition-shadow border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-montron-text dark:text-white">
                      {format(new Date(workday.date), "EEEE, dd.MM.yyyy", { locale: de })}
                    </h3>
                    <Badge
                      variant={isReleased ? "default" : "outline"}
                      className={
                        isReleased
                          ? "bg-montron-primary"
                          : "border-montron-contrast/30 text-montron-contrast dark:text-montron-extra dark:border-montron-contrast/50"
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <FileText className={`h-4 w-4 ${workday.hasTb ? "text-montron-primary" : "text-montron-contrast/60"}`} />
                      {workday.hasTb ? "Tagesbericht vorhanden" : "Kein Tagesbericht"}
                    </div>
                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <ClipboardList
                        className={`h-4 w-4 ${workday.hasRs ? "text-montron-primary" : "text-montron-contrast/60"}`}
                      />
                      {workday.hasRs ? "Regieschein vorhanden" : "Kein Regieschein"}
                    </div>
                    <div className="flex items-center gap-2 text-montron-text dark:text-white">
                      <MapPin className={`h-4 w-4 ${workday.hasStreetwatch ? "text-montron-primary" : "text-montron-contrast/60"}`} />
                      {workday.hasStreetwatch ? "Streetwatch-Daten vorhanden" : "Keine Streetwatch-Daten"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    variant="outline"
                    className="w-full border-montron-contrast/30 hover:text-montron-primary hover:bg-montron-extra dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
                    onClick={() => router.push(`/mitarbeiter/${employeeId}/tagesdetail/${workday.id}`)}
                  >
                    Details anzeigen
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-montron-contrast dark:text-montron-extra">
            Keine Berichte im ausgewählten Zeitraum gefunden.
          </p>
        </div>
      )}
    </div>
  )
}

