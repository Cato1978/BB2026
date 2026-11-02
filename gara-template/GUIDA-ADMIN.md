# 🔧 GUIDA ADMIN - Configurazione Sito Gara

Guida tecnica per configurare il sito per una nuova gara o un nuovo anno del Busto Battle.

---

## 📋 INDICE

1. [Prerequisiti](#prerequisiti)
2. [Setup Iniziale](#setup-iniziale)
3. [Configurazione config.json](#configurazione-configjson)
4. [Servizi Esterni](#servizi-esterni)
5. [Deploy su Render](#deploy-su-render)
6. [Configurazione Dominio](#configurazione-dominio)
7. [Manutenzione Annuale](#manutenzione-annuale)
8. [Troubleshooting](#troubleshooting)

---

## 1. PREREQUISITI

### Account necessari (tutti gratuiti o con piano free)
- [ ] **GitHub** - per il codice sorgente
- [ ] **Render.com** - per hosting e database
- [ ] **Brevo** (ex Sendinblue) - per le email transazionali
- [ ] **Stripe** - per i pagamenti con carta

### Software sul tuo PC (opzionale, per sviluppo locale)
- Node.js 18+ (https://nodejs.org)
- Git (https://git-scm.com)
- Un editor di codice (VS Code consigliato)

---

## 2. SETUP INIZIALE

### Opzione A: Nuova gara da zero

1. **Crea un nuovo repository GitHub**
   - Vai su https://github.com/new
   - Nome: `nome-gara-anno` (es: `slalom-cup-2027`)
   - Privato o pubblico a tua scelta

2. **Carica il template**
   - Copia tutto il contenuto della cartella `gara-template/`
   - Pusha sul nuovo repository

3. **Personalizza i file** (vedi sezione successiva)

### Opzione B: Nuovo anno Busto Battle

1. **Aggiorna il repository esistente**
   ```bash
   git pull origin main
   ```

2. **Modifica config.json** con le nuove date e prezzi

3. **Svuota il database** (vedi sezione Manutenzione)

4. **Aggiorna immagini** se necessario

---

## 3. CONFIGURAZIONE config.json

Il file `config.json` è il cuore della configurazione. Ecco tutte le sezioni:

### 🏆 Sezione `event` - Dati gara

```json
"event": {
  "name": "Busto Battle",           // Nome breve
  "edition": "XII",                  // Numero edizione (romano)
  "fullName": "Busto Battle XII",    // Nome completo (mostrato ovunque)
  "year": 2027,
  "tagline": "Gara Internazionale di Pattinaggio Freestyle",
  "dates": {
    "start": "2027-11-13",           // FORMATO: YYYY-MM-DD
    "end": "2027-11-16",
    "registration_deadline": "2027-11-10"
  },
  "location": {
    "venue": "PalaCastiglioni",
    "city": "Busto Arsizio",
    "region": "Lombardia",
    "country": "Italia",
    "address": "Via Piemonte, 21052",
    "maps_url": "https://maps.google.com/?q=PalaCastiglioni+Busto+Arsizio"
  }
}
```

### 🎨 Sezione `branding` - Colori e loghi

```json
"branding": {
  "primary_color": "#F7AF40",      // Colore principale (arancione BB)
  "secondary_color": "#22C55E",    // Verde (conferme, successo)
  "accent_color": "#6366F1",       // Viola (accenti)
  "logo": "logo.png",              // File in /public/
  "favicon": "favicon.ico",
  "email_from": "noreply@bustobattle.com",
  "email_name": "Busto Battle",
  "contact_email": "bustobattle@gmail.com"
}
```

### 🏅 Sezione `disciplines` - Discipline

```json
"disciplines": [
  { "id": "speed", "name": "Speed Slalom", "stars": 1, "enabled": true },
  { "id": "classic", "name": "Classic Slalom", "stars": 1, "enabled": true },
  { "id": "battle", "name": "Battle", "stars": 1, "enabled": true },
  { "id": "slides", "name": "Slides", "stars": 2, "enabled": true },
  { "id": "pair", "name": "Pair Slalom", "stars": 2, "enabled": true },
  { "id": "jump", "name": "Free Jump", "stars": 2, "enabled": true }
]
```
- **stars**: 1 = base (€5), 2 = avanzata (€10) - vedi pricing
- **enabled**: `false` per nascondere una disciplina

### 💰 Sezione `pricing` - Prezzi

```json
"pricing": {
  "currency": "EUR",
  "registration": {
    "base_fee": 25,              // Quota base iscrizione
    "per_discipline_1star": 5,   // Costo disciplina 1 stella
    "per_discipline_2star": 10,  // Costo disciplina 2 stelle
    "late_fee": 10,              // Supplemento ritardatari
    "late_fee_date": "2027-11-01"  // Data inizio supplemento
  },
  "track_practice": {
    "per_session": 5             // Costo sessione prova pista
  },
  "merchandise": {
    "tshirt": 25,
    "hoodie": 45
  },
  "dinner": {
    "per_person": 20
  }
}
```

### 📅 Sezione `schedule` - Programma

```json
"schedule": {
  "days": [
    {
      "date": "2027-11-13",
      "name": "Giovedì",
      "events": [
        { "time": "14:00-20:00", "activity": "Prove Pista" },
        { "time": "18:00-20:00", "activity": "Ritiro Pettorali" }
      ]
    },
    {
      "date": "2027-11-14",
      "name": "Venerdì",
      "events": [
        { "time": "09:00-13:00", "activity": "Speed Slalom Qualifiche" },
        { "time": "14:00-18:00", "activity": "Classic Qualifiche" },
        { "time": "20:30", "activity": "Cena Atleti", "details": "Ristorante XYZ" }
      ]
    }
  ]
}
```

### 🏨 Sezione `hotels` - Hotel convenzionati

```json
"hotels": [
  {
    "name": "Hotel & Residence & SPA",
    "stars": 4,
    "address": "Via Roma 10, Busto Arsizio",
    "phone": "+39 0331 123456",
    "email": "info@hotel.com",
    "website": "https://www.hotel.com",
    "distance": "500m dalla pista",
    "discount_code": "BUSTOBATTLE2027",
    "discount_percent": 10
  }
]
```

### 💳 Sezione `payment` - Metodi pagamento

```json
"payment": {
  "bank_transfer": {
    "enabled": true,
    "iban": "IT60X0542811101000000123456",
    "bic": "BLOPIT22",
    "beneficiary": "ASD Rollerblade Busto Arsizio",
    "reference_prefix": "BB2027-"
  },
  "stripe": {
    "enabled": true
  },
  "cash_on_site": {
    "enabled": true
  }
}
```

### ⚙️ Sezione `features` - Funzionalità on/off

```json
"features": {
  "registration": true,        // Iscrizioni online
  "track_practice": true,      // Prove pista
  "merchandise": true,         // Shop gadget
  "dinner_reservation": true,  // Prenotazione cena
  "shuttle": false,            // Navetta (disabilitata)
  "results": true,             // Pagina risultati
  "push_notifications": true   // Notifiche push
}
```

---

## 4. SERVIZI ESTERNI

### 📧 Brevo (Email)

1. Vai su https://app.brevo.com → Registrati
2. Verifica la tua email
3. Vai su **SMTP & API** → **API Keys**
4. Clicca **Generate a new API key**
5. Copia la chiave (inizia con `xkeysib-`)
6. Salvala come `BREVO_API_KEY` su Render

**Nota**: Piano free = 300 email/giorno, sufficiente per la gara.

### 💳 Stripe (Pagamenti)

1. Vai su https://dashboard.stripe.com → Registrati
2. Completa la verifica del conto (richiede dati azienda/associazione)
3. Vai su **Developers** → **API keys**
4. Copia:
   - `Publishable key` (pk_live_...) - per il frontend
   - `Secret key` (sk_live_...) - per il server
5. Salva `STRIPE_SECRET_KEY` su Render

**Per testare**: Usa le chiavi `pk_test_` e `sk_test_` (nessun addebito reale)

### 🔔 Push Notifications (VAPID)

Genera nuove chiavi:
```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BKmSLTMCb78...
Private Key: C2DhpRwo6SL...
```

Salva entrambe su Render come `VAPID_PUBLIC` e `VAPID_PRIVATE`.

---

## 5. DEPLOY SU RENDER

### Primo deploy

1. **Vai su https://dashboard.render.com**

2. **Crea il Database PostgreSQL**
   - "New +" → "PostgreSQL"
   - Name: `bustobattle-db`
   - Region: Frankfurt (EU Central)
   - Plan: Free (90 giorni) o Starter ($7/mese)
   - Clicca "Create Database"
   - **Copia la "Internal Database URL"**

3. **Crea il Web Service**
   - "New +" → "Web Service"
   - Connetti il tuo repository GitHub
   - Configurazione:
     - Name: `bustobattle`
     - Region: Frankfurt
     - Branch: `main`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: Free o Starter

4. **Configura Environment Variables**
   - Vai su "Environment" e aggiungi:
   
   | Variabile | Valore |
   |-----------|--------|
   | `DATABASE_URL` | La Internal Database URL copiata |
   | `STRIPE_SECRET_KEY` | `sk_live_...` o `sk_test_...` |
   | `BREVO_API_KEY` | `xkeysib-...` |
   | `BREVO_FROM` | `noreply@bustobattle.com` |
   | `VAPID_PUBLIC` | La chiave pubblica generata |
   | `VAPID_PRIVATE` | La chiave privata generata |
   | `SESSION_SECRET` | Una stringa casuale lunga |

5. **Clicca "Manual Deploy" → "Deploy latest commit"**

6. **Attendi 2-3 minuti** per il build

7. **Testa** andando su `https://tuosito.onrender.com`

---

## 6. CONFIGURAZIONE DOMINIO

### Su Render

1. Nel tuo Web Service → "Settings" → "Custom Domains"
2. Clicca "Add Custom Domain"
3. Inserisci `bustobattle.com` (o il tuo dominio)
4. Render ti mostrerà i record DNS da configurare

### Sul tuo Registrar (dove hai comprato il dominio)

Aggiungi questi record DNS:

| Tipo | Nome | Valore |
|------|------|--------|
| CNAME | @ | `tuosito.onrender.com` |
| CNAME | www | `tuosito.onrender.com` |

**Nota**: La propagazione DNS può richiedere fino a 48 ore (di solito 1-2 ore).

---

## 7. MANUTENZIONE ANNUALE

### Checklist nuovo anno

- [ ] Aggiorna `config.json` con nuove date
- [ ] Aggiorna prezzi se necessario
- [ ] Aggiorna programma
- [ ] Verifica hotel convenzionati
- [ ] Svuota database (vedi sotto)
- [ ] Aggiorna immagini/logo se cambiati
- [ ] Testa iscrizione completa
- [ ] Testa pagamento (in modalità test)
- [ ] Testa email

### Svuotare il database per nuovo anno

Connettiti al database con pgAdmin e esegui:

```sql
-- ATTENZIONE: cancella TUTTI i dati!
TRUNCATE TABLE iscritti CASCADE;
TRUNCATE TABLE prove_prenotazioni CASCADE;
TRUNCATE TABLE prove_slots CASCADE;
TRUNCATE TABLE merch_ordini CASCADE;
TRUNCATE TABLE cena_prenotazioni CASCADE;
TRUNCATE TABLE navetta_prenotazioni CASCADE;
TRUNCATE TABLE contatti CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE risultati CASCADE;

-- Ricrea gli slot prove pista (modifica date e orari)
INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, posti_max, location) VALUES
('2027-11-13', '14:00', '14:30', 20, 'PalaCastiglioni'),
('2027-11-13', '14:30', '15:00', 20, 'PalaCastiglioni'),
-- ... aggiungi tutti gli slot necessari
```

### Backup prima di svuotare

```sql
-- Esporta tutti i dati prima
pg_dump "DATABASE_URL" > backup_bb2026.sql
```

---

## 8. TROUBLESHOOTING

### Il sito non carica
1. Controlla i log su Render → Logs
2. Verifica che le variabili d'ambiente siano configurate
3. Verifica che il database sia attivo

### Le email non arrivano
1. Verifica `BREVO_API_KEY` sia corretta
2. Controlla la cartella spam del destinatario
3. Verifica su Brevo → Logs se l'email è stata inviata

### Pagamenti Stripe non funzionano
1. Verifica di usare la chiave corretta (test vs live)
2. Controlla su Stripe Dashboard → Payments
3. In test mode, usa carta `4242 4242 4242 4242`

### Errore "column does not exist"
Il database ha una struttura diversa dal codice. Opzioni:
1. Aggiungi la colonna manualmente via pgAdmin
2. Ricrea il database (perdi i dati)

### Il deploy fallisce
1. Controlla i log di build su Render
2. Verifica che `package.json` sia corretto
3. Testa in locale con `npm install && npm start`

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla questa guida
2. Cerca l'errore su Google
3. Chiedi a ChatGPT/Claude con il messaggio di errore esatto

---

*Ultima modifica: Novembre 2026*
