"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { usePatchTb } from "@/hooks/usePatchTb"
import { usePatchRs } from "@/hooks/usePatchRs"
import type {
  LayoutFieldConfig,
  TbDto,
  RsDto,
  RsPositionDto,
  StreetwatchEntryDto,
  ValidationIssueDto,
} from "@/lib/workdayTypes"
import type { TbPatchRequest } from "@/lib/tbPatchTypes"
import type { RsPatchRequest } from "@/lib/rsPatchTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

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

function positionsAreDifferent(
  originalPositions: RsPositionDto[] | null | undefined,
  draftPositions: RsPositionDto[] | null | undefined,
): boolean {
  const previous = originalPositions ?? []
  const next = draftPositions ?? []

  if (previous.length !== next.length) {
    return true
  }

  return previous.some((orig, index) => {
    const candidate = next[index]
    if (!candidate) {
      return true
    }

    return (
      orig.code !== candidate.code ||
      orig.description !== candidate.description ||
      orig.hours !== candidate.hours ||
      orig.quantity !== candidate.quantity ||
      orig.unit !== candidate.unit ||
      orig.pricePerUnit !== candidate.pricePerUnit
    )
  })
}

function getIssueLocation(fieldRef: string | null | undefined): {
  label: string
  target: "tb" | "rs" | "streetwatch" | "global"
} {
  if (!fieldRef) {
    return { label: "Allgemein", target: "global" }
  }
  if (fieldRef.startsWith("tb.")) {
    return { label: "Tagesbericht", target: "tb" }
  }
  if (fieldRef.startsWith("rs.")) {
    return { label: "Regieschein", target: "rs" }
  }
  if (fieldRef.startsWith("streetwatch")) {
    return { label: "Streetwatch", target: "streetwatch" }
  }
  return { label: "Allgemein", target: "global" }
}

