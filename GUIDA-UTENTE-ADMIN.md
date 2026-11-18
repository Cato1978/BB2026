# GUIDA UTENTE E ADMIN - Busto Battle XI

**Versione:** 2.0  
**Data:** 18 Novembre 2026

---

## INDICE

1. [Per gli Utenti (Atleti)](#per-gli-utenti-atleti)
2. [Per gli Admin](#per-gli-admin)

---

## PER GLI UTENTI (ATELTI)

### Iscrizione alla Gara

#### 1. Accesso alla pagina iscrizioni
- Aprire: `https://bustobattle.it/iscrizioni.html`
- Compilare i dati personali (nome, cognome, data di nascita, società)
- Inserire World Skate ID o Skate Italia Card (almeno uno obbligatorio)

#### 2. Scelta discipline
- Selezionare le discipline desiderate:
  - ⭐ Speed Slalom
  - ⭐ Classic Slalom
  - ⭐ Battle
  - ⭐⭐ Slides
  - ⭐⭐ Pair Slalom
  - ⭐⭐ Free Jump
- Selezionare la categoria (U15, U19, SENIOR)

#### 3. Prenotazione prove pista (opzionale)
- Selezionare gli slot orari disponibili
- Scegliere la disciplina per ogni slot
- Costo: €5 per ogni slot

#### 4. pagamento
- **Opzione A: Bonifico**
  - Cliccare "Iscrievi e paga con Bonifico"
  - Riceverai email con IBAN e causale
  - Caricare la ricevuta online
  - Pagamento effettivo al ritiro in loco

- **Opzione B: Contanti**
  - Pagare in loco al momento del ritiro

#### 5. Verifica iscrizione
- Aprire: `https://bustobattle.it/verifica.html`
- Inserire cognome e numero iscrizione
- Visualizzare stato e dettagli

### Prove Pista

#### 1. Accesso alla pagina prove
- Aprire: `https://bustobattle.it/prove.html`
- Compilare email e telefono di contatto

#### 2. Aggiungi atleta
- Cliccare "Aggiungi Atleta"
- Compilare nome e cognome
- Selezionare slot e disciplina
- Ripetere per più atleti

#### 3. Pagamento
- Pagare con bonifico (riceverai istruzioni via email)
- Oppure pagare in loco al ritiro

### Merchandising

#### 1. Accesso alla pagina merch
- Aprire: `https://bustobattle.it/merch.html`

#### 2. Ordina articoli
- Selezionare maglia, felpa, cappellino, asciugamano
- Scegliere taglia
- Sottoscrivere ordine
- Pagamento al ritiro in loco

### Cena Atleti

#### 1. Prenotazione
- Compilare modulo prenotazione
- Selezionare data e numero partecipanti
- Ricevere conferma via email

---

## PER GLI ADMIN

### Accesso al Pannello Admin

#### 1. Login
- Aprire: `https://bustobattle.it/login.html`
- Credenziali default: `admin` / `admin123`
- **Importante:** Cambiare password al primo accesso!

#### 2. Panoramica
Il pannello admin ha 11 sezioni:

| Tab | Descrizione |
|-----|-------------|
| 📥 Export | Esportazione dati Excel/PDF |
| 📋 Iscritti | Gestione iscrizioni |
| Prove Pista | Gestione prove e slot |
| 💰 Bilancio | Incassi e statistiche |
| 🛍️ Merch | Ordini merchandising |
| 📢 Notifiche | Invio email/push |
| 📄 Pagine | Attivazione pagine |

### Gestione Iscritti

#### Visualizzazione
- Filtrare per pagamento, navetta, stato
- Cercare per nome, cognome o codice
- Visualizzare disciplina, costo, metodo pagamento

#### Azioni
- **Conferma bonifico** - Verificare ricevuta e confermare
- **Rifiuta bonifico** - Se ricevuta non valida
- **Sollecita** - Inviare sollecito via email
- **Modifica** - Modificare dati atleta
- **Elimina** - Rimuovere iscrizione (con conferma)

### Gestione Prove Pista

#### Configurazione Slot
- Modificare posti disponibili per ogni slot
- Non si possono ridurre sotto le prenotazioni esistenti

#### Gestione Prenotazioni
- Filtrare per stato (sospesa, verifica, confermata)
- Confermare/rifiutare prenotazioni
- Visualizzare dettagli disciplina/orario

### Esportazione Dati

#### 1. Excel Iscritti Completo
- Cliccare "📥 Scarica Excel" nella sezione Export
- File con fogli separati per disciplina/categoria
- Include: nome, cognome, nazionalità, discipline, maglia, felpa

#### 2. PDF Elenco Iscritti
- Cliccare "📄 Scarica PDF"
- PDF stampabile con bandiere nazionali
- Ordinato per cognome/nome

#### 3. Excel Check-in
- Cliccare "🧾 Scarica Excel Check-in"
- File per il day-of-event check-in
- Include: nome, cognome, discipline, prove pista, merchandising

### Invio Email

#### Email a singoli
- Selezionare atleta
- Cliccare "📧 Invia Email"
- Selezionare modello (conferma, bonifico, sollecito, annullamento)

#### Email di massa
- Aprire tab "Notifiche"
- Comporre email con template
- Inviare a tutti gli iscritti o solo confermati

### Statistiche Bilancio

#### Viste disponibili
- **Totale Generale** - Somma di iscrizioni, prove, merch
- **Iscrizioni** - Dettaglio per disciplina
- **Prove Pista** - Incasso per slot/orario
- **Merchandising** - Ordini per articolo/taglia

#### Aggiornamento
- Cliccare "🔄 Aggiorna Bilancio"
- Dati in tempo reale

### Gestione Merchandising

#### Ordini Merch
- Visualizzare tutti gli ordini
- Filtrare per stato
- Aggiornare note admin

#### Ordini Stampati
- Gestire ordini al fornitore
- Registrare quantità per maglia/felpa/accessori
- Dati visibili nell'export Excel

### Gestione Pagine

#### Attivazione
- Attivare/disattivare pagine pubbliche
- Mostrare/nascovere dal menu

### Notifiche Push

#### Configurazione
- Generare VAPID keys: `npx web-push generate-vapid-keys`
- Impostare in environment:
  ```
  VAPID_PUBLIC=...
  VAPID_PRIVATE=...
  ```

#### Invio Notifica
- Aprire tab "Notifiche"
- Compilare titolo e messaggio
- Cliccare "Invia Push"

---

## troubleshooting

### Login admin non funziona
- Verificare credenziali (default: admin/admin123)
- Se password persa, reset via database
- Controllare sessione scaduta

### Dati non aggiornati
- Riavvicinare la pagina (F5)
- Verificare connessione database
- Controllare console browser per errori

### Email non ricevute
- Verificare cartelle Spam/Promozioni
- Controllare Brevo API key
- Verificare email nel database

### Export non funziona
- Verificare permessi admin
- Controllare dimensioni dati
- Riprovare più tardi

---

## SHORTCUT UTILI

|shortcut|Azion|
|--------|------|
| `admin.html`|Pannello admin principale|
| `admin.html#export`|Sezione export (con hash)|
| `admin.html?tab=prove`|Aprire tab prove (con query param)|

---

## CONTATTI

Per supporto tecnico:  
📧 bustobattle@gmail.com  
GitHub: [Cato1978/BB2026](https://github.com/Cato1978/BB2026)

---

## VERSIONI

- **v2.0** (18 Nov 2026) - Best practices OWASP + Quality
- **v1.0** - Release iniziale
