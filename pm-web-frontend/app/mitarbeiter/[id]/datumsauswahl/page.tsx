"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, FileText, ClipboardList, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

// Beispieldaten für Mitarbeiter
const mitarbeiter = {
  1: { id: 1, nachname: "MEIER", vorname: "Michael", abteilung: "Technik" },
  2: { id: 2, nachname: "SCHMIDT", vorname: "Sarah", abteilung: "Vertrieb" },
}

// Beispieldaten für Berichte
const berichte = [
  { datum: "2024-03-01", tagesberichte: 1, regiescheine: 2, streetwatch: true, status: "Freigegeben" },
  { datum: "2024-03-02", tagesberichte: 1, regiescheine: 1, streetwatch: true, status: "Freigegeben" },
  { datum: "2024-03-04", tagesberichte: 1, regiescheine: 0, streetwatch: true, status: "In Prüfung" },
  { datum: "2024-03-05", tagesberichte: 1, regiescheine: 3, streetwatch: true, status: "Freigegeben" },
  { datum: "2024-03-07", tagesberichte: 1, regiescheine: 1, streetwatch: false, status: "In Prüfung" },
  { datum: "2024-03-08", tagesberichte: 1, regiescheine: 2, streetwatch: true, status: "Freigegeben" },
]

export default function Datumsauswahl({ params }: { params: { id: string } }) {
  const router = useRouter()
  const mitarbeiterId = Number.parseInt(params.id)
  const mitarbeiterData = mitarbeiter[mitarbeiterId]

  const [vonDatum, setVonDatum] = useState<Date | undefined>(new Date(2024, 2, 1)) // März 1, 2024
  const [bisDatum, setBisDatum] = useState<Date | undefined>(new Date(2024, 2, 10)) // März 10, 2024

  // Filtern der Berichte basierend auf dem Datumsbereich
  const filteredBerichte = berichte.filter((bericht) => {
    const berichtDatum = new Date(bericht.datum)
    return (!vonDatum || berichtDatum >= vonDatum) && (!bisDatum || berichtDatum <= bisDatum)
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-montron-text dark:text-white">
        {mitarbeiterData?.nachname} {mitarbeiterData?.vorname} – DATUMSAUSWAHL
      </h1>

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
                {vonDatum ? format(vonDatum, "dd.MM.yyyy", { locale: de }) : <span>Datum auswählen</span>}
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
                {bisDatum ? format(bisDatum, "dd.MM.yyyy", { locale: de }) : <span>Datum auswählen</span>}
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

        <Button className="self-end bg-montron-primary hover:bg-montron-primary/90">Filtern</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBerichte.map((bericht) => (
          <Card
            key={bericht.datum}
            className="hover:shadow-md transition-shadow border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text"
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-montron-text dark:text-white">
                  {format(new Date(bericht.datum), "EEEE, dd.MM.yyyy", { locale: de })}
                </h3>
                <Badge
                  variant={bericht.status === "Freigegeben" ? "default" : "outline"}
                  className={
                    bericht.status === "Freigegeben"
                      ? "bg-montron-primary"
                      : "border-montron-contrast/30 text-montron-contrast dark:text-montron-extra dark:border-montron-contrast/50"
                  }
                >
                  {bericht.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-montron-primary" />
                  <span className="text-montron-text dark:text-white">Tagesberichte: {bericht.tagesberichte}</span>
                </div>
                <div className="flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2 text-montron-primary" />
                  <span className="text-montron-text dark:text-white">Regiescheine: {bericht.regiescheine}</span>
                </div>
                {bericht.streetwatch && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-montron-primary" />
                    <span className="text-montron-text dark:text-white">Streetwatch-Daten vorhanden</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button
                variant="outline"
                className="w-full border-montron-contrast/30 hover:text-montron-primary hover:bg-montron-extra dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
                onClick={() => router.push(`/mitarbeiter/${mitarbeiterId}/tagesdetail/${bericht.datum}`)}
              >
                Details anzeigen
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredBerichte.length === 0 && (
        <div className="text-center py-12">
          <p className="text-montron-contrast dark:text-montron-extra">
            Keine Berichte im ausgewählten Zeitraum gefunden.
          </p>
        </div>
      )}
    </div>
  )
}