export default function TagesdetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string; datum: string }>()
  const employeeId = params?.id ?? ""
  const workdayId = params?.datum ?? ""

  const [editMode, setEditMode] = useState(false)
  const [tbDraft, setTbDraft] = useState<TbDto | null>(null)
  const [rsDraft, setRsDraft] = useState<RsDto | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rsSaveError, setRsSaveError] = useState<string | null>(null)

  const {
    data: detail,
    isLoading,
    isError,
  } = useWorkdayDetail(workdayId)
  const { data: layout } = useWorkdayLayout()
  const { mutateAsync: patchTb, isPending: isSavingTb } = usePatchTb(workdayId)
  const { mutateAsync: patchRs, isPending: isSavingRs } = usePatchRs(workdayId)

  const tbRef = useRef<HTMLDivElement | null>(null)
  const rsRef = useRef<HTMLDivElement | null>(null)
  const streetwatchRef = useRef<HTMLDivElement | null>(null)

  const tb = detail?.tb ?? null
  const rs = detail?.rs ?? null
  const streetwatch = detail?.streetwatch ?? null
  const validationIssues = detail?.validationIssues ?? []

  const issuesBySeverity = useMemo(() => {
    const errors = validationIssues.filter((issue) => issue.severity === "ERROR")
    const warns = validationIssues.filter((issue) => issue.severity === "WARN")
    return { errors, warns }
  }, [validationIssues])

  const fieldIssuesMap = useMemo(() => {
    const map = new Map<string, { errors: ValidationIssueDto[]; warns: ValidationIssueDto[] }>()
    for (const issue of validationIssues) {
      const ref = issue.fieldRef ?? "_global"
      if (!map.has(ref)) {
        map.set(ref, { errors: [], warns: [] })
      }
      const bucket = map.get(ref)!
      if (issue.severity === "ERROR") {
        bucket.errors.push(issue)
      } else if (issue.severity === "WARN") {
        bucket.warns.push(issue)
      }
    }
    return map
  }, [validationIssues])

  const scrollToIssue = (issue: ValidationIssueDto) => {
    const location = getIssueLocation(issue.fieldRef)
    let ref: typeof tbRef | null = null
    if (location.target === "tb") ref = tbRef
    else if (location.target === "rs") ref = rsRef
    else if (location.target === "streetwatch") ref = streetwatchRef

    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  useEffect(() => {
    if (tb) {
      const extraClone = tb.extra ? { ...tb.extra } : null
      setTbDraft({ ...tb, extra: extraClone })
    } else {
      setTbDraft(null)
    }
  }, [tb])

  useEffect(() => {
    if (rs) {
      const positionsClone = rs.positions ? rs.positions.map((position) => ({ ...position })) : []
      setRsDraft({ ...rs, positions: positionsClone })
    } else {
      setRsDraft(null)
    }
  }, [rs])

  const tbFields = useMemo<LayoutFieldConfig[]>(() => {
    const fields = layout?.config.tbFields ?? []
    return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  const rsFields = useMemo<LayoutFieldConfig[]>(() => {
    const fields = layout?.config.rsFields ?? []
    return [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  const streetwatchColumns = useMemo<LayoutFieldConfig[]>(() => {
    const columns = layout?.config.streetwatchColumns ?? []
    return [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [layout])

  function buildTbPatch(original: TbDto | null, draft: TbDto | null): TbPatchRequest {
    if (!original || !draft) return {}

    const patch: TbPatchRequest = {}

    const maybeAssign = <K extends keyof TbDto, P extends keyof TbPatchRequest>(dtoKey: K, patchKey: P) => {
      const prev = original[dtoKey] as TbPatchRequest[P]
      const next = draft[dtoKey] as TbPatchRequest[P]
      if (prev !== next) {
        patch[patchKey] = next
      }
    }

    maybeAssign("startTime", "startTime")
    maybeAssign("endTime", "endTime")
    maybeAssign("breakMinutes", "breakMinutes")
    maybeAssign("travelMinutes", "travelMinutes")
    maybeAssign("licensePlate", "licensePlate")
    maybeAssign("department", "department")
    maybeAssign("overnight", "overnight")
    maybeAssign("kmStart", "kmStart")
    maybeAssign("kmEnd", "kmEnd")
    maybeAssign("comment", "comment")

    return patch
  }

  function buildRsPatch(original: RsDto | null, draft: RsDto | null): RsPatchRequest {
    if (!original || !draft) return {}

    const patch: RsPatchRequest = {}

    if (original.startTime !== draft.startTime) {
      patch.startTime = draft.startTime ?? null
    }
    if (original.endTime !== draft.endTime) {
      patch.endTime = draft.endTime ?? null
    }
    if (original.breakMinutes !== draft.breakMinutes) {
      patch.breakMinutes = draft.breakMinutes ?? null
    }
    if (original.customerId !== draft.customerId) {
      patch.customerId = draft.customerId ?? null
    }
    if (original.customerName !== draft.customerName) {
      patch.customerName = draft.customerName ?? null
    }

    if (positionsAreDifferent(original.positions, draft.positions)) {
      patch.positions = (draft.positions ?? []).map((position) => ({
        code: position.code ?? null,
        description: position.description ?? null,
        hours: position.hours ?? null,
        quantity: position.quantity ?? null,
        unit: position.unit ?? null,
        pricePerUnit: position.pricePerUnit ?? null,
      }))
    }

    return patch
  }

  const handleEditClick = async () => {
    setSaveError(null)
    setRsSaveError(null)

    if (!tbDraft && tb) {
      const extraClone = tb.extra ? { ...tb.extra } : null
      setTbDraft({ ...tb, extra: extraClone })
    }
    if (!rsDraft && rs) {
      const positionsClone = rs.positions ? rs.positions.map((position) => ({ ...position })) : []
      setRsDraft({ ...rs, positions: positionsClone })
    }

    if (!editMode) {
      setEditMode(true)
      return
    }

    if (!detail?.tb || !tbDraft) {
      setEditMode(false)
      return
    }

    const patch = buildTbPatch(detail.tb, tbDraft)
    if (Object.keys(patch).length === 0) {
      setEditMode(false)
      return
    }

    try {
      await patchTb(patch)
      setEditMode(false)
    } catch (error) {
      console.error("Failed to save TB", error)
      setSaveError("Speichern des Tagesberichts ist fehlgeschlagen.")
    }
  }

  const handleSaveRs = async () => {
    setRsSaveError(null)

    if (!rs || !rsDraft) {
      return
    }

    const patch = buildRsPatch(rs, rsDraft)
    if (Object.keys(patch).length === 0) {
      return
    }

    try {
      await patchRs(patch)
    } catch (error) {
      console.error("Failed to save RS", error)
      setRsSaveError("Speichern des Regiescheins ist fehlgeschlagen.")
    }
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
  const hasTb = Boolean(tbDraft)
  const hasRs = Boolean(rsDraft)
  const rsPositionsChanged = editMode && rs && rsDraft ? positionsAreDifferent(rs.positions, rsDraft.positions) : false
  const errorCount = issuesBySeverity.errors.length
  const warnCount = issuesBySeverity.warns.length
  const streetwatchIssues =
    fieldIssuesMap.get("streetwatch") ||
    fieldIssuesMap.get("streetwatch.entries") ||
    fieldIssuesMap.get("streetwatch.timeRange") ||
    { errors: [], warns: [] }
  const streetwatchHasError = streetwatchIssues.errors.length > 0
  const streetwatchHasWarn = !streetwatchHasError && streetwatchIssues.warns.length > 0
  const rsPositionsIssues = fieldIssuesMap.get("rs.positions")
  const rsPositionsHasErrorIssue = Boolean(rsPositionsIssues?.errors.length)
  const rsPositionsHasWarnIssue = !rsPositionsHasErrorIssue && Boolean(rsPositionsIssues?.warns.length)
  const rsPositionsBorderClass = rsPositionsHasErrorIssue
    ? "border-red-400 dark:border-red-500"
    : rsPositionsHasWarnIssue
    ? "border-amber-400 dark:border-amber-500"
    : "border-transparent"
  const rsPositionsBgClass = rsPositionsHasErrorIssue
    ? "bg-red-50/60 dark:bg-red-900/10"
    : rsPositionsHasWarnIssue
    ? "bg-amber-50/60 dark:bg-amber-900/5"
    : ""

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
              onClick={() => router.push(`/mitarbeiter/${employeeId}/datumsauswahl`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="ml-4 text-3xl font-bold text-montron-text dark:text-white">
              {employeeName} – {formattedDate}
            </h1>
          </div>

          {(errorCount > 0 || warnCount > 0) && (
            <div className="flex flex-wrap items-center gap-2 pl-12">
              {errorCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200">
                  {errorCount} Fehler
                </span>
              )}
              {warnCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  {warnCount} Warnungen
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleEditClick}
            className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
            disabled={(!hasTb && !hasRs) || isSavingTb || isSavingRs}
          >
            {editMode ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isSavingTb ? "Speichern…" : "Änderungen speichern"}
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

      {validationIssues.length > 0 && (
        <Card className="mb-4 border-amber-200/60 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-semibold text-montron-text dark:text-white">
              <Info className="mr-2 h-4 w-4 text-amber-500" />
              Prüfhinweise & Validierungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {validationIssues.map((issue) => {
              const location = getIssueLocation(issue.fieldRef)
              const isError = issue.severity === "ERROR"
              const severityLabel = isError ? "Fehler" : "Warnung"

              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => scrollToIssue(issue)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1 text-left hover:bg-amber-100/60 dark:hover:bg-amber-800/40"
                >
                  <span
                    className={`mt-[3px] inline-flex h-2 w-2 rounded-full ${
                      isError ? "bg-red-500" : "bg-amber-400"
                    }`}
                  />
                  <span className="flex-1">
                    <span className="mr-1 font-semibold">[{severityLabel}] {location.label}:</span>
                    <span>{issue.message}</span>
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Alert className="mb-6 border-montron-primary/20 bg-montron-extra dark:bg-montron-contrast/20 dark:border-montron-primary/30">
        <Info className="h-4 w-4 text-montron-primary" />
        <AlertDescription className="text-montron-text dark:text-white">
          Änderungen am Tagesbericht werden hervorgehoben und beim Speichern an den Server gesendet.
        </AlertDescription>
      </Alert>

      {saveError && <div className="mb-4 text-sm text-red-500">{saveError}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div ref={tbRef}>
          <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-montron-text dark:text-white">
                <FileText className="h-5 w-5 mr-2 text-montron-primary" />
                TAGESBERICHT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!hasTb && (<div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Tagesbericht vorhanden.</div>)}
                {hasTb && tbFields.length === 0 && (
                  <div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Layout für TB konfiguriert.</div>
                )}
                {hasTb && tbFields.map((field) => {
                  const fieldRef = `tb.${field.key}`
                  const issuesForField = fieldIssuesMap.get(fieldRef)
                  const hasErrorIssue = Boolean(issuesForField?.errors.length)
                  const hasWarnIssue = !hasErrorIssue && Boolean(issuesForField?.warns.length)
                  const originalValue = getTbFieldValue(tb, field.key)
                  const draftValue = getTbFieldValue(tbDraft, field.key)
                  const hasChanged = editMode && tb && tbDraft && originalValue !== draftValue

                  const highlightBorderClass = hasErrorIssue
                    ? "border-red-400 dark:border-red-500"
                    : hasWarnIssue
                    ? "border-amber-400 dark:border-amber-500"
                    : "border-transparent"
                  const highlightBgClass = hasErrorIssue
                    ? "bg-red-50/60 dark:bg-red-900/10"
                    : hasWarnIssue
                    ? "bg-amber-50/60 dark:bg-amber-900/5"
                    : ""

                  return (
                    <div
                      key={field.key}
                      className={`grid gap-2 rounded-md border-l-4 pl-3 pr-2 py-2 ${highlightBorderClass} ${highlightBgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-montron-contrast dark:text-montron-extra">
                          {field.label}
                        </Label>
                        <div className="flex items-center gap-1">
                          {hasErrorIssue && <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />}
                          {!hasErrorIssue && hasWarnIssue && (
                            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                          )}
                          {hasChanged && <span className="h-2 w-2 rounded-full bg-montron-primary" aria-hidden />}
                        </div>
                      </div>

                      {!editMode && (
                        <div className="text-sm text-montron-text dark:text-white">{toDisplayValue(originalValue)}</div>
                      )}

                      {editMode && tbDraft && (
                        <>
                          <TbFieldEditor
                            field={field}
                            value={draftValue}
                            onChange={(newValue) => {
                              setTbDraft((prev) => {
                                if (!prev) return prev
                                const next: TbDto = {
                                  ...prev,
                                  extra: prev.extra ? { ...prev.extra } : null,
                                }
                                switch (field.key) {
                                  case "startTime":
                                    next.startTime = (newValue as string) || null
                                    break
                                  case "endTime":
                                    next.endTime = (newValue as string) || null
                                    break
                                  case "breakMinutes":
                                    next.breakMinutes = newValue === "" || newValue === null ? null : Number(newValue)
                                    break
                                  case "travelMinutes":
                                    next.travelMinutes = newValue === "" || newValue === null ? null : Number(newValue)
                                    break
                                  case "licensePlate":
                                    next.licensePlate = (newValue as string) ?? null
                                    break
                                  case "department":
                                    next.department = (newValue as string) ?? null
                                    break
                                  case "overnight":
                                    next.overnight = Boolean(newValue)
                                    break
                                  case "kmStart":
                                    next.kmStart = newValue === "" || newValue === null ? null : Number(newValue)
                                    break
                                  case "kmEnd":
                                    next.kmEnd = newValue === "" || newValue === null ? null : Number(newValue)
                                    break
                                  case "comment":
                                    next.comment = (newValue as string) ?? null
                                    break
                                  default: {
                                    const extra = { ...(next.extra ?? {}) }
                                    extra[field.key] = newValue
                                    next.extra = extra
                                  }
                                }
                                return next
                              })
                            }}
                          />
                          {hasChanged && (
                            <div className="text-xs text-montron-primary line-through opacity-70">
                              {toDisplayValue(originalValue)}
                            </div>
                          )}
                          <Separator className="bg-montron-contrast/10 dark:bg-montron-contrast/40" />
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div ref={rsRef}>
          <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-montron-text dark:text-white">
                <ClipboardList className="h-5 w-5 mr-2 text-montron-primary" />
                REGIESCHEINE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasRs && (<div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Regieschein vorhanden.</div>)}

              {hasRs && rsDraft && (
                <div className="space-y-4">
                  {rsFields.length === 0 && (
                    <div className="text-xs text-montron-contrast dark:text-montron-extra">Kein Layout für RS konfiguriert.</div>
                  )}

                  {rsFields.map((field) => {
                    const fieldRef = `rs.${field.key}`
                    const issuesForField = fieldIssuesMap.get(fieldRef)
                    const hasErrorIssue = Boolean(issuesForField?.errors.length)
                    const hasWarnIssue = !hasErrorIssue && Boolean(issuesForField?.warns.length)
                    const originalValue = getRsFieldValue(rs, field.key)
                    const draftValue = getRsFieldValue(rsDraft, field.key)
                    const hasChanged = editMode && rs && rsDraft && originalValue !== draftValue

                    const highlightBorderClass = hasErrorIssue
                      ? "border-red-400 dark:border-red-500"
                      : hasWarnIssue
                      ? "border-amber-400 dark:border-amber-500"
                      : "border-transparent"
                    const highlightBgClass = hasErrorIssue
                      ? "bg-red-50/60 dark:bg-red-900/10"
                      : hasWarnIssue
                      ? "bg-amber-50/60 dark:bg-amber-900/5"
                      : ""

                    return (
                      <div
                        key={field.key}
                        className={`grid gap-2 rounded-md border-l-4 pl-3 pr-2 py-2 ${highlightBorderClass} ${highlightBgClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-montron-contrast dark:text-montron-extra">
                            {field.label}
                          </Label>
                          <div className="flex items-center gap-1">
                            {hasErrorIssue && <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />}
                            {!hasErrorIssue && hasWarnIssue && (
                              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                            )}
                            {hasChanged && <span className="h-2 w-2 rounded-full bg-montron-primary" aria-hidden />}
                          </div>
                        </div>

                        {!editMode && (
                          <div className="text-sm text-montron-text dark:text-white">{toDisplayValue(originalValue)}</div>
                        )}

                        {editMode && (
                          <>
                            <RsFieldEditor
                              field={field}
                              value={draftValue}
                              onChange={(newValue) => {
                                setRsDraft((prev) => {
                                  if (!prev) return prev
                                  const next: RsDto = {
                                    ...prev,
                                    positions: prev.positions ? prev.positions.map((position) => ({ ...position })) : [],
                                  }
                                  switch (field.key) {
                                    case "startTime":
                                      next.startTime = (newValue as string) || null
                                      break
                                    case "endTime":
                                      next.endTime = (newValue as string) || null
                                      break
                                    case "breakMinutes":
                                      next.breakMinutes = newValue === "" || newValue === null ? null : Number(newValue)
                                      break
                                    case "customerName":
                                      next.customerName = (newValue as string) ?? null
                                      break
                                    case "customerId":
                                      next.customerId = (newValue as string) ?? null
                                      break
                                    default:
                                      break
                                  }
                                  return next
                                })
                              }}
                            />
                            {hasChanged && (
                              <div className="text-xs text-montron-primary line-through opacity-70">
                                {toDisplayValue(originalValue)}
                              </div>
                            )}
                            <Separator className="bg-montron-contrast/10 dark:bg-montron-contrast/40" />
                          </>
                        )}
                      </div>
                    )
                  })}

                  <div
                    className={`rounded-md border-l-4 px-3 py-3 ${rsPositionsBorderClass} ${rsPositionsBgClass}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-montron-text dark:text-white">Positionen</h4>
                      <div className="flex items-center gap-1">
                        {rsPositionsHasErrorIssue && <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />}
                        {!rsPositionsHasErrorIssue && rsPositionsHasWarnIssue && (
                          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                        )}
                        {editMode && rsPositionsChanged && (
                          <span className="h-2 w-2 rounded-full bg-montron-primary" aria-hidden />
                        )}
                      </div>
                    </div>
                    <RsPositionsTable
                      positions={rsDraft.positions ?? []}
                      editMode={editMode}
                      onChange={(nextPositions) => {
                        setRsDraft((prev) => (prev ? { ...prev, positions: nextPositions } : prev))
                      }}
                    />
                  </div>

                  {editMode && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      {rsSaveError && <div className="text-xs text-red-500">{rsSaveError}</div>}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleSaveRs()}
                        disabled={isSavingRs}
                        className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
                      >
                        {isSavingRs ? "Speichern…" : "RS speichern"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div ref={streetwatchRef}>
          <Card
            className={`border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text ${streetwatchHasError ? "border-red-400 dark:border-red-500" : streetwatchHasWarn ? "border-amber-400 dark:border-amber-500" : ""}`}
            >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-montron-text dark:text-white">
                <MapPin className="h-5 w-5 mr-2 text-montron-primary" />
                STREETWATCH
                {streetwatchHasError && <span className="ml-2 h-2 w-2 rounded-full bg-red-500" aria-hidden />}
                {!streetwatchHasError && streetwatchHasWarn && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {streetwatch && streetwatch.entries && streetwatch.entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                      {streetwatchColumns.map((column, idx) => (
                        <TableHead key={`${column.key}-${idx}`} className="text-montron-text dark:text-white">
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {streetwatch.entries.map((entry: StreetwatchEntryDto, idx: number) => (
                      <TableRow key={idx} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                        {streetwatchColumns.map((column, colIdx) => (
                          <TableCell key={`${column.key}-${colIdx}`} className="text-montron-text dark:text-white">
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
    </div>
  )
}

type TbFieldEditorProps = {
  field: LayoutFieldConfig
  value: unknown
  onChange: (value: unknown) => void
}

function TbFieldEditor({ field, value, onChange }: TbFieldEditorProps) {
  const editorType = field.editorType ?? "text"

  if (editorType === "time15") {
    const timeValue = typeof value === "string" ? value.slice(0, 5) : ""
    return (
      <Input
        type="time"
        value={timeValue}
        step={900}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm"
      />
    )
  }

  if (editorType === "number") {
    const numberValue =
      typeof value === "number" || typeof value === "string" ? value : ""
    return (
      <Input
        type="number"
        value={numberValue}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm"
      />
    )
  }

  if (editorType === "textarea") {
    const textValue =
      typeof value === "string" ? value : value === null || value === undefined ? "" : String(value)
    return (
      <Textarea
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="text-sm"
      />
    )
  }

  if (editorType === "checkbox" || typeof value === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={Boolean(value)} onCheckedChange={(checked) => onChange(checked)} />
        <span className="text-xs text-montron-contrast dark:text-montron-extra">Ja / Nein</span>
      </div>
    )
  }

  const textValue =
    typeof value === "string" ? value : value === null || value === undefined ? "" : String(value)

  return (
    <Input
      type="text"
      value={textValue}
      onChange={(event) => onChange(event.target.value)}
      className="text-sm"
    />
  )
}

type RsFieldEditorProps = {
  field: LayoutFieldConfig
  value: unknown
  onChange: (value: unknown) => void
}

function RsFieldEditor({ field, value, onChange }: RsFieldEditorProps) {
  const editorType = field.editorType ?? "text"

  if (editorType === "time15") {
    const timeValue = typeof value === "string" ? value.slice(0, 5) : ""
    return (
      <Input
        type="time"
        value={timeValue}
        step={900}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm"
      />
    )
  }

  if (editorType === "number") {
    const numberValue =
      typeof value === "number" || typeof value === "string" ? value : ""
    return (
      <Input
        type="number"
        value={numberValue}
        onChange={(event) => onChange(event.target.value)}
        className="text-sm"
      />
    )
  }

  if (editorType === "textarea") {
    const textValue =
      typeof value === "string" ? value : value == null ? "" : String(value)
    return (
      <Textarea
        value={textValue}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="text-sm"
      />
    )
  }

  const textValue =
    typeof value === "string" ? value : value == null ? "" : String(value)

  return (
    <Input
      type="text"
      value={textValue}
      onChange={(event) => onChange(event.target.value)}
      className="text-sm"
    />
  )
}

type RsPositionsTableProps = {
  positions: RsPositionDto[]
  editMode: boolean
  onChange: (positions: RsPositionDto[]) => void
}

function RsPositionsTable({ positions, editMode, onChange }: RsPositionsTableProps) {
  const handleCellChange = (index: number, key: keyof RsPositionDto, rawValue: unknown) => {
    const next = positions.map((entry, idx) => {
      if (idx !== index) return entry

      const updated: RsPositionDto = { ...entry }
      const value = rawValue

      switch (key) {
        case "hours":
        case "quantity":
        case "pricePerUnit": {
          const numeric =
            typeof value === "number" ? value : value === "" || value == null ? null : Number(value)
          updated[key] = numeric as never
          break
        }
        default: {
          updated[key] = (value === "" ? null : (value as string | null)) as never
          break
        }
      }

      return updated
    })

    onChange(next)
  }

  if (!positions.length && !editMode) {
    return <div className="text-xs text-montron-contrast dark:text-montron-extra">Keine Positionen vorhanden.</div>
  }

  const rows = positions.length > 0 ? positions : editMode
    ? [{ code: null, description: null, hours: null, quantity: null, unit: null, pricePerUnit: null }]
    : []

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
          <TableHead className="text-montron-text dark:text-white">Code</TableHead>
          <TableHead className="text-montron-text dark:text-white">Beschreibung</TableHead>
          <TableHead className="text-right text-montron-text dark:text-white">Stunden</TableHead>
          <TableHead className="text-right text-montron-text dark:text-white">Menge</TableHead>
          <TableHead className="text-montron-text dark:text-white">Einheit</TableHead>
          <TableHead className="text-right text-montron-text dark:text-white">Preis/Einheit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((position, index) => {
          const safe = position ?? {
            code: null,
            description: null,
            hours: null,
            quantity: null,
            unit: null,
            pricePerUnit: null,
          }

          if (!editMode) {
            return (
              <TableRow key={index} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                <TableCell className="text-montron-text dark:text-white">{safe.code ?? "–"}</TableCell>
                <TableCell className="text-montron-text dark:text-white">{safe.description ?? "–"}</TableCell>
                <TableCell className="text-right text-montron-text dark:text-white">{safe.hours ?? "–"}</TableCell>
                <TableCell className="text-right text-montron-text dark:text-white">{safe.quantity ?? "–"}</TableCell>
                <TableCell className="text-montron-text dark:text-white">{safe.unit ?? "–"}</TableCell>
                <TableCell className="text-right text-montron-text dark:text-white">{safe.pricePerUnit ?? "–"}</TableCell>
              </TableRow>
            )
          }

          return (
            <TableRow key={index} className="border-montron-contrast/20 dark:border-montron-contrast/50">
              <TableCell>
                <Input
                  value={safe.code ?? ""}
                  onChange={(event) => handleCellChange(index, "code", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={safe.description ?? ""}
                  onChange={(event) => handleCellChange(index, "description", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={safe.hours ?? ""}
                  onChange={(event) => handleCellChange(index, "hours", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={safe.quantity ?? ""}
                  onChange={(event) => handleCellChange(index, "quantity", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={safe.unit ?? ""}
                  onChange={(event) => handleCellChange(index, "unit", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={safe.pricePerUnit ?? ""}
                  onChange={(event) => handleCellChange(index, "pricePerUnit", event.target.value)}
                  className="text-sm"
                />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
