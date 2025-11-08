"use client"

import { useState, useMemo } from "react"
import { Search, Filter, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useEmployees } from "@/hooks/useEmployees"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

type DepartmentOption = {
  label: string
  value: string
}

const departmentOptions: DepartmentOption[] = [
  { label: "Alle Abteilungen", value: "ALL" },
  { label: "Technik", value: "Technik" },
  { label: "Vertrieb", value: "Vertrieb" },
  { label: "Verwaltung", value: "Verwaltung" },
]

export default function MitarbeiterUebersicht() {
  const router = useRouter()
  const [suchbegriff, setSuchbegriff] = useState("")
  const [abteilungFilter, setAbteilungFilter] = useState<string>("ALL")

  const { data, isLoading, isError } = useEmployees({
    page: 0,
    size: 50,
    q: suchbegriff.trim() ? suchbegriff.trim() : undefined,
    department: abteilungFilter === "ALL" ? undefined : abteilungFilter,
    status: "ACTIVE",
  })

  const employees = data?.content ?? []

  const departmentValue = useMemo(
    () => departmentOptions.find((item) => item.value === abteilungFilter)?.value ?? "ALL",
    [abteilungFilter],
  )

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
          <Select value={departmentValue} onValueChange={setAbteilungFilter}>
            <SelectTrigger className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4 text-montron-contrast dark:text-montron-extra" />
                <SelectValue placeholder="Abteilung" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-montron-text dark:border-montron-contrast/50">
              {departmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="dark:text-white">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
          <Spinner className="h-4 w-4" />
          <span>Lade Mitarbeiter…</span>
        </div>
      ) : isError ? (
        <div className="text-sm text-red-500">Fehler beim Laden der Mitarbeiter. Bitte versuche es erneut.</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-montron-contrast dark:text-montron-extra">Keine Mitarbeiter gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((employee) => {
            const displayName = `${employee.lastName?.toUpperCase() ?? ""} ${
              employee.firstName ? employee.firstName[0]?.toUpperCase() + "." : ""
            }`

            return (
              <button
                key={employee.id}
                className="group rounded-xl border border-montron-contrast/20 bg-card p-4 text-left transition hover:border-montron-primary hover:shadow-md dark:border-montron-contrast/50 dark:bg-montron-text"
                onClick={() => router.push(`/mitarbeiter/${employee.id}/datumsauswahl`)}
              >
                <Card className="border-0 shadow-none bg-transparent">
                  <CardContent className="p-0 flex items-center">
                    <div className="mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-montron-extra dark:bg-montron-contrast/20">
                      <User className="h-6 w-6 text-montron-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-montron-text dark:text-white">{displayName}</h3>
                      <p className="text-sm text-montron-contrast dark:text-montron-extra">
                        {employee.department ?? "Keine Abteilung"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

