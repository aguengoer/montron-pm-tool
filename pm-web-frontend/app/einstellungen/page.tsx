"use client"

import type React from "react"

import { useState } from "react"
import { Palette, Upload, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EinstellungenPage() {
  const [primaryColor, setPrimaryColor] = useState("#0f172a")
  const [secondaryColor, setSecondaryColor] = useState("#6366f1")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Beispieldaten für Benutzer
  const benutzer = [
    { id: 1, name: "Admin", email: "admin@example.com", rolle: "Administrator" },
    { id: 2, name: "Meier Michael", email: "m.meier@example.com", rolle: "Benutzer" },
    { id: 3, name: "Schmidt Sarah", email: "s.schmidt@example.com", rolle: "Nur Lesen" },
  ]

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Vorschau erstellen
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDesign = () => {
    alert("Design-Einstellungen wurden gespeichert!")
  }

  const handleSaveUsers = () => {
    alert("Benutzereinstellungen wurden gespeichert!")
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Einstellungen</h1>

      <Tabs defaultValue="design">
        <TabsList className="mb-6">
          <TabsTrigger value="design">Corporate Design</TabsTrigger>
          <TabsTrigger value="users">Benutzer & Rollen</TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Corporate Design
              </CardTitle>
              <CardDescription>
                Passen Sie das Erscheinungsbild der Anwendung an Ihr Unternehmensdesign an.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Logo</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <Label htmlFor="logo" className="block mb-2">
                      Firmenlogo hochladen
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="max-w-sm" />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Empfohlene Größe: 200x60 Pixel, PNG oder SVG mit transparentem Hintergrund.
                    </p>
                  </div>

                  <div className="w-full md:w-auto">
                    <Label className="block mb-2">Vorschau</Label>
                    <div className="border rounded-md p-4 flex items-center justify-center bg-muted h-[100px] w-[200px]">
                      {logoPreview ? (
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo Vorschau"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">Kein Logo ausgewählt</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Farben</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="primaryColor" className="block mb-2">
                      Primärfarbe
                    </Label>
                    <div className="flex gap-4 items-center">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Wird für Überschriften und Hauptelemente verwendet.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor" className="block mb-2">
                      Sekundärfarbe
                    </Label>
                    <div className="flex gap-4 items-center">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Wird für Buttons und Akzente verwendet.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveDesign}>Einstellungen speichern</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Benutzer & Rollen
              </CardTitle>
              <CardDescription>Verwalten Sie Benutzer und deren Zugriffsrechte.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="w-[150px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benutzer.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select defaultValue={user.rolle}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Rolle auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Administrator">Administrator</SelectItem>
                            <SelectItem value="Benutzer">Benutzer</SelectItem>
                            <SelectItem value="Nur Lesen">Nur Lesen</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Bearbeiten
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Neuer Benutzer
                </Button>
                <Button onClick={handleSaveUsers}>Änderungen speichern</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

