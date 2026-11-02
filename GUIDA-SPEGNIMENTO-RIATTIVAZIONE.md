# Busto Battle XI - Guida Spegnimento e Riattivazione

## 📋 SERVIZI ATTIVI E COSTI

### 1. Render.com (Hosting Web)
- **Cosa fa**: Ospita il sito web e il server Node.js
- **URL Dashboard**: https://dashboard.render.com
- **Piano attuale**: Probabilmente "Free" o "Starter" ($7/mese)
- **Database**: PostgreSQL su Render
- **Azione per spegnere**: Vai su Dashboard → Seleziona il servizio → Settings → Delete Service
- **IMPORTANTE**: Prima di cancellare, ESPORTA IL DATABASE (vedi sotto)

### 2. Dominio bustobattle.com
- **Dove registrato**: Verifica dove hai comprato il dominio (GoDaddy, Namecheap, Aruba, ecc.)
- **Costo**: ~10-15€/anno
- **Azione**: Puoi lasciarlo attivo (costa poco) o lasciarlo scadere e ricomprarlo l'anno prossimo
- **CONSIGLIO**: Tienilo attivo per non perderlo

### 3. Brevo (Email transazionali)
- **Cosa fa**: Invia le email di conferma iscrizione, solleciti, ecc.
- **URL Dashboard**: https://app.brevo.com
- **Piano**: Probabilmente Free (300 email/giorno)
- **Azione**: Non serve fare niente, il piano free non costa. Puoi lasciarlo così.

### 4. Stripe (Pagamenti)
- **Cosa fa**: Gestisce i pagamenti con carta
- **URL Dashboard**: https://dashboard.stripe.com
- **Costo**: Solo commissioni sulle transazioni (nessun costo fisso)
- **Azione**: Non serve fare niente, non costa se non ci sono transazioni

### 5. GitHub (Codice sorgente)
- **Repo**: https://github.com/Cato1978/BB2026
- **Costo**: Gratuito
- **Azione**: NON TOCCARE - qui c'è tutto il codice, serve per riattivare

---

## 🔴 PROCEDURA DI SPEGNIMENTO

### Step 1: Esporta i dati (IMPORTANTE!)

Prima di spegnere qualsiasi cosa, scarica tutti i dati:

