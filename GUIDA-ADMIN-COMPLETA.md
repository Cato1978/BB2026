# 📋 Guida Completa Admin - Busto Battle XI

---

## 🔐 Accesso Admin

1. Vai su **https://bustobattle.com/login.html**
2. Inserisci le credenziali (admin / admin123)
3. Verrai reindirizzato al pannello admin

---

## 👥 GESTIONE ISCRIZIONI

### Visualizzare le Iscrizioni

Nel pannello admin vedrai la lista di tutti gli iscritti con:
- Nome e cognome
- Discipline scelte
- Totale da pagare
- Metodo di pagamento
- Stato (in attesa, confermata, etc.)

### Costo Iscrizioni

| Voce | Costo | Pagamento |
|------|-------|-----------|
| Prima disciplina | €50 | Bonifico/Carta |
| Ogni disciplina aggiuntiva | €30 | Bonifico/Carta |
| Felpa | €35 | **Contanti** |
| Cappellino | €5 | **Contanti** |
| Asciugamano | €5 | **Contanti** |
| Prove pista (per slot) | €5 | **Contanti** |

**⚠️ IMPORTANTE**: Felpa, cappellino, asciugamano e prove pista incluse nell'iscrizione si pagano **SEMPRE IN CONTANTI** alla gara.

### Stati di un'Iscrizione

| Stato | Significato |
|-------|-------------|
| 🟡 In attesa | Iscritto ma non ha ancora pagato |
| 🟢 Confermata | Pagamento ricevuto e verificato |
| 🔴 Rigettata | Ricevuta non valida |
| ⚪ Annullata | Iscrizione cancellata |

### Confermare un Pagamento (Bonifico)

1. Trova l'iscrizione con "Ricevuta caricata"
2. Clicca **"👁️ Vedi"** per vedere la ricevuta
3. Verifica importo e causale
4. Clicca **"✅ Conferma"** se tutto ok

### Impostare Pagamento in Contanti

Se un atleta deve pagare TUTTO in contanti alla gara:

1. Trova l'iscrizione nella lista
2. Clicca **"✏️ Modifica"**
3. Metodo Pagamento → seleziona **"Contanti"**
4. Clicca **"Salva"**

**⚠️ Le iscrizioni con metodo "Contanti" vengono ESCLUSE dal Bilancio Bando.**

---

# ✅ CHECK-IN (SEZIONE IMPORTANTE)

Il check-in è fondamentale il giorno della gara per registrare gli arrivi e gestire i pagamenti in contanti.

## Accedere al Check-in

1. Dal pannello admin → clicca **"✅ Check-in"**
2. Oppure vai su **https://bustobattle.com/check-in.html**

## Schermata Check-in

Per ogni atleta vedrai:
- **Dati personali**: Nome, codice (es. BB11-0042), nazione
- **Discipline**: elenco gare a cui è iscritto
- **Merch**: felpa, cappellino, asciugamano ordinati
- **Prove Pista**: slot prenotati
- **Stato pagamento**: cosa è già pagato e cosa deve pagare

## Procedura Check-in Standard

### Caso 1: Atleta ha già pagato tutto con bonifico

1. Cerca l'atleta per nome o codice
2. Verifica che lo stato mostri "✅ Pagato"
3. Consegna eventuale merch (felpa, cappellino)
4. Clicca **"✅ Check-in"**

### Caso 2: Atleta deve pagare qualcosa in contanti

1. Cerca l'atleta
2. Leggi il riepilogo:
   ```
   Iscrizione (2 discipline): €80 ✅ Pagato
   Felpa L: €35 💰 DA PAGARE
   Prove Pista (3 slot): €15 💰 DA PAGARE
   ─────────────────────────────
   TOTALE DA INCASSARE: €50
   ```
3. Incassa i **€50 in contanti**
4. Spunta **"💰 Pagamento contanti ricevuto"**
5. Consegna la felpa
6. Clicca **"✅ Check-in completato"**

### Caso 3: Atleta paga TUTTO in contanti

1. Cerca l'atleta (avrà "Metodo: Contanti")
2. Leggi il totale completo:
   ```
   Iscrizione (2 discipline): €80 💰 DA PAGARE
   Felpa L: €35 💰 DA PAGARE
   ─────────────────────────────
   TOTALE DA INCASSARE: €115
   ```
3. Incassa **€115 in contanti**
4. Spunta **"💰 Pagamento contanti ricevuto"**
5. Clicca **"✅ Check-in completato"**

## Cosa Segnare Durante il Check-in

| Voce | Azione |
|------|--------|
| Pagamento contanti | Spunta quando incassi i soldi |
| Felpa consegnata | Spunta quando dai la felpa |
| Cappellino consegnato | Spunta quando dai il cappellino |
| Asciugamano consegnato | Spunta quando dai l'asciugamano |
| Prove confermate | Spunta quando confermi gli slot |

