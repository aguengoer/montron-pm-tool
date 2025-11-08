"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  FileText,
  ClipboardList,
  MapPin,
  Check,
  Edit2,
  FileOutput,
  ArrowLeft,
  Info,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { useWorkdayDetail } from "@/hooks/useWorkdayDetail"
import { useWorkdayLayout } from "@/hooks/useWorkdayLayout"
import type { LayoutFieldConfig, TbDto, RsDto, StreetwatchEntryDto } from "@/lib/workdayTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function formatDate(dateIso: string) {
  try {
    return format(new Date(dateIso), "EEEE, dd.MM.yyyy", { locale: de })
  } catch {
    return dateIso
  }
}

function toDisplayValue(value: unknown) {
  if (value === null || value === undefined) return "–"
  if (typeof value === "boolean") return value ? "Ja" : "Nein"
  return String(value)
}

function getTbFieldValue(tb: TbDto | null, key: string): unknown {
  if (!tb) return null
  switch (key) {
    case "startTime":
      return tb.startTime
    case "endTime":
      return tb.endTime
    case "breakMinutes":
      return tb.breakMinutes
    case "travelMinutes":
      return tb.travelMinutes
    case "licensePlate":
      return tb.licensePlate
    case "department":
      return tb.department
    case "overnight":
      return tb.overnight
    case "kmStart":
      return tb.kmStart
    case "kmEnd":
      return tb.kmEnd
    case "comment":
      return tb.comment
    default:
      return tb.extra ? (tb.extra as Record<string, unknown>)[key] : null
  }
}

function getRsFieldValue(rs: RsDto | null, key: string): unknown {
  if (!rs) return null
  switch (key) {
    case "customerName":
      return rs.customerName
    case "customerId":
      return rs.customerId
    case "startTime":
      return rs.startTime
    case "endTime":
      return rs.endTime
    case "breakMinutes":
      return rs.breakMinutes
    default:
      return null
  }
}

function getStreetwatchCell(entry: StreetwatchEntryDto, key: string): unknown {
  switch (key) {
    case "time":
      return entry.time
    case "km":
      return entry.km
    case "lat":
      return entry.lat
    case "lon":
      return entry.lon
    default:
      return null
  }
}

