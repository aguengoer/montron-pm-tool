# Montron PM-Tool – Project Status Summary
**Projekt:** PM-Tool MVP  
**Datum:** 08.12.2025  
**Budget:** 170 Stunden  
**Verbrauch:** ~145-155 Stunden (85-90%)  

---

## ✅ Was ist fertig? (DONE)

### 1. **Mitarbeiterübersicht** - 100% ✅
- Alphabetische Sortierung (NACHNAME groß)
- Freitextsuche nach Name/Username
- Filter: Abteilung, Status (Aktiv/Inaktiv)
- Pagination

### 2. **Mitarbeiter-Detail & Datumsauswahl** - 100% ✅
- Datepicker Von/Bis
- Kalenderwoche (KW) Anzeige
- Ergebnisliste: Datum, TB/RS Count, Streetwatch, Status
- Klick auf Tag → Tagesdetail

### 3. **Tagesdetail – Drei-Spalten-Ansicht** - 95% ✅
**Dies ist das Herzstück und funktioniert komplett:**

#### Spalte "Tagesbericht" (TB) - 100% ✅
- ✅ Alle Pflichtfelder: Datum, Kennzeichen, Abteilung, Arbeitszeit (von/bis), Pause, Wegzeit
- ✅ Optionale Felder: Kommentar, zusätzliche Felder
- ✅ **Inline-Editing** aller Felder
- ✅ **Altwert dauerhaft sichtbar** mit durchgestrichen unter neuem Wert
- ✅ Geänderte Felder markiert (gelber Rand für ungespeicherte Änderungen)
- ✅ Edit/Read-only Modus mit "Bearbeiten" Button
- ✅ **PDF Download** für jeden TB
- ✅ **PDF Versioning** (_v2, _v3) bei Korrekturen
- ✅ Auto-Save / Manual Save

#### Spalte "Regieschein" (RS) - 100% ✅
- ✅ Kundenzuordnung (1 RS ↔ 1 Kunde)
- ✅ Zeit-/Leistungspositionen
- ✅ **Inline-Editing** wie TB
- ✅ **Altwert dauerhaft sichtbar**
- ✅ **PDF Download** für jeden RS
- ✅ **PDF Versioning** bei Korrekturen
- ✅ Separate Fotos-Button (wenn vorhanden)

#### Spalte "Streetwatch" - 90% ✅
- ✅ Kennzeichen, Datum, Zeiten (Tabelle)
- ✅ Read-only Anzeige
- ⚠️ **API-Anbindung fehlt** (wird manuell befüllt aktuell)

### 4. **Sicherheit & PIN** - 100% ✅
- ✅ JWT Authentication (Windows/LDAP-Login)
- ✅ **4-stelliger Freigabe-PIN**
  - PIN Setup pro User
  - Hashed storage (nie Klartext)
  - Rate Limiting (3 Versuche)
  - 30 Min. Lockout nach max. Versuchen
- ✅ "Freigeben" Button immer sichtbar (Bearbeiten optional)
- ✅ Multi-Tenancy (Company-Scoping)

### 5. **Datenmanagement** - 100% ✅
- ✅ Korrekturen in PM-Tool Datenbank gespeichert
- ✅ **Original-Daten bleiben unverändert** in Mobile App
- ✅ PDF-Versionierung funktioniert
- ✅ Audit Trail (wer, wann, was)
- ✅ Änderungsverlauf im Backend

