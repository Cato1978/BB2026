# 📋 Guida Completa Admin - Busto Battle XI

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

| Voce | Costo |
|------|-------|
| Prima disciplina | €50 |
| Ogni disciplina aggiuntiva | €30 |
| Felpa | €35 (contanti) |
| Cappellino | €5 (contanti) |
| Asciugamano | €5 (contanti) |
| Prove pista (per slot) | €5 (contanti) |

> ⚠️ **Importante**: Felpa, cappellino, asciugamano e prove pista incluse nell'iscrizione si pagano **sempre in contanti** alla gara.

### Stati di un'Iscrizione

| Stato | Significato |
|-------|-------------|
| 🟡 **In attesa** | Iscritto ma non ha ancora pagato |
| 🟢 **Confermata** | Pagamento ricevuto e verificato |
| 🔴 **Rigettata** | Ricevuta non valida |
| ⚪ **Annullata** | Iscrizione cancellata |

### Confermare un Pagamento (Bonifico)

Quando un atleta carica la ricevuta del bonifico:

1. Trovi l'iscrizione con stato "In attesa ricevuta" o "Ricevuta caricata"
2. Clicca **"👁️ Vedi"** per vedere la ricevuta
3. Verifica che l'importo e la causale siano corretti
4. Clicca **"✅ Conferma"** se tutto ok
5. L'atleta riceverà email di conferma

### Rigettare una Ricevuta

Se la ricevuta non è valida:

1. Clicca **"❌ Rigetta"**
2. Inserisci il motivo (es: "Importo errato, mancano €30")
3. L'atleta riceverà email con il motivo e potrà ricaricare

### Impostare Pagamento in Contanti

Se un atleta deve pagare in contanti alla gara:

1. Trova l'iscrizione nella lista
2. Clicca **"✏️ Modifica"**
3. Nel campo **"Metodo Pagamento"** seleziona **"Contanti"**
4. Clicca **"Salva"**

> ⚠️ **Importante per il Bando**: Le iscrizioni con metodo "Contanti" vengono **escluse** dal Bilancio Bando (che accetta solo pagamenti tracciabili).

### Esempio Pratico: Iscrizione Contanti

**Scenario**: Mario Rossi si è iscritto online ma vuole pagare in contanti alla gara.

1. Vai su Admin → cerca "Mario Rossi"
2. Clicca "✏️ Modifica"
3. Metodo Pagamento → seleziona "Contanti"
4. Salva

**Risultato**:
- Nel Bilancio Completo: Mario viene conteggiato (€80 per 2 discipline)
- Nel Bilancio Bando: Mario viene ESCLUSO (contanti non tracciabili)

---

## ✅ GESTIONE CHECK-IN

Il check-in si usa il giorno della gara per registrare chi arriva.

### Accedere al Check-in

1. Dal pannello admin, clicca **"✅ Check-in"**
2. Oppure vai direttamente su **/check-in.html**

### Fare il Check-in di un Atleta

1. **Cerca** l'atleta per nome o codice (es: BB11-0042)
2. Vedrai il riepilogo:
   - Discipline iscritte
   - Prove pista prenotate
   - Merch ordinato
   - Importo totale e stato pagamento
3. Clicca **"✅ Check-in"** per confermare l'arrivo

### Gestire Pagamenti al Check-in

Se l'atleta deve ancora pagare (contanti):

1. Verifica l'importo mostrato
2. Incassa i contanti
3. Spunta **"💰 Pagamento ricevuto"**
4. Completa il check-in

### Consegnare Merch e Prove

Durante il check-in puoi segnare:
- **Felpa consegnata** ✅
- **Cappellino consegnato** ✅
- **Prove pista confermate** ✅

### Esempio Pratico: Check-in Completo

**Scenario**: Arriva Laura Bianchi (BB11-0087)

1. Cerca "Laura Bianchi" o "BB11-0087"
2. Vedi:
   - Discipline: Speed, Classic (€80)
   - Prove pista: 2 slot (€10) - DA PAGARE IN CONTANTI
   - Felpa L (€35) - DA PAGARE IN CONTANTI
   - Stato iscrizione: ✅ Pagata (bonifico)
3. Incassi €45 in contanti (prove + felpa)
4. Spunti "Pagamento contanti ricevuto"
5. Consegni la felpa, spunti "Felpa consegnata"
6. Clicca "✅ Check-in completato"

---

## 💰 GESTIONE BILANCIO

### Accedere al Bilancio

1. Dal pannello admin, clicca **"🏛️ Spese Bando"**
2. Oppure vai su **/admin-bilancio.html**

### I Tre Tab del Bilancio

