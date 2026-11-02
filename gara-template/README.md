# 🏆 Template Sito Gara Pattinaggio Freestyle

Sistema completo per gestire iscrizioni, prove pista, merchandising e comunicazioni per gare di pattinaggio freestyle.

## ✨ Funzionalità

- ✅ Iscrizioni online con pagamento (Stripe + Bonifico)
- ✅ Gestione prove pista con slot orari
- ✅ Merchandising con ordini
- ✅ Prenotazione cena atleti
- ✅ Email automatiche (conferma, sollecito, annullamento)
- ✅ Pannello amministrazione completo
- ✅ Export Excel di tutti i dati
- ✅ Multilingua IT/EN
- ✅ Push notifications
- ✅ Upload ricevute e certificati
- ✅ Generazione PDF pettorali

## 🚀 Quick Start

### 1. Installa dipendenze

```bash
npm install
```

### 2. Configura la gara

Modifica il file `config.json` con i dati della tua gara:

```json
{
  "event": {
    "name": "Nome della Tua Gara",
    "edition": "I",
    ...
  }
}
```

### 3. Configura le variabili d'ambiente

Crea un file `.env` o configura su Render:

```
DATABASE_URL=postgres://...
STRIPE_SECRET_KEY=sk_live_...
BREVO_API_KEY=xkeysib-...
VAPID_PUBLIC=...
VAPID_PRIVATE=...
```

### 4. Avvia il server

```bash
npm start
```

Il sito sarà disponibile su http://localhost:3000

---

## 📝 Personalizzazione Completa

### File da modificare

| File | Cosa modificare |
|------|-----------------|
| `config.json` | Tutti i dati della gara (nome, date, prezzi, discipline, hotel, ecc.) |
| `public/logo.png` | Logo della gara |
| `public/favicon.ico` | Icona del browser |
| `public/images/` | Immagini della location, sponsor, ecc. |
| `translations-template.js` | Testi aggiuntivi non nel config |

### config.json - Guida dettagliata

#### Sezione `event`
```json
"event": {
  "name": "Slalom Cup",           // Nome breve
  "edition": "V",                  // Numero edizione (romano)
  "fullName": "Slalom Cup V",      // Nome completo
  "year": 2027,
  "tagline": "Gara Internazionale di Pattinaggio Freestyle",
  "dates": {
    "start": "2027-11-12",         // Data inizio (YYYY-MM-DD)
    "end": "2027-11-15",           // Data fine
    "registration_deadline": "2027-11-10"  // Chiusura iscrizioni
  },
  "location": {
    "venue": "Palazzetto dello Sport",
    "city": "Milano",
    "region": "Lombardia",
    "country": "Italia",
    "address": "Via Example 1",
    "maps_url": "https://maps.google.com/?q=..."
  }
}
```

#### Sezione `branding`
```json
"branding": {
  "primary_color": "#F7AF40",      // Colore principale (header, bottoni)
  "secondary_color": "#22C55E",    // Colore secondario (successo)
  "accent_color": "#6366F1",       // Colore accento (link)
  "logo": "logo.png",              // Nome file logo in /public/
  "favicon": "favicon.ico",
  "email_from": "noreply@tuagara.com",
  "email_name": "Slalom Cup",
  "contact_email": "info@tuagara.com"
}
```

#### Sezione `disciplines`
```json
"disciplines": [
  { "id": "speed", "name": "Speed Slalom", "stars": 1, "enabled": true },
  { "id": "classic", "name": "Classic Slalom", "stars": 1, "enabled": true },
  { "id": "battle", "name": "Battle", "stars": 1, "enabled": true },
  { "id": "slides", "name": "Slides", "stars": 2, "enabled": true },
  { "id": "pair", "name": "Pair Slalom", "stars": 2, "enabled": false },  // Disabilitata
  { "id": "jump", "name": "Free Jump", "stars": 2, "enabled": true }
]
```
- `stars`: 1 = disciplina base, 2 = disciplina avanzata (prezzi diversi)
- `enabled`: true/false per mostrare/nascondere

#### Sezione `pricing`
```json
"pricing": {
  "currency": "EUR",
  "registration": {
    "base_fee": 25,              // Quota base iscrizione
    "per_discipline_1star": 5,   // Costo per disciplina 1 stella
    "per_discipline_2star": 10,  // Costo per disciplina 2 stelle
    "late_fee": 10,              // Supplemento iscrizione tardiva
    "late_fee_date": "2027-11-01"  // Data dopo cui si applica
  },
  "track_practice": {
    "per_session": 5             // Costo per sessione prova pista
  },
  "merchandise": {
    "tshirt": 25,
    "hoodie": 45,
    "towel": 15,
    "cap": 12
  },
  "dinner": {
    "per_person": 20
  }
}
```

