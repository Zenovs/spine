# Weinbotschaft — Persönliche QR-Erlebnisse

Jede Weinflasche erzählt eine Geschichte. Klebe einen individuellen QR-Code auf eine Flasche, und hinterlasse dem Empfänger eine persönliche Video-Botschaft, Grussworte und ein Bild — dauerhaft und unveränderlich gespeichert.

## Features

- **QR-Codes**: Jeder Code ist einzigartig, unveränderlich nach dem Speichern
- **E-Mail-Verifizierung**: Absender bestätigt Identität via 6-stelligen Code
- **Videobotschaft**: Upload bis 200 MB (MP4/MOV/WebM) → Vercel Blob
- **Grussworte**: Persönlicher Text, permanent gespeichert
- **Bild**: Eigenes Upload oder aus 6 Weinvorlagen wählen
- **Gesperrt nach Speichern**: QR-Code ist danach unveränderlich
- **Admin-Konsole**: Erstellen, SVG-Download, Löschen, Reset

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Datenbank**: [Neon](https://neon.tech) (PostgreSQL, serverless)
- **Dateispeicher**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **E-Mail**: [Resend](https://resend.com)
- **Deployment**: [Vercel](https://vercel.com)

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen

Kopiere `.env.local.example` → `.env.local` und fülle alle Werte aus:

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL Connection String |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob Token |
| `RESEND_API_KEY` | Resend API Key |
| `EMAIL_FROM` | Absender für Verifizierungsemails |
| `ADMIN_PASSWORD` | Admin-Konsolenpasswort |
| `ADMIN_JWT_SECRET` | Zufälliger langer String für JWT |
| `NEXT_PUBLIC_BASE_URL` | Öffentliche App-URL |

### 3. Datenbank initialisieren

Nach erstem Deployment: Anmelden auf `/admin`, dann POST an `/api/admin/init`.

### 4. Lokal starten

```bash
npm run dev
```

## Deployment auf Vercel

1. Repository auf GitHub pushen
2. Projekt in Vercel importieren
3. Alle Umgebungsvariablen in Vercel eintragen
4. **Vercel Blob** im Vercel-Dashboard aktivieren (Storage → Create Store)
5. Deployen

## Benutzerflow

```
Admin erstellt QR-Code (/admin)
       ↓
QR-Code als SVG downloaden + auf Flasche kleben
       ↓
Käufer scannt QR-Code → /q/[code]/verify
       ↓
E-Mail eingeben → Verifizierungscode erhalten
       ↓
Code bestätigen → /q/[code]/create
       ↓
Video + Text + Bild hochladen → Speichern (GESPERRT)
       ↓
Empfänger scannt → /q/[code]/view (readonly)
```

## Admin-Konsole (`/admin`)

- Passwortgeschützter Zugang (JWT-Cookie, 8h gültig)
- 1–50 QR-Codes auf einmal erstellen
- Jeden Code als SVG herunterladen (korrekte URL eingebettet)
- Status-Übersicht: `pending` / `locked` / `deleted`
- Code löschen (Soft-Delete)
- Code zurücksetzen (Inhalt entfernen → Status `pending`)