1. **Iscritti**: Vai su https://bustobattle.com/admin.html → Tab Iscritti → "Esporta Excel"
2. **Prove Pista**: Tab Prove Pista → "Esporta Excel"
3. **Merchandising**: Tab Merchandising → "Esporta Excel" (se c'è)

Salva questi file Excel in una cartella sicura (es: Google Drive, Dropbox).

### Step 2: Backup Database PostgreSQL

Opzione A - Da Render Dashboard:
1. Vai su https://dashboard.render.com
2. Clicca sul tuo database PostgreSQL
3. Cerca "Backups" o "Export"
4. Scarica un backup .sql

Opzione B - Da terminale (se hai psql installato):
```bash
pg_dump "la-tua-connection-string" > backup_bustobattle_2026.sql
```

### Step 3: Spegni Render

1. Vai su https://dashboard.render.com
2. **Prima** cancella il Web Service (il server Node.js)
3. **Poi** cancella il Database PostgreSQL
4. Conferma le cancellazioni

### Step 4: DNS del dominio (opzionale)

Se tieni il dominio attivo ma spegni Render:
1. Vai nel pannello del tuo registrar (dove hai comprato bustobattle.com)
2. Rimuovi i record DNS che puntano a Render
3. Opzionale: metti una pagina "Ci vediamo l'anno prossimo!" su un hosting gratuito

---

## 🟢 PROCEDURA DI RIATTIVAZIONE

### Prerequisiti
- Account GitHub con accesso a https://github.com/Cato1978/BB2026
- Account Render.com
- Account Brevo (per le email)
- Account Stripe (per i pagamenti)

### Step 1: Crea nuovo servizio su Render

1. Vai su https://dashboard.render.com
2. Clicca "New +" → "Web Service"
3. Connetti il repo GitHub: `Cato1978/BB2026`
4. Configurazione:
   - **Name**: bustobattle (o quello che vuoi)
   - **Region**: Frankfurt (EU)
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free o Starter ($7/mese per performance migliori)

### Step 2: Crea Database PostgreSQL

1. Su Render, clicca "New +" → "PostgreSQL"
2. Configurazione:
   - **Name**: bustobattle-db
   - **Region**: Frankfurt (stessa del web service)
   - **Plan**: Free (90 giorni) o Starter ($7/mese)
3. Dopo la creazione, copia la "Internal Database URL"

### Step 3: Configura le Variabili d'Ambiente

Nel Web Service su Render, vai su "Environment" e aggiungi:

```
DATABASE_URL = [la Internal Database URL copiata sopra]
STRIPE_SECRET_KEY = sk_live_xxxxx (la tua chiave Stripe live)
STRIPE_WEBHOOK_SECRET = whsec_xxxxx (opzionale, per webhook)
BREVO_API_KEY = xkeysib-xxxxx (la tua API key Brevo)
BREVO_FROM = noreply@bustobattle.com
VAPID_PUBLIC = [la chiave pubblica per push notifications]
VAPID_PRIVATE = [la chiave privata per push notifications]
SESSION_SECRET = una-stringa-segreta-lunga-a-caso
```

### Step 4: Configura il Dominio

1. Su Render, nel Web Service vai su "Settings" → "Custom Domains"
2. Aggiungi `bustobattle.com` e `www.bustobattle.com`
3. Render ti darà i record DNS da configurare
4. Vai nel pannello del tuo registrar e aggiungi/modifica i record DNS:
   - Tipo: CNAME
   - Nome: @ (o bustobattle.com)
   - Valore: [quello che ti da Render, tipo xxx.onrender.com]

### Step 5: Importa i dati (se necessario)

Se vuoi ripristinare i dati dell'anno precedente:
1. Connettiti al database con un client PostgreSQL
2. Esegui il file di backup: `psql "connection-string" < backup_bustobattle_2026.sql`

Oppure parti da zero (il database si crea automaticamente all'avvio).

### Step 6: Verifica

1. Vai su https://bustobattle.com
2. Verifica che il sito carichi
3. Prova il login admin: `/login.html` (admin / admin123)
4. Cambia la password admin!

---

## 🔑 CREDENZIALI DA CONSERVARE

Salva queste credenziali in un posto sicuro (es: password manager):

### Render
- Email: [la tua email]
- Password: [la tua password]

### GitHub
- Username: Cato1978
- Password/Token: [la tua password o token]

### Stripe
- Email: [email account Stripe]
- Chiave Live: sk_live_xxxxx
- Chiave Test: sk_test_xxxxx

### Brevo
- Email: [email account Brevo]
- API Key: xkeysib-xxxxx

### Dominio (registrar)
- Provider: [GoDaddy/Namecheap/Aruba/altro]
- Email: [la tua email]
- Password: [la tua password]

### Admin sito
- URL: https://bustobattle.com/login.html
- Username: admin
- Password: admin123 (CAMBIALA!)

---

## 📁 STRUTTURA DEL PROGETTO

```
BB2026/
├── server.js          # Server Node.js principale (tutto il backend)
├── package.json       # Dipendenze npm
├── public/            # File statici (HTML, CSS, JS, immagini)
│   ├── index.html     # Homepage
│   ├── admin.html     # Pannello admin
│   ├── iscrizioni.html # Form iscrizione
│   ├── app.js         # JavaScript frontend
│   ├── translations.js # Traduzioni IT/EN
│   └── ...
├── db/                # Database SQLite locale (solo sviluppo)
├── fonts/             # Font per PDF
└── uploads/           # File caricati (ricevute, certificati)
```

---

## ⚠️ NOTE IMPORTANTI

1. **Il codice è tutto su GitHub** - non perderai mai il sito finché il repo esiste
2. **I dati sono su PostgreSQL** - ESPORTA SEMPRE prima di cancellare
3. **Le email passano da Brevo** - senza API key configurata, niente email
4. **I pagamenti passano da Stripe** - in modalità test non addebita davvero
5. **Il dominio è separato** - anche se spegni Render, il dominio resta tuo

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla i log su Render Dashboard → Logs
2. Cerca l'errore su Google
3. Chiedi a ChatGPT/Claude con il messaggio di errore

Ultima modifica: Novembre 2026
