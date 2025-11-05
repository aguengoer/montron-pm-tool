"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, FileText, Download, FileOutput, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

export default function ExportPage() {
  const [vonDatum, setVonDatum] = useState<Date | undefined>(new Date(2024, 2, 1))
  const [bisDatum, setBisDatum] = useState<Date | undefined>(new Date(2024, 2, 31))
  const [mitarbeiter, setMitarbeiter] = useState("")
  const [kunde, setKunde] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Beispieldaten für Berichte
  const berichte = [
    {
      id: "tb_1",
      typ: "Tagesbericht",
      datum: "2024-03-01",
      mitarbeiter: "MEIER Michael",
      kunde: "-",
      status: "Freigegeben",
      filename: "TB_2024-03-01_MEIER_Michael.pdf",
    },
    {
      id: "rs_1",
      typ: "Regieschein",
      datum: "2024-03-01",
      mitarbeiter: "MEIER Michael",
      kunde: "Mustermann GmbH",
      status: "Freigegeben",
      filename: "RS_2024-03-01_Mustermann_GmbH.pdf",
    },
    {
      id: "tb_2",
      typ: "Tagesbericht",
      datum: "2024-03-02",
      mitarbeiter: "MEIER Michael",
      kunde: "-",
      status: "Freigegeben",
      filename: "TB_2024-03-02_MEIER_Michael.pdf",
    },
    {
      id: "rs_2",
      typ: "Regieschein",
      datum: "2024-03-02",
      mitarbeiter: "MEIER Michael",
      kunde: "Beispiel AG",
      status: "Freigegeben",
      filename: "RS_2024-03-02_Beispiel_AG.pdf",
    },
    {
      id: "tb_3",
      typ: "Tagesbericht",
      datum: "2024-03-04",
      mitarbeiter: "SCHMIDT Sarah",
      kunde: "-",
      status: "In Prüfung",
      filename: "TB_2024-03-04_SCHMIDT_Sarah.pdf",
    },
    {
      id: "rs_3",
      typ: "Regieschein",
      datum: "2024-03-05",
      mitarbeiter: "SCHMIDT Sarah",
      kunde: "Mustermann GmbH",
      status: "Freigegeben",
      filename: "RS_2024-03-05_Mustermann_GmbH.pdf",
    },
  ]

  // Filtern der Berichte
  const filteredBerichte = berichte.filter((bericht) => {
    const berichtDatum = new Date(bericht.datum)
    const matchesDatum = (!vonDatum || berichtDatum >= vonDatum) && (!bisDatum || berichtDatum <= bisDatum)

    const matchesMitarbeiter = !mitarbeiter || bericht.mitarbeiter.includes(mitarbeiter)
    const matchesKunde = !kunde || bericht.kunde.includes(kunde)

    return matchesDatum && matchesMitarbeiter && matchesKunde
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredBerichte.map((bericht) => bericht.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id])
    } else {
      setSelectedItems(selectedItems.filter((item) => item !== id))
    }
  }

  const handleGeneratePdf = () => {
    if (selectedItems.length === 0) {
      alert("Bitte wählen Sie mindestens ein Dokument aus.")
      return
    }

    const selectedFilenames = filteredBerichte
      .filter((bericht) => selectedItems.includes(bericht.id))
      .map((bericht) => bericht.filename)
      .join(", ")

    alert(`Folgende PDFs werden generiert: ${selectedFilenames}`)
  }

  const handleExportCsv = () => {
    alert("CSV-Export wird generiert.")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-montron-text dark:text-white">EXPORT & PDF-ÜBERSICHT</h1>

      <Card className="mb-8 border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader>
          <CardTitle className="text-montron-text dark:text-white">FILTER</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-montron-text dark:text-white">Von-Datum</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left border-montron-contrast/30 dark:border-montron-contrast/50 dark:text-white"
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
                    className="w-full justify-start text-left border-montron-contrast/30 dark:border-montron-contrast/50 dark:text-white"
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

            <div>
              <label className="block text-sm font-medium mb-1 text-montron-text dark:text-white">Mitarbeiter</label>
              <Select value={mitarbeiter} onValueChange={setMitarbeiter}>
                <SelectTrigger className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white">
                  <SelectValue placeholder="Alle Mitarbeiter" />
                </SelectTrigger>
                <SelectContent className="dark:bg-montron-text dark:border-montron-contrast/50">
                  <SelectItem value="all" className="dark:text-white">
                    Alle Mitarbeiter
                  </SelectItem>
                  <SelectItem value="MEIER" className="dark:text-white">
                    MEIER Michael
                  </SelectItem>
                  <SelectItem value="SCHMIDT" className="dark:text-white">
                    SCHMIDT Sarah
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-montron-text dark:text-white">Kunde</label>
              <Select value={kunde} onValueChange={setKunde}>
                <SelectTrigger className="border-montron-contrast/30 dark:border-montron-contrast/50 dark:bg-montron-text dark:text-white">
                  <SelectValue placeholder="Alle Kunden" />
                </SelectTrigger>
                <SelectContent className="dark:bg-montron-text dark:border-montron-contrast/50">
                  <SelectItem value="all" className="dark:text-white">
                    Alle Kunden
                  </SelectItem>
                  <SelectItem value="Mustermann" className="dark:text-white">
                    Mustermann GmbH
                  </SelectItem>
                  <SelectItem value="Beispiel" className="dark:text-white">
                    Beispiel AG
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button className="bg-montron-primary hover:bg-montron-primary/90">
              <Filter className="mr-2 h-4 w-4" />
              Filtern
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-montron-contrast/20 dark:border-montron-contrast/50 dark:bg-montron-text">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-montron-text dark:text-white">
            <FileText className="h-5 w-5 mr-2 text-montron-primary" />
            DOKUMENTE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    checked={selectedItems.length === filteredBerichte.length && filteredBerichte.length > 0}
                    className="data-[state=checked]:bg-montron-primary data-[state=checked]:border-montron-primary"
                  />
                </TableHead>
                <TableHead className="text-montron-text dark:text-white">Typ</TableHead>
                <TableHead className="text-montron-text dark:text-white">Datum</TableHead>
                <TableHead className="text-montron-text dark:text-white">Mitarbeiter</TableHead>
                <TableHead className="text-montron-text dark:text-white">Kunde</TableHead>
                <TableHead className="text-montron-text dark:text-white">Status</TableHead>
                <TableHead className="w-[100px] text-montron-text dark:text-white">Dateiname</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBerichte.map((bericht) => (
                <TableRow key={bericht.id} className="border-montron-contrast/20 dark:border-montron-contrast/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(bericht.id)}
                      onCheckedChange={(checked) => handleSelectItem(bericht.id, checked as boolean)}
                      className="data-[state=checked]:bg-montron-primary data-[state=checked]:border-montron-primary"
                    />
                  </TableCell>
                  <TableCell className="text-montron-text dark:text-white">{bericht.typ}</TableCell>
                  <TableCell className="text-montron-text dark:text-white">
                    {format(new Date(bericht.datum), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-montron-text dark:text-white">{bericht.mitarbeiter}</TableCell>
                  <TableCell className="text-montron-text dark:text-white">{bericht.kunde}</TableCell>
                  <TableCell className="text-montron-text dark:text-white">{bericht.status}</TableCell>
                  <TableCell className="font-mono text-xs text-montron-text dark:text-white">
                    {bericht.filename}
                  </TableCell>
                </TableRow>
              ))}

              {filteredBerichte.length === 0 && (
                <TableRow className="border-montron-contrast/20 dark:border-montron-contrast/50">
                  <TableCell colSpan={7} className="text-center py-4 text-montron-contrast dark:text-montron-extra">
                    Keine Dokumente gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex flex-wrap gap-4 justify-end">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              className="border-montron-contrast/30 hover:bg-montron-extra hover:text-montron-primary dark:border-montron-contrast/50 dark:hover:bg-montron-contrast/20"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>

            <Button
              onClick={handleGeneratePdf}
              disabled={selectedItems.length === 0}
              className="bg-montron-primary hover:bg-montron-primary/90"
            >
              <FileOutput className="h-4 w-4 mr-2" />
              PDF generieren ({selectedItems.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

