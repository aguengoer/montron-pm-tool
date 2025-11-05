"use client"

import { useState } from "react"
import { Plus, Search, Edit2, Trash2, Building } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Beispieldaten für Kunden
const initialKunden = [
  {
    id: 1,
    name: "Mustermann GmbH",
    ansprechpartner: "Max Mustermann",
    adresse: "Musterstraße 1, 1010 Wien",
    telefon: "+43 1 234567890",
    email: "office@mustermann-gmbh.at",
  },
  {
    id: 2,
    name: "Beispiel AG",
    ansprechpartner: "Erika Beispiel",
    adresse: "Beispielweg 42, 4020 Linz",
    telefon: "+43 732 123456",
    email: "kontakt@beispiel-ag.at",
  },
  {
    id: 3,
    name: "Test & Co KG",
    ansprechpartner: "Thomas Test",
    adresse: "Testgasse 5, 8010 Graz",
    telefon: "+43 316 987654",
    email: "info@test-co.at",
  },
]

export default function KundenVerwaltung() {
  const [kunden, setKunden] = useState(initialKunden)
  const [suchbegriff, setSuchbegriff] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentKunde, setCurrentKunde] = useState({
    id: 0,
    name: "",
    ansprechpartner: "",
    adresse: "",
    telefon: "",
    email: "",
  })
  const [isEditing, setIsEditing] = useState(false)

  // Filtern der Kunden basierend auf dem Suchbegriff
  const filteredKunden = kunden.filter(
    (kunde) =>
      kunde.name.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      kunde.ansprechpartner.toLowerCase().includes(suchbegriff.toLowerCase()) ||
      kunde.adresse.toLowerCase().includes(suchbegriff.toLowerCase()),
  )

  const handleAddKunde = () => {
    setCurrentKunde({
      id: 0,
      name: "",
      ansprechpartner: "",
      adresse: "",
      telefon: "",
      email: "",
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEditKunde = (kunde) => {
    setCurrentKunde(kunde)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteKunde = (id) => {
    if (confirm("Möchten Sie diesen Kunden wirklich löschen?")) {
      setKunden(kunden.filter((kunde) => kunde.id !== id))
    }
  }

  const handleSaveKunde = () => {
    if (isEditing) {
      // Bestehenden Kunden aktualisieren
      setKunden(kunden.map((kunde) => (kunde.id === currentKunde.id ? currentKunde : kunde)))
    } else {
      // Neuen Kunden hinzufügen
      const newId = Math.max(...kunden.map((k) => k.id), 0) + 1
      setKunden([...kunden, { ...currentKunde, id: newId }])
    }
    setIsDialogOpen(false)
  }

  const handleInputChange = (field, value) => {
    setCurrentKunde({
      ...currentKunde,
      [field]: value,
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Kundenverwaltung</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Kunden..."
            className="pl-10"
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
          />
        </div>

        <Button onClick={handleAddKunde}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kunde
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Kunden
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Ansprechpartner</TableHead>
                <TableHead className="hidden md:table-cell">Adresse</TableHead>
                <TableHead className="hidden md:table-cell">Telefon</TableHead>
                <TableHead className="hidden md:table-cell">E-Mail</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKunden.map((kunde) => (
                <TableRow key={kunde.id}>
                  <TableCell className="font-medium">{kunde.name}</TableCell>
                  <TableCell>{kunde.ansprechpartner}</TableCell>
                  <TableCell className="hidden md:table-cell">{kunde.adresse}</TableCell>
                  <TableCell className="hidden md:table-cell">{kunde.telefon}</TableCell>
                  <TableCell className="hidden md:table-cell">{kunde.email}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditKunde(kunde)}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Bearbeiten</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteKunde(kunde.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Löschen</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredKunden.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    Keine Kunden gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Bearbeiten Sie die Kundendaten und klicken Sie auf Speichern."
                : "Fügen Sie einen neuen Kunden hinzu und klicken Sie auf Speichern."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={currentKunde.name} onChange={(e) => handleInputChange("name", e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ansprechpartner">Ansprechpartner</Label>
              <Input
                id="ansprechpartner"
                value={currentKunde.ansprechpartner}
                onChange={(e) => handleInputChange("ansprechpartner", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={currentKunde.adresse}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input
                id="telefon"
                value={currentKunde.telefon}
                onChange={(e) => handleInputChange("telefon", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                value={currentKunde.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveKunde}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

