"use client"

import { useState } from "react"
import { Search, Filter, User } from "lucide-react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

// Beispieldaten für Mitarbeiter
const mitarbeiter = [
  { id: 1, nachname: "MEIER", vorname: "Michael", abteilung: "Technik" },
  { id: 2, nachname: "SCHMIDT", vorname: "Sarah", abteilung: "Vertrieb" },
  { id: 3, nachname: "MÜLLER", vorname: "Thomas", abteilung: "Technik" },
  { id: 4, nachname: "WAGNER", vorname: "Anna", abteilung: "Verwaltung" },
  { id: 5, nachname: "BECKER", vorname: "Klaus", abteilung: "Technik" },
  { id: 6, nachname: "HOFFMANN", vorname: "Julia", abteilung: "Vertrieb" },
  { id: 7, nachname: "SCHULZ", vorname: "Peter", abteilung: "Verwaltung" },
  { id: 8, nachname: "KOCH", vorname: "Lisa", abteilung: "Technik" },
]

export default function MitarbeiterUebersicht() {
  const [suchbegriff, setSuchbegriff] = useState("")
  const [abteilungFilter, setAbteilungFilter] = useState("")

  // Filtern der Mitarbeiter basierend auf Suchbegriff und Abteilung
  const filteredMitarbeiter = mitarbeiter.filter((ma) => {
    const matchesSearch =
      ma.nachname.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      ma.vorname.toLowerCase().includes(suchbegriff.toLowerCase())

    const matchesAbteilung = abteilungFilter === "" || ma.abteilung === abteilungFilter

    return matchesSearch && matchesAbteilung
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-montron-text dark:text-white">MITARBEITERÜBERSICHT</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-montron-contrast dark:text-montron-extra" />
          <Input
            placeholder="Suche nach Mitarbeiter..."
            className="pl-10 border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
          />
        </div>

        <div className="w-full md:w-64">
          <Select value={abteilungFilter} onValueChange={setAbteilungFilter}>
            <SelectTrigger className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                <SelectValue placeholder="Abteilung" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-montron-text dark:border-montron-contrast/50">
              <SelectItem value="alle" className="dark:text-white">
                Alle Abteilungen
              </SelectItem>
              <SelectItem value="Technik" className="dark:text-white">
                Technik
              </SelectItem>
              <SelectItem value="Vertrieb" className="dark:text-white">
                Vertrieb
              </SelectItem>
              <SelectItem value="Verwaltung" className="dark:text-white">
                Verwaltung
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMitarbeiter.map((ma) => (
          <Link key={ma.id} href={`/mitarbeiter/${ma.id}/datumsauswahl`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-montron-contrast/20 hover:border-montron-primary dark:bg-montron-text dark:border-montron-contrast/50 dark:hover:border-montron-primary">
              <CardContent className="p-4 flex items-center">
                <div className="mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-montron-extra dark:bg-montron-contrast/20">
                  <User className="h-6 w-6 text-montron-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-montron-text dark:text-white">
                    {ma.nachname} {ma.vorname.charAt(0)}.
                  </h3>
                  <p className="text-sm text-montron-contrast dark:text-montron-extra">{ma.abteilung}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredMitarbeiter.length === 0 && (
        <div className="text-center py-12">
          <p className="text-montron-contrast dark:text-montron-extra">Keine Mitarbeiter gefunden.</p>
        </div>
      )}
    </div>
  )
}