#### 📊 Tab "Bilancio Completo"
Mostra il bilancio reale dell'evento (senza considerare il bando):
- **Entrate**: tutte le iscrizioni + prove + merch + entrate manuali
- **Uscite**: tutte le spese **TRANNE** quelle "Solo per Bando"
- **Saldo**: Entrate - Uscite

#### 🏛️ Tab "Bilancio Bando"
Per il bando Regione Lombardia:
- **Entrate**: ESCLUSI i contanti (solo bonifici/carte)
  - Iscrizioni: solo la quota gara (50€+30€), esclusi merch e prove (sono contanti)
  - Prove pista standalone (pagate online)
  - Merch standalone (pagato online)
  - Entrate manuali non in contanti
- **Uscite**: TUTTE le spese (incluse quelle "Solo per Bando")
- **Disavanzo**: Uscite - Entrate (se positivo)
- **Contributo stimato**: 60% del disavanzo (min €2.000, max €15.000)

#### 📝 Tab "Gestione Spese/Entrate"
Per inserire spese e entrate manuali.

---

### Inserire una Spesa

1. Vai su **"Gestione Spese/Entrate"**
2. Compila il form **"Nuova Spesa"**:
   - **Descrizione**: es. "Affitto Palazzetto"
   - **Importo**: es. 3000
   - **Categoria Bando**: seleziona la categoria appropriata
   - **Stato**: Preventivo / Confermato / Pagato
   - **Includi nel Bando**: ✅ se è una spesa ammissibile
   - **Solo per Bando**: ✅ se è una spesa che fai SOLO per partecipare al bando
3. Clicca **"💾 Salva Spesa"**

### I Due Flag delle Spese

#### 🏛️ Includi nel Bando
- ✅ = La spesa è ammissibile per il bando Regione Lombardia
- La spesa appare in **entrambi** i bilanci

#### 🎯 Solo per Bando
- ✅ = La spesa esiste SOLO perché partecipi al bando
- **Esclusa** dal Bilancio Completo (non la faresti se non ci fosse il bando)
- **Inclusa** nel Bilancio Bando

### Tabella Riassuntiva Flag

| Spesa | Includi Bando | Solo Bando | Bil. Completo | Bil. Bando |
|-------|:-------------:|:----------:|:-------------:|:----------:|
| Affitto palazzetto | ✅ | ❌ | ✅ Sì | ✅ Sì |
| Ambulanza | ✅ | ❌ | ✅ Sì | ✅ Sì |
| Commercialista rendicontazione | ✅ | ✅ | ❌ No | ✅ Sì |
| Consulente bando | ✅ | ✅ | ❌ No | ✅ Sì |
| Cena sociale | ❌ | ❌ | ✅ Sì | ✅ Sì |
| Gadget staff | ❌ | ❌ | ✅ Sì | ✅ Sì |

### Badge nella Tabella Spese

| Badge | Significato |
|-------|-------------|
| 🟠 **Bando** | Spesa ammissibile per il bando |
| 🟣 **Solo Bando** | Spesa esclusiva per il bando |
| **-** | Spesa non ammissibile |

### Categorie Spese per il Bando

| Categoria | Limite |
|-----------|--------|
| Affitto e allestimento spazi | Nessuno |
| Noleggio attrezzature | Nessuno |
| Ambulanza e sicurezza | Nessuno |
| Servizi assicurativi | Nessuno |
| Tasse e fee (SIAE, federali) | Nessuno |
| Compensi e rimborsi (giudici, arbitri) | Nessuno |
| Ospitalità e trasporto atleti | Nessuno |
| Comunicazione e pubblicità | Nessuno |
| **Premi in beni materiali** | **MAX €1.500** |
| **Rinfreschi e ristori** | **MAX €2.000** |
| Servizi di pulizia | Nessuno |
| Altre spese | Non ammissibili |

### Inserire un'Entrata Manuale

Per sponsor, donazioni, contributi non legati alle iscrizioni:

1. Vai su **"Gestione Spese/Entrate"**
2. Compila il form verde **"Nuova Entrata"**:
   - **Descrizione**: es. "Sponsor Decathlon"
   - **Importo**: es. 500
   - **Categoria**: Sponsor / Donazione / Contributo ente / etc.
   - **Tipo Pagamento**: Bonifico / Carta / Contanti
   - **Includi nel Bando**: ✅ (se non è contanti)
3. Clicca **"💾 Salva Entrata"**

> ⚠️ Le entrate in **contanti** vengono escluse automaticamente dal Bilancio Bando.

---

### Esempio Completo: Preparare il Bilancio Bando

**Scenario**: Devi preparare il bilancio per il bando Regione Lombardia.

#### Step 1: Inserisci le Spese