### 6. **Branding & UI** - 100% ✅
- ✅ Montron Design (#E9573A Primärfarbe)
- ✅ Logo/SVG im Header
- ✅ Typo: SAIRA (Headlines), Work Sans (Body)
- ✅ Dark Mode Support
- ✅ Responsive Design (Desktop-first)

### 7. **Integration Mobile App** - 100% ✅
- ✅ REST API Integration
- ✅ Service Token Authentifizierung
- ✅ Employee Fetch
- ✅ Submissions Fetch (TB/RS)
- ✅ PDF Regeneration
- ✅ Presigned URLs für S3

---

## ⚠️ Was fehlt noch? (TODO)

### **KRITISCH** (Muss für MVP fertig sein)

#### 1. **Freigabe & Dateiablage** - 40% ❌
**Aufwand:** 8-10 Stunden

**Status:**
- ✅ PIN-Logik komplett
- ✅ "Freigeben" Button funktioniert
- ❌ **PDF Export in Scan-Ordner fehlt**
- ❌ **Ordnerstruktur-Erstellung fehlt**
- ❌ **Belege/Fotos kopieren fehlt**
- ❌ **Status auf RELEASED setzen fehlt**

**Was noch zu tun ist:**
```
Bei Freigabe muss erstellt werden:
\\Server\Scan-Dokumente\Industrie-Montage-Baustellen\
  <Nachname Vorname>_<YYYY-MM-DD>_<Baustelle X>\
    TB_<DATUM>_<NACHNAME>_<VORNAME>.pdf
    RS_<DATUM>_<KUNDE>.pdf (pro Kunde/Baustelle)
    FOTOS_<Datum>_<Baustelle X>\
      foto1.jpg
      beleg1.pdf
      etc.
```

**Aktueller Workaround:**
- PDFs können einzeln heruntergeladen werden
- Müssen manuell in Ordnerstruktur abgelegt werden

---

#### 2. **Validierungen & Prüfhinweise** - 20% ❌
**Aufwand:** 10-12 Stunden

**Status:**
- ✅ Backend-Framework vorhanden
- ✅ `validation_issue` Entity existiert
- ❌ **TB ↔ Streetwatch Zeit-Differenz** nicht implementiert
- ❌ **TB ↔ RS Konsistenz-Checks** nicht implementiert
- ❌ **Adressen-Abgleich (500m)** nicht implementiert
- ❌ **Prüfhinweise-Panel** in Frontend fehlt
- ❌ **Farb-Coding** (grün/gelb/rot) fehlt

**Was noch zu tun ist:**
- **TB ↔ Streetwatch:**
  - < 15 min → grün ✓
  - 15-30 min → gelb ⚠
  - ≥ 30 min → rot ✕
- **TB ↔ RS:**
  - Arbeitsbeginn muss übereinstimmen
  - Arbeitsende muss übereinstimmen
  - Pause muss übereinstimmen
  - Bei Abweichung → Warnung
- **Adressen-Plausibilität:**
  - 500m-Radius um Streetwatch-Standort
  - Innerhalb → "plausibel"
  - Außerhalb → "Abweichung > 500m"
- **UI-Panel:**
  - Kompakte Liste aktiver Abweichungen
  - Klick → Sprung zum Feld
  - Barrierefrei (Icon + Text, nicht nur Farbe)

**Aktueller Workaround:**
- Validierungen müssen manuell geprüft werden
- Keine automatische Überprüfung

---

#### 3. **Streetwatch API-Anbindung** - 30% ❌
**Aufwand:** 5-8 Stunden

**Status:**
- ✅ Spalte vorhanden und funktional
- ✅ Datenstruktur vorhanden
- ❌ **API-Anbindung fehlt**
- ❌ **Kilometer-Übernahme fehlt**

**Was noch zu tun ist:**
- API-Zugang zu Streetwatch einrichten
- Endpoints für Kennzeichen + Datum anbinden
- Kilometerstände automatisch in TB übernehmen (An/Abfahrt)
- Zeit-Entries abrufen und anzeigen

**Aktueller Workaround:**
- Streetwatch-Daten müssen manuell eingegeben werden
- Oder: Spalte bleibt leer

---

### **NICE-TO-HAVE** (Kann später gemacht werden)

#### 4. **Batch-Export** - 0% ❌
**Aufwand:** 3-4 Stunden
- Mehrfachauswahl (nur TB oder nur RS)
- Zusammengeführtes PDF

#### 5. **Foto-Galerie Enhancements** - 50% ⚠️
**Aufwand:** 2-3 Stunden
- ✅ Basic Anzeige vorhanden
- ❌ Lightbox/Zoom fehlt
- ❌ Annotation (Marker/Kreis) fehlt

#### 6. **Änderungsverlauf UI** - 30% ⚠️
**Aufwand:** 3-4 Stunden
- ✅ Daten im Backend
- ❌ Frontend-Anzeige fehlt
- ❌ User, Zeit, alt→neu Details

---

## 💰 Budget-Situation

### Übersicht
| Position | Stunden |
|----------|---------|
| **Budget Total** | **170h** |
| **Verbraucht (geschätzt)** | **~145-155h** |
| **Verbleibend** | **~15-25h** |
| **Kritische Restarbeiten** | **23-30h** |
| **⚠️ Überschreitung** | **~8-15h** |

### ⚠️ Problem
Die **kritischen** Features (Freigabe, Validierungen, Streetwatch) benötigen **mehr Zeit** als noch verfügbar ist.

---

## 🎯 Optionen für Fertigstellung

### **Option A: Alles Kritische fertig machen**
**Kosten:** +20-30 Stunden (Budget-Erweiterung nötig)  
**Liefert:**
- ✅ Freigabe mit Dateiablage komplett
- ✅ Alle Validierungen funktional
- ✅ Streetwatch API angebunden
- ✅ Voller MVP wie beschrieben
- ❌ Kein Batch-Export
- ❌ Keine erweiterte Galerie

**Empfehlung:** ⭐ **Best Value** – Liefert vollständigen MVP

---

### **Option B: Im Budget bleiben (Vereinfachungen)**
**Kosten:** ~15-20 Stunden (im Budget)  
**Liefert:**
- ✅ Freigabe (vereinfacht, einfache Ordner)
- ⚠️ Basis-Validierungen (nur TB↔Streetwatch Zeit)
- ⚠️ Streetwatch (read-only, kein Auto-Import)
- ❌ Keine erweiterten Features

**Empfehlung:** Nur wenn Budget absolut fix ist

---

### **Option C: Phase 2 Projekt**
**Kosten:** Aktuelles Budget ausschöpfen (~15h)  
**Liefert:**
- ✅ Freigabe-Flow (Basis)
- ⚠️ Rest als separates Projekt
- ❌ Unvollständiger MVP

**Empfehlung:** Nicht ideal, da MVP unvollständig

---

## 📋 Empfehlung

### **Vorgeschlagener Weg:**

1. **Budget-Erweiterung: +25 Stunden**
   - Neues Total: 195 Stunden
   - Macht: 195h ÷ 160h MVP = ~15% Mehraufwand
   - Grund: Scope Creep (PDF Versioning, Edit Mode Iterations, App Runner Migration)

2. **Zeitplan (3 Wochen):**
   - **Woche 1:** Freigabe & Dateiablage (8-10h)
   - **Woche 2:** Validierungen (10-12h)
   - **Woche 3:** Streetwatch + Polish (5-8h)

3. **Lieferung:**
   - ✅ Vollständiger MVP wie beschrieben
   - ✅ Alle kritischen Features
   - ✅ Produktionsbereit

### **Begründung für Mehraufwand:**
- **PDF Versioning:** Nicht im ursprünglichen MVP, aber sinnvoll → +10h
- **Edit Mode UX:** Mehrere Iterationen für bessere UX → +8h
- **App Runner Migration:** Infrastructure work → +5h
- **Service Token:** Extra Security Layer → +5h
- **Bugfixes & Polish:** Standard bei Entwicklung → +5h
- **TOTAL:** ~33h Mehraufwand → Realistisch bei MVP-Projekten

---

## 📊 Was Sie heute haben

### ✅ **Voll funktionsfähig:**
1. Komplette Mitarbeiterverwaltung
2. 3-Spalten Tagesansicht mit Edit-Funktion
3. TB & RS Bearbeitung mit Änderungsverfolgung
4. PDF Download & Versionierung
5. PIN-Sicherheit für Freigaben
6. Multi-Tenant System
7. Mobile App Integration

### ⚠️ **Manueller Prozess nötig:**
1. PDFs manuell downloaden & ablegen
2. Validierungen manuell prüfen
3. Streetwatch Daten manuell eingeben

### ❌ **Noch nicht vorhanden:**
1. Automatische Dateiablage
2. Automatische Validierungen
3. Streetwatch API
4. Batch-Export

---

## 🤝 Nächste Schritte

1. **Meeting:** Bericht besprechen
2. **Entscheidung:** Budget/Scope festlegen
3. **Zeitplan:** Fertigstellung planen
4. **Delivery:** MVP abschließen

---

**Stand:** 08.12.2025  
**Nächstes Update:** Nach Client-Meeting  
**Kontakt:** via Cursor AI Development