#### Sezione `features`
```json
"features": {
  "registration": true,        // Iscrizioni online
  "track_practice": true,      // Prove pista
  "merchandise": true,         // Vendita gadget
  "dinner_reservation": true,  // Prenotazione cena
  "shuttle": false,            // Servizio navetta (disabilitato)
  "results": true,             // Pagina risultati
  "push_notifications": true   // Notifiche push
}
```

#### Sezione `payment`
```json
"payment": {
  "bank_transfer": {
    "enabled": true,
    "iban": "IT00X0000000000000000000000",
    "bic": "EXAMPLEXX",
    "beneficiary": "ASD La Tua Associazione",
    "reference_prefix": "GARA2027-"
  },
  "stripe": {
    "enabled": true
  },
  "cash_on_site": {
    "enabled": true
  }
}
```

---

## 🖼️ Immagini da sostituire

Crea una cartella `public/images/` e aggiungi:

| File | Dimensioni | Uso |
|------|------------|-----|
| `logo.png` | 200x200 px | Logo header e email |
| `hero-bg.jpg` | 1920x800 px | Sfondo homepage |
| `venue.jpg` | 800x600 px | Foto location |
| `map.png` | 600x400 px | Mappa come arrivare |

---

## 📧 Configurazione Email (Brevo)

1. Vai su https://app.brevo.com
2. Crea un account gratuito (300 email/giorno)
3. Vai su SMTP & API → API Keys
4. Crea una nuova API key
5. Inseriscila in `BREVO_API_KEY`

---

## 💳 Configurazione Stripe

1. Vai su https://dashboard.stripe.com
2. Crea un account
3. In Developers → API Keys, copia la Secret Key
4. Inseriscila in `STRIPE_SECRET_KEY`

**Per testare**: usa `sk_test_...` (nessun addebito reale)
**Per produzione**: usa `sk_live_...`

---

## 🌐 Deploy su Render

1. Crea un repo GitHub con questo codice
2. Vai su https://dashboard.render.com
3. "New +" → "Web Service" → Connetti GitHub
4. Configurazione:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Aggiungi Environment Variables (DATABASE_URL, STRIPE_SECRET_KEY, ecc.)
6. "New +" → "PostgreSQL" per il database
7. Copia Internal Database URL in DATABASE_URL del web service

---

## 🔧 Comandi Utili

```bash
# Avvio sviluppo locale
npm start

# Genera nuove chiavi VAPID per push notifications
npx web-push generate-vapid-keys

# Test email (richiede BREVO_API_KEY)
curl -X POST http://localhost:3000/api/test-email
```

---

## 📁 Struttura Progetto

```
gara-template/
├── config.json          # ⭐ CONFIGURAZIONE PRINCIPALE
├── server.js            # Backend Node.js
├── package.json         # Dipendenze
├── README.md            # Questa guida
├── public/
│   ├── index.html       # Homepage
│   ├── iscrizioni.html  # Form iscrizione
│   ├── admin.html       # Pannello admin
│   ├── config-loader.js # Carica config nel frontend
│   ├── translations-template.js # Traduzioni
│   ├── app.js           # JavaScript frontend
│   └── images/          # Immagini personalizzate
├── fonts/               # Font per PDF
└── db/                  # Database SQLite (sviluppo)
```

---

## ❓ FAQ

**D: Posso aggiungere nuove discipline?**
R: Sì, aggiungi un oggetto nell'array `disciplines` del config.json

**D: Come cambio i colori?**
R: Modifica `branding.primary_color`, `secondary_color`, `accent_color` nel config.json

**D: Posso disabilitare il merchandising?**
R: Sì, metti `"merchandise": false` in `features`

**D: Come aggiungo nuovi hotel?**
R: Aggiungi oggetti nell'array `hotels` del config.json

---

## 📞 Supporto

Per problemi tecnici:
1. Controlla i log su Render Dashboard → Logs
2. Cerca l'errore su Google
3. Chiedi a ChatGPT/Claude con il messaggio di errore

---

Creato con ❤️ per la community del pattinaggio freestyle