## Esempio Pratico Completo

**Arriva Laura Bianchi (BB11-0087)**

Schermata check-in mostra:
```
👤 Laura Bianchi (BB11-0087) - Italia
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 DISCIPLINE
   Speed Slalom, Classic Slalom, Battle

💰 RIEPILOGO PAGAMENTO
   Iscrizione (3 disc): €110 ✅ Pagato con bonifico
   Felpa taglia M: €35 💰 Contanti
   Prove Pista (2 slot): €10 💰 Contanti
   ─────────────────────────────────────
   TOTALE DA INCASSARE ORA: €45

🎽 MERCH DA CONSEGNARE
   ☐ Felpa M
```

**Azioni**:
1. ✅ Incasso €45 in contanti
2. ✅ Spunto "Pagamento contanti ricevuto"
3. ✅ Consegno la felpa M
4. ✅ Spunto "Felpa consegnata"
5. ✅ Clicco "Check-in completato"

---

# 💰 BILANCIO (SEZIONE IMPORTANTE)

Il sistema bilancio serve per gestire le finanze dell'evento e preparare la documentazione per il bando Regione Lombardia.

## Accedere al Bilancio

1. Dal pannello admin → clicca **"🏛️ Spese Bando"**
2. Oppure vai su **https://bustobattle.com/admin-bilancio.html**

## I Tre Tab del Bilancio

### 📊 Tab "Bilancio Completo"

Mostra il **bilancio reale dell'evento** (come se il bando non esistesse):

**ENTRATE** = Tutto quello che incassi:
- Iscrizioni (tutte, anche contanti)
- Prove pista
- Merchandising
- Sponsor, donazioni, etc.

**USCITE** = Tutte le spese dell'evento, **TRANNE** quelle "Solo per Bando"

**SALDO** = Entrate - Uscite

### 🏛️ Tab "Bilancio Bando"

Mostra il **bilancio per il bando Regione Lombardia**:

**ENTRATE** = Solo pagamenti tracciabili (NO contanti):
- Iscrizioni pagate con bonifico/carta (solo quota gara, no merch/prove)
- Prove pista standalone (pagate online)
- Merch standalone (pagato online)
- Sponsor e contributi (no contanti)

**USCITE** = TUTTE le spese (incluse quelle "Solo per Bando")

**DISAVANZO** = Uscite - Entrate (minimo 0)

**CONTRIBUTO** = 60% del disavanzo (min €2.000, max €15.000)

### 📝 Tab "Gestione Spese/Entrate"

Qui inserisci manualmente:
- Spese dell'evento
- Entrate extra (sponsor, donazioni)

## Come Funzionano le Entrate

### Entrate Automatiche (dalle iscrizioni)

Il sistema calcola automaticamente:

| Tipo | Bilancio Completo | Bilancio Bando |
|------|:-----------------:|:--------------:|
| Iscrizione bonifico €80 | ✅ €80 | ✅ €80 |
| Iscrizione contanti €80 | ✅ €80 | ❌ €0 |
| Felpa in iscrizione €35 | ✅ €35 | ❌ €0 (contanti) |
| Prove in iscrizione €15 | ✅ €15 | ❌ €0 (contanti) |
| Prove standalone €10 | ✅ €10 | ✅ €10 |
| Merch standalone €20 | ✅ €20 | ✅ €20 |

### Entrate Manuali

Per sponsor, donazioni, contributi usa il form verde "Nuova Entrata":

| Campo | Descrizione |
|-------|-------------|
| Descrizione | Es: "Sponsor Decathlon" |
| Importo | Es: 500 |
| Categoria | Sponsor / Donazione / Contributo ente |
| Tipo Pagamento | Bonifico / Carta / Contanti |

**⚠️ Le entrate in CONTANTI vengono escluse dal Bilancio Bando.**

## Come Funzionano le Spese

### I Due Flag delle Spese

#### 🏛️ Includi nel Bando
- ✅ = La spesa è ammissibile per il bando
- Appare in **ENTRAMBI** i bilanci

#### 🎯 Solo per Bando
- ✅ = Spesa che fai SOLO per partecipare al bando
- **ESCLUSA** dal Bilancio Completo
- **INCLUSA** nel Bilancio Bando

### Tabella Riassuntiva

| Spesa | Includi Bando | Solo Bando | Bil.Completo | Bil.Bando |
|-------|:-------------:|:----------:|:------------:|:---------:|
| Affitto palazzetto | ✅ | ❌ | ✅ SÌ | ✅ SÌ |
| Ambulanza | ✅ | ❌ | ✅ SÌ | ✅ SÌ |
| Commercialista bando | ✅ | ✅ | ❌ NO | ✅ SÌ |
| Cena sociale | ❌ | ❌ | ✅ SÌ | ✅ SÌ |