| Descrizione | Importo | Categoria | Bando | Solo Bando |
|-------------|---------|-----------|:-----:|:----------:|
| Affitto Palazzetto Moriggia | €3.000 | Affitto e allestimento | ✅ | ❌ |
| Ambulanza 2 giorni | €800 | Ambulanza e sicurezza | ✅ | ❌ |
| Service audio/video | €1.200 | Noleggio attrezzature | ✅ | ❌ |
| Medaglie e coppe | €1.400 | Premi in beni materiali | ✅ | ❌ |
| Catering giudici | €600 | Rinfreschi e ristori | ✅ | ❌ |
| Volantini e manifesti | €300 | Comunicazione | ✅ | ❌ |
| Fee WSSA | €500 | Tasse e fee | ✅ | ❌ |
| Rimborso giudici | €2.000 | Compensi e rimborsi | ✅ | ❌ |
| Commercialista rendicontazione | €400 | Altre spese | ✅ | ✅ |
| Cena sociale | €1.500 | Altre spese | ❌ | ❌ |

#### Step 2: Verifica i Bilanci

**Bilancio Completo** (evento reale):
- Uscite: €3.000 + €800 + €1.200 + €1.400 + €600 + €300 + €500 + €2.000 + €1.500 = **€11.300**
- (Il commercialista €400 è escluso perché è "Solo Bando")

**Bilancio Bando**:
- Uscite: €3.000 + €800 + €1.200 + €1.400 + €600 + €300 + €500 + €2.000 + €400 + €1.500 = **€11.700**
- (Include il commercialista perché serve per il bando)

#### Step 3: Calcolo Contributo

```
ENTRATE BANDO: €10.000 (esempio)
USCITE BANDO: €11.700

DISAVANZO: €11.700 - €10.000 = €1.700
CONTRIBUTO (60%): €1.020

⚠️ Attenzione: sotto il minimo di €2.000!
```

---

### Scaricare i PDF

- **Bilancio Completo** → Clicca "📄 Scarica PDF" (rosso)
- **Bilancio Bando** → Clicca "📄 Scarica PDF Bando" (blu)

---

## 🔄 Riepilogo Flusso Tipico

### Prima della Gara
1. ✅ Conferma le ricevute bonifico man mano che arrivano
2. ✅ Imposta "Contanti" per chi pagherà alla gara
3. ✅ Inserisci le spese preventivate nel bilancio

### Giorno della Gara
1. ✅ Usa il Check-in per registrare gli arrivi
2. ✅ Incassa i contanti (prove, merch, iscrizioni contanti)
3. ✅ Consegna il merch

### Dopo la Gara
1. ✅ Completa le spese con quelle effettive
2. ✅ Inserisci eventuali entrate extra (sponsor last minute)
3. ✅ Scarica il PDF del Bilancio Bando per la rendicontazione

---

## ❓ FAQ

**D: Un atleta ha pagato con bonifico ma vuole aggiungere prove pista. Come faccio?**
R: Le prove pista aggiunte dopo l'iscrizione vanno pagate in contanti alla gara. Puoi aggiungerle manualmente nelle note dell'iscrizione o fargliele prenotare come "standalone".

**D: Ho sbagliato a confermare un pagamento. Posso annullare?**
R: Puoi modificare l'iscrizione e cambiare lo stato manualmente.

**D: Perché il Bilancio Bando mostra meno entrate del Bilancio Completo?**
R: Il Bilancio Bando esclude:
- Iscrizioni pagate in contanti
- Merch e prove pista dentro le iscrizioni (sono sempre contanti)
- Entrate manuali marcate come "contanti"

**D: Perché il Bilancio Completo mostra meno uscite del Bilancio Bando?**
R: Il Bilancio Completo esclude le spese marcate come "Solo per Bando" (es. commercialista per la rendicontazione), perché sono spese che non faresti se non partecipassi al bando.

**D: Cosa succede se supero il limite di €1.500 per i premi?**
R: Il sistema ti mostra un avviso in rosso. La parte eccedente non sarà rimborsata dal bando.

**D: Qual è la differenza tra "Includi nel Bando" e "Solo per Bando"?**
R: 
- **Includi nel Bando** = spesa ammissibile, appare in entrambi i bilanci
- **Solo per Bando** = spesa che fai SOLO per il bando, esclusa dal Bilancio Completo

**D: Cosa conta come "contanti" per il bando?**
R: Per il Bilancio Bando, vengono escluse:
- Iscrizioni con metodo pagamento = "Contanti"
- Merch e prove dentro le iscrizioni (si pagano sempre in contanti alla gara)
- Entrate manuali con tipo pagamento = "Contanti"

---

*Guida aggiornata: Novembre 2026*
