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

#### Opzione A - Backup COMPLETO (dati + struttura)

1. Vai su https://dashboard.render.com
2. Clicca sul tuo database PostgreSQL
3. Nella sezione "Info" trovi la **External Database URL** (inizia con `postgres://`)
4. Copia quella URL
5. Usa uno di questi metodi:

**Con pgAdmin (interfaccia grafica - CONSIGLIATO):**
1. Scarica pgAdmin: https://www.pgadmin.org/download/
2. Installa e apri pgAdmin
3. Click destro su "Servers" → "Register" → "Server"
4. Nome: "Busto Battle Render"
5. Tab "Connection":
   - Host: [la parte dopo @ e prima di / nella URL]
   - Port: 5432
   - Database: [la parte dopo l'ultimo /]
   - Username: [la parte tra // e : nella URL]
   - Password: [la parte tra : e @ nella URL]
6. Una volta connesso, click destro sul database → "Backup"
7. Salva come `backup_bustobattle_2026.sql`

**Con terminale (se hai psql installato):**
```bash
pg_dump "postgres://user:password@host:5432/dbname" > backup_bustobattle_2026.sql
```

#### Opzione B - Backup SOLO STRUTTURA (senza dati)

Questo è utile per l'anno prossimo - hai le tabelle vuote pronte:

**Con pgAdmin:**
1. Click destro sul database → "Backup"
2. In "Data/Objects", seleziona solo "Schema" (non "Data")
3. Salva come `struttura_bustobattle.sql`

**Con terminale:**
```bash
pg_dump --schema-only "postgres://user:password@host:5432/dbname" > struttura_bustobattle.sql
```

#### Come DECODIFICARE la Connection String

Esempio: `postgres://bustobattle_user:AbCd1234@dpg-abc123.frankfurt-postgres.render.com:5432/bustobattle_db`

- **User**: `bustobattle_user`
- **Password**: `AbCd1234`
- **Host**: `dpg-abc123.frankfurt-postgres.render.com`
- **Port**: `5432`
- **Database**: `bustobattle_db`

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

**Con pgAdmin:**
1. Connettiti al nuovo database (vedi sopra come)
2. Click destro sul database → "Restore"
3. Seleziona il file `backup_bustobattle_2026.sql`
4. Clicca "Restore"

**Con terminale:**
```bash
psql "postgres://user:password@host:5432/dbname" < backup_bustobattle_2026.sql
```

**Oppure parti da zero** - il database si crea automaticamente all'avvio del server con tutte le tabelle vuote.

---

## 🛠️ LAVORARE SUL DATABASE "A MANO"

Puoi connetterti al database PostgreSQL di Render e fare query direttamente!

### Strumenti consigliati

1. **pgAdmin** (gratuito, interfaccia grafica completa)
   - Download: https://www.pgadmin.org/download/
   - Ideale per: vedere i dati, modificarli, esportare

2. **DBeaver** (gratuito, multi-database)
   - Download: https://dbeaver.io/download/
   - Ideale per: chi lavora con più tipi di database

3. **TablePlus** (gratuito con limiti, molto semplice)
   - Download: https://tableplus.com/
   - Ideale per: uso occasionale, interfaccia pulita

### Come connettersi

1. Vai su Render Dashboard → Database PostgreSQL
2. Copia la **External Database URL** 
3. Nel tuo client (es. pgAdmin):
   - Crea nuova connessione
   - Inserisci host, porta, user, password, database (vedi sopra come decodificare la URL)

### Query utili

**Vedere tutti gli iscritti:**
```sql
SELECT * FROM iscritti ORDER BY cognome, nome;
```

**Vedere prenotazioni prove pista:**
```sql
SELECT * FROM prove_prenotazioni ORDER BY giorno, ora;
```

**Contare iscritti per stato:**
```sql
SELECT stato, COUNT(*) FROM iscritti GROUP BY stato;
```

**Svuotare TUTTI i dati (per nuovo anno):**
```sql
-- ATTENZIONE: cancella tutto!
TRUNCATE TABLE iscritti CASCADE;
TRUNCATE TABLE prove_prenotazioni CASCADE;
TRUNCATE TABLE prove_slots CASCADE;
TRUNCATE TABLE merch_ordini CASCADE;
TRUNCATE TABLE cena_prenotazioni CASCADE;
TRUNCATE TABLE navetta_prenotazioni CASCADE;
TRUNCATE TABLE contatti CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
```

**Modificare un singolo iscritto:**
```sql
UPDATE iscritti SET stato = 'confermata' WHERE id = 123;
```

**Cancellare un iscritto:**
```sql
DELETE FROM iscritti WHERE id = 123;
```

### Tabelle principali

| Tabella | Contenuto |
|---------|-----------|
| `iscritti` | Iscrizioni alla gara |
| `prove_prenotazioni` | Prenotazioni prove pista |
| `prove_slots` | Slot disponibili prove pista |
| `merch_ordini` | Ordini merchandising |
| `cena_prenotazioni` | Prenotazioni cena |
| `navetta_prenotazioni` | Prenotazioni navetta |
| `navetta_slots` | Slot navetta disponibili |
| `risultati` | Link ai PDF risultati |
| `contatti` | Messaggi dal form contatto |
| `users` | Utenti admin |
| `push_subscriptions` | Iscrizioni notifiche push |

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
