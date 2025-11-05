"use client"

import { useState, useEffect } from "react"
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
  Clock,
  Car,
  Building,
  Coffee,
  Briefcase,
  Home,
  DollarSign,
  MessageSquare,
  Info,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Beispieldaten für Mitarbeiter
const mitarbeiter = {
  1: { id: 1, nachname: "MEIER", vorname: "Michael", abteilung: "Technik" },
}

export default function Tagesdetail({ params }: { params: { id: string; datum: string } }) {
  const mitarbeiterId = Number.parseInt(params.id)
  const mitarbeiterData = mitarbeiter[mitarbeiterId]
  const datum = params.datum
  const formattedDatum = format(new Date(datum), "EEEE, dd.MM.yyyy", { locale: de })

  const [editMode, setEditMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Tagesbericht Daten
  const [tagesbericht, setTagesbericht] = useState({
    kennzeichen: "W-12345",
    abteilung: "Technik",
    pause: "00:30",
    arbeitszeit: "08:00",
    wegzeit: "01:15",
    naechtigung: false,
    ausgaben: "12,50",
    kommentar: "Arbeiten wurden planmäßig durchgeführt.",
  })

  // Alte Werte für Vergleich
  const [oldValues, setOldValues] = useState({})

  // Regieschein Daten
  const [regiescheine, setRegiescheine] = useState([
    {
      id: 1,
      kunde: "Mustermann GmbH",
      adresse: "Musterstraße 1, 1010 Wien",
      eintraege: [
        { zeit: "08:30 - 10:30", beschreibung: "Installation Netzwerkkomponenten", menge: 2, einheit: "Std" },
        { zeit: "10:45 - 12:00", beschreibung: "Konfiguration Router", menge: 1.25, einheit: "Std" },
      ],
      material: [
        { bezeichnung: "Netzwerkkabel Cat6", menge: 15, einheit: "m" },
        { bezeichnung: "Patchpanel 24 Port", menge: 1, einheit: "Stk" },
      ],
    },
    {
      id: 2,
      kunde: "Beispiel AG",
      adresse: "Beispielweg 42, 4020 Linz",
      eintraege: [{ zeit: "13:30 - 15:30", beschreibung: "Wartung Serverraum", menge: 2, einheit: "Std" }],
      material: [],
    },
  ])

  // Alte Werte für Regiescheine
  const [oldRegiescheinValues, setOldRegiescheinValues] = useState({})

  // Streetwatch Daten
  const streetwatch = [
    { zeit: "07:15", ereignis: "Fahrtbeginn", ort: "Firmenparkplatz" },
    { zeit: "08:15", ereignis: "Ankunft", ort: "Mustermann GmbH" },
    { zeit: "12:15", ereignis: "Abfahrt", ort: "Mustermann GmbH" },
    { zeit: "12:45", ereignis: "Ankunft", ort: "Beispiel AG" },
    { zeit: "15:45", ereignis: "Abfahrt", ort: "Beispiel AG" },
    { zeit: "16:30", ereignis: "Fahrtende", ort: "Firmenparkplatz" },
  ]

  useEffect(() => {
    // Überprüfen, ob Änderungen vorgenommen wurden
    const hasTagesberichtChanges = Object.keys(oldValues).some((key) => oldValues[key] !== tagesbericht[key])
    const hasRegiescheinChanges = Object.keys(oldRegiescheinValues).some(
      (key) =>
        JSON.stringify(oldRegiescheinValues[key]) !== JSON.stringify(regiescheine.find((r) => r.id.toString() === key)),
    )
    setHasChanges(hasTagesberichtChanges || hasRegiescheinChanges)
  }, [tagesbericht, regiescheine, oldValues, oldRegiescheinValues])

  const handleEdit = () => {
    if (!editMode) {
      // Speichere aktuelle Werte für Vergleich
      setOldValues({ ...tagesbericht })
      setOldRegiescheinValues(
        regiescheine.reduce((acc, regieschein) => {
          acc[regieschein.id] = { ...regieschein }
          return acc
        }, {}),
      )
      setEditMode(true)
    } else {
      // Bearbeitung beenden und Änderungen speichern
      setEditMode(false)
    }
  }

  const handleFreigeben = () => {
    // Hier würde die Logik für die Freigabe implementiert werden
    setEditMode(false)
    setOldValues({})
    setOldRegiescheinValues({})
    setHasChanges(false)
    alert("Tagesbericht und Regiescheine wurden freigegeben!")
  }

  const handlePdfExport = () => {
    // Hier würde die PDF-Export-Logik implementiert werden
    alert(`PDFs werden generiert: TB_${datum}_${mitarbeiterData.nachname}_${mitarbeiterData.vorname}.pdf`)
  }

  const handleInputChange = (field, value) => {
    setTagesbericht((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleRegiescheinChange = (regiescheinId, field, value) => {
    setRegiescheine((prevRegiescheine) =>
      prevRegiescheine.map((regieschein) =>
        regieschein.id === regiescheinId ? { ...regieschein, [field]: value } : regieschein,
      ),
    )
  }

  // Funktion zum Anzeigen von geänderten Werten
  const renderChangedValue = (field, label) => {
    if (!oldValues[field]) return null

    if (oldValues[field] !== tagesbericht[field]) {
      return (
        <div className="mt-1 flex items-center">
          <div className="h-2 w-2 rounded-full bg-montron-primary mr-2"></div>
          <span className="text-sm text-montron-primary line-through">
            {typeof oldValues[field] === "boolean" ? (oldValues[field] ? "Ja" : "Nein") : oldValues[field]}
          </span>
        </div>
      )
    }

    return null
  }

  // Funktion zum Anzeigen von geänderten Regieschein-Werten
  const renderChangedRegiescheinValue = (regiescheinId, field) => {
    const oldRegieschein = oldRegiescheinValues[regiescheinId]
    const currentRegieschein = regiescheine.find((r) => r.id === regiescheinId)

    if (!oldRegieschein || !currentRegieschein) return null

    if (JSON.stringify(oldRegieschein[field]) !== JSON.stringify(currentRegieschein[field])) {
      return (
        <div className="mt-1 flex items-center">
          <div className="h-2 w-2 rounded-full bg-montron-primary mr-2"></div>
          <span className="text-sm text-montron-primary line-through">
            {typeof oldRegieschein[field] === "string" ? oldRegieschein[field] : JSON.stringify(oldRegieschein[field])}
          </span>
        </div>
      )
    }

    return null
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Link href={`/mitarbeiter/${mitarbeiterId}/datumsauswahl`} className="mr-4">
            <Button
              variant="outline"
              size="icon"
              className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-montron-text dark:text-white">
            {mitarbeiterData?.nachname} {mitarbeiterData?.vorname} – {formattedDatum}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleEdit}
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

          <Button
            onClick={handleFreigeben}
            disabled={editMode || !hasChanges}
            className="bg-montron-primary hover:bg-montron-primary/90"
          >
            <Check className="h-4 w-4 mr-2" />
            Freigeben
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Alert className="mb-6 border-montron-primary/20 bg-montron-extra dark:bg-montron-contrast/20 dark:border-montron-primary/30">
          <Info className="h-4 w-4 text-montron-primary" />
          <AlertDescription className="text-montron-text dark:text-white">
            Alte Werte bleiben durchgestrichen sichtbar, bis die Änderungen freigegeben werden.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spalte 1: Tagesbericht */}
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <FileText className="h-5 w-5 mr-2 text-montron-primary" />
              TAGESBERICHT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Car className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="kennzeichen" className="text-montron-text dark:text-white">
                    Kennzeichen
                  </Label>
                </div>
                {editMode ? (
                  <Input
                    id="kennzeichen"
                    value={tagesbericht.kennzeichen}
                    onChange={(e) => handleInputChange("kennzeichen", e.target.value)}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.kennzeichen}</div>
                )}
                {renderChangedValue("kennzeichen", "Kennzeichen")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="abteilung" className="text-montron-text dark:text-white">
                    Abteilung
                  </Label>
                </div>
                {editMode ? (
                  <Select
                    value={tagesbericht.abteilung}
                    onValueChange={(value) => handleInputChange("abteilung", value)}
                  >
                    <SelectTrigger className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white">
                      <SelectValue placeholder="Abteilung auswählen" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-montron-text dark:border-montron-contrast/50">
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
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.abteilung}</div>
                )}
                {renderChangedValue("abteilung", "Abteilung")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Coffee className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="pause" className="text-montron-text dark:text-white">
                    Pause
                  </Label>
                </div>
                {editMode ? (
                  <Input
                    id="pause"
                    value={tagesbericht.pause}
                    onChange={(e) => handleInputChange("pause", e.target.value)}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.pause} Std.</div>
                )}
                {renderChangedValue("pause", "Pause")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="arbeitszeit" className="text-montron-text dark:text-white">
                    Arbeitszeit
                  </Label>
                </div>
                {editMode ? (
                  <Input
                    id="arbeitszeit"
                    value={tagesbericht.arbeitszeit}
                    onChange={(e) => handleInputChange("arbeitszeit", e.target.value)}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.arbeitszeit} Std.</div>
                )}
                {renderChangedValue("arbeitszeit", "Arbeitszeit")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="wegzeit" className="text-montron-text dark:text-white">
                    Wegzeit
                  </Label>
                </div>
                {editMode ? (
                  <Input
                    id="wegzeit"
                    value={tagesbericht.wegzeit}
                    onChange={(e) => handleInputChange("wegzeit", e.target.value)}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.wegzeit} Std.</div>
                )}
                {renderChangedValue("wegzeit", "Wegzeit")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="naechtigung" className="text-montron-text dark:text-white">
                    Nächtigung
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="naechtigung"
                    checked={tagesbericht.naechtigung}
                    onCheckedChange={(checked) => handleInputChange("naechtigung", checked)}
                    disabled={!editMode}
                    className="data-[state=checked]:bg-montron-primary"
                  />
                  <Label htmlFor="naechtigung" className="text-montron-text dark:text-white">
                    {tagesbericht.naechtigung ? "Ja" : "Nein"}
                  </Label>
                </div>
                {renderChangedValue("naechtigung", "Nächtigung")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="ausgaben" className="text-montron-text dark:text-white">
                    Ausgaben (€)
                  </Label>
                </div>
                {editMode ? (
                  <Input
                    id="ausgaben"
                    value={tagesbericht.ausgaben}
                    onChange={(e) => handleInputChange("ausgaben", e.target.value)}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.ausgaben} €</div>
                )}
                {renderChangedValue("ausgaben", "Ausgaben")}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-montron-primary" />
                  <Label htmlFor="kommentar" className="text-montron-text dark:text-white">
                    Kommentar
                  </Label>
                </div>
                {editMode ? (
                  <Textarea
                    id="kommentar"
                    value={tagesbericht.kommentar}
                    onChange={(e) => handleInputChange("kommentar", e.target.value)}
                    rows={3}
                    className="border-montron-contrast/30 focus-visible:ring-montron-primary dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white"
                  />
                ) : (
                  <div className="text-sm text-montron-text dark:text-white">{tagesbericht.kommentar}</div>
                )}
                {renderChangedValue("kommentar", "Kommentar")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spalte 2: Regieschein */}
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <ClipboardList className="h-5 w-5 mr-2 text-montron-primary" />
              REGIESCHEINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {regiescheine.map((regieschein, index) => (
              <div key={regieschein.id} className="space-y-4">
                {index > 0 && <Separator className="bg-montron-contrast/20 dark:bg-montron-contrast/50" />}
                <div>
                  <h3 className="font-semibold text-montron-text dark:text-white">{regieschein.kunde}</h3>
                  <p className="text-sm text-montron-contrast dark:text-montron-extra">{regieschein.adresse}</p>
                  {renderChangedRegiescheinValue(regieschein.id, "kunde")}
                  {renderChangedRegiescheinValue(regieschein.id, "adresse")}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-montron-text dark:text-white">Zeiteinträge</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                        <TableHead className="w-[100px] text-montron-text dark:text-white">Zeit</TableHead>
                        <TableHead className="text-montron-text dark:text-white">Beschreibung</TableHead>
                        <TableHead className="text-right w-[80px] text-montron-text dark:text-white">Menge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regieschein.eintraege.map((eintrag, i) => (
                        <TableRow key={i} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                          <TableCell className="font-medium text-montron-text dark:text-white">
                            {eintrag.zeit}
                          </TableCell>
                          <TableCell className="text-montron-text dark:text-white">{eintrag.beschreibung}</TableCell>
                          <TableCell className="text-right text-montron-text dark:text-white">
                            {eintrag.menge} {eintrag.einheit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {renderChangedRegiescheinValue(regieschein.id, "eintraege")}
                </div>

                {regieschein.material.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-montron-text dark:text-white">Material</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                          <TableHead className="text-montron-text dark:text-white">Bezeichnung</TableHead>
                          <TableHead className="text-right w-[80px] text-montron-text dark:text-white">Menge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regieschein.material.map((material, i) => (
                          <TableRow key={i} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                            <TableCell className="text-montron-text dark:text-white">{material.bezeichnung}</TableCell>
                            <TableCell className="text-right text-montron-text dark:text-white">
                              {material.menge} {material.einheit}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {renderChangedRegiescheinValue(regieschein.id, "material")}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
                    onClick={() => alert(`RS_${datum}_${regieschein.kunde.replace(/\s/g, "_")}.pdf wird generiert`)}
                  >
                    <FileOutput className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Spalte 3: Streetwatch */}
        <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-montron-text dark:text-white">
              <MapPin className="h-5 w-5 mr-2 text-montron-primary" />
              STREETWATCH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                  <TableHead className="w-[80px] text-montron-text dark:text-white">Zeit</TableHead>
                  <TableHead className="text-montron-text dark:text-white">Ereignis</TableHead>
                  <TableHead className="text-montron-text dark:text-white">Ort</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {streetwatch.map((eintrag, i) => (
                  <TableRow key={i} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                    <TableCell className="font-medium text-montron-text dark:text-white">{eintrag.zeit}</TableCell>
                    <TableCell className="text-montron-text dark:text-white">{eintrag.ereignis}</TableCell>
                    <TableCell className="text-montron-text dark:text-white">{eintrag.ort}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