### Badge nella Tabella

| Badge | Significato |
|-------|-------------|
| 🟠 **Bando** | Spesa ammissibile, in entrambi i bilanci |
| 🟣 **Solo Bando** | Spesa esclusiva per bando, solo in Bil.Bando |
| **-** | Spesa non ammissibile |

### Categorie Ammissibili dal Bando

| Categoria | Limite |
|-----------|--------|
| Affitto e allestimento spazi | Nessuno |
| Noleggio attrezzature | Nessuno |
| Ambulanza e sicurezza | Nessuno |
| Servizi assicurativi | Nessuno |
| Tasse e fee (SIAE, federali) | Nessuno |
| Compensi e rimborsi (giudici) | Nessuno |
| Ospitalità e trasporto atleti | Nessuno |
| Comunicazione e pubblicità | Nessuno |
| **Premi in beni materiali** | **MAX €1.500** |
| **Rinfreschi e ristori** | **MAX €2.000** |
| Servizi di pulizia | Nessuno |
| Altre spese | Non ammissibili |

## Esempio Pratico: Inserimento Spese

### Spesa 1: Affitto Palazzetto

```
Descrizione: Affitto Palazzetto Moriggia
Importo: 3000
Categoria: Affitto e allestimento spazi
Stato: ☑ Confermato ☑ Pagato
☑ Includi nel Bando
☐ Solo per Bando
```
→ Appare in entrambi i bilanci

### Spesa 2: Commercialista per Rendicontazione

```
Descrizione: Commercialista rendicontazione bando
Importo: 400
Categoria: Altre spese
Stato: ☑ Preventivo
☑ Includi nel Bando
☑ Solo per Bando      ← IMPORTANTE!
```
→ Appare SOLO nel Bilancio Bando

### Spesa 3: Cena Sociale

```
Descrizione: Cena sociale sabato sera
Importo: 1500
Categoria: Altre spese
Stato: ☑ Confermato
☐ Includi nel Bando   ← Non ammissibile
☐ Solo per Bando
```
→ Appare in entrambi (è una spesa reale anche se non ammissibile)

## Calcolo del Contributo Bando

Il contributo si calcola così:

```
DISAVANZO = Uscite Bando - Entrate Bando

Se Disavanzo > 0:
   CONTRIBUTO = Disavanzo × 60%
   
   Se Contributo < €2.000 → Attenzione, sotto il minimo!
   Se Contributo > €15.000 → Contributo = €15.000
```

### Esempio Numerico

```
ENTRATE BANDO
├── Iscrizioni (no contanti): €10.000
├── Prove standalone: €200
├── Merch standalone: €150
├── Sponsor (bonifico): €1.000
└── TOTALE: €11.350

USCITE BANDO
├── Affitto: €3.000
├── Ambulanza: €800
├── Premi: €1.400
├── Catering: €600
├── Giudici: €2.000
├── Commercialista bando: €400
├── Cena sociale: €1.500
└── TOTALE: €9.700

DISAVANZO: €9.700 - €11.350 = €0 (entrate > uscite)
CONTRIBUTO: €0
```

Se invece le uscite fossero €18.000:
```
DISAVANZO: €18.000 - €11.350 = €6.650
CONTRIBUTO: €6.650 × 60% = €3.990
```

## Scaricare i PDF

- **📄 Scarica PDF** (rosso) → Bilancio Completo
- **📄 Scarica PDF Bando** (blu) → Bilancio per rendicontazione

---

## 🔄 Riepilogo Flusso

### Prima della Gara
1. ✅ Conferma ricevute bonifico
2. ✅ Imposta "Contanti" per chi pagherà alla gara
3. ✅ Inserisci spese preventivate

### Giorno della Gara
1. ✅ Check-in degli atleti
2. ✅ Incassa contanti (prove, merch, iscrizioni contanti)
3. ✅ Consegna merch

### Dopo la Gara
1. ✅ Completa spese con importi effettivi
2. ✅ Inserisci entrate extra (sponsor)
3. ✅ Scarica PDF Bilancio Bando

---

## ❓ FAQ

**D: Perché il Bilancio Bando mostra meno entrate?**
R: Esclude: iscrizioni contanti, merch/prove nelle iscrizioni (sono contanti), entrate manuali contanti.

**D: Perché il Bilancio Completo mostra meno uscite?**
R: Esclude le spese "Solo per Bando" (es. commercialista rendicontazione).

**D: Qual è la differenza tra i due flag?**
R: "Includi nel Bando" = ammissibile. "Solo per Bando" = esiste solo per il bando.

**D: Cosa conta come contanti?**
R: Iscrizioni con metodo "Contanti", merch/prove dentro iscrizioni, entrate manuali "Contanti".

---

*Guida aggiornata: Novembre 2026 - Busto Battle XI*