export default function TagesdetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string; datum: string }>()
  const employeeId = params?.id ?? ""
  const workdayId = params?.datum ?? ""

  const [editMode, setEditMode] = useState(false)

  const {
    data: detail,
    isLoading,
    isError,
  } = useWorkdayDetail(workdayId)
  const { data: layout } = useWorkdayLayout()

  const tb = detail?.tb ?? null
  const rs = detail?.rs ?? null
  const streetwatch = detail?.streetwatch ?? null

  const tbFields = useMemo(() => {
    const fields = layout?.config.tbFields ?? []
    return fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  const rsFields = useMemo(() => {
    const fields = layout?.config.rsFields ?? []
    return fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  const streetwatchColumns = useMemo(() => {
    const columns = layout?.config.streetwatchColumns ?? []
    return columns.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  const handleToggleEdit = () => {
    setEditMode((prev) => !prev)
  }

  const handlePdfExport = () => {
    if (!detail) return
    const employeeName = `${detail.employee.lastName ?? ""}_${detail.employee.firstName ?? ""}`.replace(/\s+/g, "_")
    alert(`PDFs werden generiert: TB_${detail.date}_${employeeName}.pdf`)
  }

  const handleRelease = () => {
    alert("Freigabe erfolgt (nur UI, keine API in diesem Schritt)")
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-2 text-montron-contrast dark:text-montron-extra">
          <Spinner className="h-4 w-4" />
          <span>Lade Tagesdetails…</span>
        </div>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-sm text-red-500">Fehler beim Laden der Tagesdetails.</div>
      </div>
    )
  }

  const formattedDate = formatDate(detail.date)
  const employeeName = `${(detail.employee.lastName ?? "").toUpperCase()} ${detail.employee.firstName ?? ""}`.trim()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
            onClick={() => router.push(`/mitarbeiter/${employeeId}/datumsauswahl`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-montron-text dark:text-white ml-4">
            {employeeName} – {formattedDate}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleToggleEdit}
            className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
          >
            {editMode ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Änderungen speichern
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4 mr-2" />
                Bearbeiten
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handlePdfExport}
            className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
          >
            <FileOutput className="h-4 w-4 mr-2" />
            PDF generieren
          </Button>

          <Button onClick={handleRelease} className="bg-montron-primary hover:bg-montron-primary/90">
            <Check className="h-4 w-4 mr-2" />
            Freigeben
          </Button>
        </div>
      </div>

      <Alert className="mb-6 border-montron-primary/20 bg-montron-extra dark:bg-montron-contrast/20 dark:border-montron-primary/30">
        <Info className="h-4 w-4 text-montron-primary" />
        <AlertDescription className="text-montron-text dark:text-white">
          Alte Werte werden (später) bei Bearbeitung durchgestrichen angezeigt. Aktuell nur Leseansicht.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <FileText className="h-5 w-5 mr-2 text-montron-primary" />
              TAGESBERICHT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tbFields.length === 0 && <div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Layout für TB konfiguriert.</div>}
              {tbFields.map((field) => {
                const value = getTbFieldValue(tb, field.key)
                return (
                  <div key={field.key} className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-montron-contrast dark:text-montron-extra">{field.label}</Label>
                    </div>
                    <div className="text-sm text-montron-text dark:text-white">{toDisplayValue(value)}</div>
                    {editMode && <Separator className="bg-montron-contrast/10 dark:bg-montron-contrast/40" />}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <ClipboardList className="h-5 w-5 mr-2 text-montron-primary" />
              REGIESCHEINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rs ? (
              <div className="space-y-4">
                {rsFields.length === 0 && (
                  <div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Layout für RS konfiguriert.</div>
                )}
                {rsFields.map((field) => {
                  const value = getRsFieldValue(rs, field.key)
                  return (
                    <div key={field.key} className="grid gap-2">
                      <Label className="text-xs font-medium text-montron-contrast dark:text-montron-extra">
                        {field.label}
                      </Label>
                      <div className="text-sm text-montron-text dark:text-white">{toDisplayValue(value)}</div>
                    </div>
                  )
                })}

                {rs.positions && rs.positions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-montron-text dark:text-white">Positionen</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                          <TableHead className="w-[120px] text-montron-text dark:text-white">Code</TableHead>
                          <TableHead className="text-montron-text dark:text-white">Beschreibung</TableHead>
                          <TableHead className="text-right text-montron-text dark:text-white">Stunden</TableHead>
                          <TableHead className="text-right text-montron-text dark:text-white">Menge</TableHead>
                          <TableHead className="text-right text-montron-text dark:text-white">Preis</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rs.positions.map((pos, idx) => (
                          <TableRow key={idx} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                            <TableCell className="text-montron-text dark:text-white">{pos.code ?? "–"}</TableCell>
                            <TableCell className="text-montron-text dark:text-white">{pos.description ?? "–"}</TableCell>
                            <TableCell className="text-right text-montron-text dark:text-white">{pos.hours ?? "–"}</TableCell>
                            <TableCell className="text-right text-montron-text dark:text-white">
                              {pos.quantity ? `${pos.quantity} ${pos.unit ?? ""}` : "–"}
                            </TableCell>
                            <TableCell className="text-right text-montron-text dark:text-white">
                              {pos.pricePerUnit ?? "–"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Regieschein vorhanden.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <MapPin className="h-5 w-5 mr-2 text-montron-primary" />
              STREETWATCH
            </CardTitle>
          </CardHeader>
          <CardContent>
            {streetwatch && streetwatch.entries && streetwatch.entries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                    {streetwatchColumns.map((column) => (
                      <TableHead key={column.key} className="text-montron-text dark:text-white">
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {streetwatch.entries.map((entry, idx) => (
                    <TableRow key={idx} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                      {streetwatchColumns.map((column) => (
                        <TableCell key={column.key} className="text-montron-text dark:text-white">
                          {toDisplayValue(getStreetwatchCell(entry, column.key))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-xs text-montron-contrast dark:text-montron-extra">Keine Streetwatch-Daten verfügbar.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

