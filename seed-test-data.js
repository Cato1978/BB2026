/**
 * Script per popolare il database con dati di test realistici
 * 50 atleti con varie combinazioni di iscrizioni, prove pista e merchandising
 * 
 * Esegui con: node seed-test-data.js
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Dati fittizi realistici
const nomi = ['Marco', 'Luca', 'Alessandro', 'Matteo', 'Andrea', 'Francesco', 'Lorenzo', 'Davide', 'Simone', 'Riccardo',
  'Sara', 'Giulia', 'Chiara', 'Martina', 'Francesca', 'Valentina', 'Elena', 'Alice', 'Sofia', 'Anna',
  'Federico', 'Gabriele', 'Tommaso', 'Pietro', 'Giovanni', 'Nicola', 'Filippo', 'Edoardo', 'Diego', 'Emanuele',
  'Elisa', 'Beatrice', 'Camilla', 'Aurora', 'Greta', 'Emma', 'Noemi', 'Serena', 'Cristina', 'Paola',
  'Michele', 'Stefano', 'Roberto', 'Paolo', 'Carlo', 'Alberto', 'Giacomo', 'Enrico', 'Massimo', 'Daniele'];

const cognomi = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
  'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone',
  'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'DAmico', 'Marchetti',
  'Parisi', 'Villa', 'Conte', 'Ferraro', 'Ferri', 'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini'];

const societa = ['ASD Pattinaggio Milano', 'Roller Club Roma', 'Skating Torino', 'Pattini dOro Napoli', 
  'Rolling Thunder Bologna', 'Freestyle Firenze', 'Slalom Masters Genova', 'Inline Verona',
  'Skate Academy Padova', 'Rollerbladers Trieste', 'Speed Demons Bari', 'Battle Crew Palermo',
  'Inline Stars Catania', 'Pro Skaters Venezia', 'Urban Rollers Brescia', 'Freestyle Academy Modena', null];

const nazionalita = ['Italia', 'Italia', 'Italia', 'Italia', 'Italia', 'Francia', 'Spagna', 'Germania', 
  'Svizzera', 'Austria', 'Belgio', 'Olanda', 'Polonia', 'Regno Unito', 'Portogallo'];

const discipline = [
  'Speed Slalom (U15)', 'Speed Slalom (U19)', 'Speed Slalom (SENIOR)',
  'Classic Slalom (U15)', 'Classic Slalom (U19)', 'Classic Slalom (SENIOR)',
  'Battle (U15)', 'Battle (U19)', 'Battle (SENIOR)',
  'Slides (U15)', 'Slides (U19)', 'Slides (SENIOR)',
  'Pair Slalom (U15)', 'Pair Slalom (U19)', 'Pair Slalom (SENIOR)',
  'Free Jump (U15)', 'Free Jump (U19)', 'Free Jump (SENIOR)'
];

const taglie = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const metodiPagamento = ['bonifico', 'contanti', 'online'];
const statiPagamento = ['confermata', 'sospesa', 'sospesa']; // più sospese per test

// Helper functions
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear, endYear) {
  const year = randomInt(startYear, endYear);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateEmail(nome, cognome) {
  const domains = ['gmail.com', 'yahoo.it', 'libero.it', 'outlook.com', 'hotmail.com'];
  return `${nome.toLowerCase()}.${cognome.toLowerCase().replace(/\s/g, '')}@${randomItem(domains)}`;
}

function generatePhone() {
  return `+39 ${randomInt(320, 399)} ${randomInt(1000000, 9999999)}`;
}

function generateCode(prefix, id) {
  return `${prefix}${String(id).padStart(4, '0')}`;
}

async function seed() {
  console.log('🌱 Inizializzazione seed dati di test...\n');
  
  // Carica sql.js
  const SQL = await initSqlJs();
  
  // Carica o crea il database
  const dbPath = path.join(__dirname, 'db', 'gara.db');
  let db;
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('📂 Database esistente caricato');
  } else {
    console.log('❌ Database non trovato. Avvia prima il server per crearlo.');
    process.exit(1);
  }
  
  // Pulisci dati esistenti (opzionale - commenta se vuoi mantenere)
  console.log('🧹 Pulizia dati esistenti...');
  
  // Prima aggiungi colonne mancanti (migrazioni)
  try { db.run('ALTER TABLE iscritti ADD COLUMN metodo_pagamento TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN checkin_fatto INTEGER DEFAULT 0'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN prove_pagato INTEGER DEFAULT 0'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN merch_pagato INTEGER DEFAULT 0'); } catch(e) {}
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN origine TEXT DEFAULT \'standalone\''); } catch(e) {}
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN iscrizione_codice TEXT'); } catch(e) {}
  
  db.run('DELETE FROM iscritti WHERE id > 0');
  db.run('DELETE FROM prove_prenotazioni WHERE id > 0');
  db.run('DELETE FROM merch_ordini WHERE id > 0');
  db.run('DELETE FROM merch_items WHERE id > 0');
  db.run('DELETE FROM sqlite_sequence WHERE name IN ("iscritti", "prove_prenotazioni", "merch_ordini", "merch_items")');
  
  const athletes = [];
  let proveCount = 0;
  let merchIscrizioneCount = 0;
  let merchOrdiniCount = 0;
  
  console.log('\n👤 Creazione 50 atleti...\n');
  
  for (let i = 0; i < 50; i++) {
    const nome = nomi[i];
    const cognome = cognomi[i];
    const email = generateEmail(nome, cognome);
    const telefono = generatePhone();
    const soc = randomItem(societa);
    const naz = randomItem(nazionalita);
    const dataNascita = randomDate(1990, 2012);
    const metodo = randomItem(metodiPagamento);
    const stato = metodo === 'online' ? 'confermata' : randomItem(statiPagamento);
    
    // Seleziona 1-3 discipline
    const numDisc = randomInt(1, 3);
    const discSelezionate = [];
    const discCopy = [...discipline];
    for (let j = 0; j < numDisc; j++) {
      const idx = randomInt(0, discCopy.length - 1);
      discSelezionate.push(discCopy[idx]);
      discCopy.splice(idx, 1);
    }
    const categoria = discSelezionate.join(', ');
    
    // Determina cosa include questo atleta
    let includeProveIscrizione = false;
    let includeMerchIscrizione = false;
    let includeProveStandalone = false;
    let includeMerchStandalone = false;
    
    // Distribuzione:
    // 0-9: solo iscrizione base
    // 10-19: iscrizione + maglia
    // 20-29: iscrizione + prova pista
    // 30-39: iscrizione + prova pista + maglia (da iscrizione)
    // 40-44: iscrizione base + prova standalone + merch standalone
    // 45-49: iscrizione + maglia + prova standalone + merch standalone
    
    if (i >= 10 && i < 20) {
      includeMerchIscrizione = true;
    } else if (i >= 20 && i < 30) {
      includeProveIscrizione = true;
    } else if (i >= 30 && i < 40) {
      includeProveIscrizione = true;
      includeMerchIscrizione = true;
    } else if (i >= 40 && i < 45) {
      includeProveStandalone = true;
      includeMerchStandalone = true;
    } else if (i >= 45) {
      includeMerchIscrizione = true;
      includeProveStandalone = true;
      includeMerchStandalone = true;
    }
    
    // Genera codice iscritto prima di tutto
    const codice = generateCode('BB11-', i + 1);
    
    // Costruisci note per merch da iscrizione e crea ordine merch
    let note = '';
    let merchItemsForIscrizione = []; // Salva per dopo
    if (includeMerchIscrizione) {
      const parti = [];
      const merchItems = [];
      
      if (Math.random() > 0.3) {
        const taglia = randomItem(taglie);
        parti.push(`Maglia: ${taglia}`);
        merchItems.push({ articolo: 'Maglia', taglia, prezzo: 15 });
      }
      if (Math.random() > 0.5) {
        const taglia = randomItem(taglie);
        parti.push(`Felpa: ${taglia}`);
        merchItems.push({ articolo: 'Felpa', taglia, prezzo: 35 });
      }
      if (Math.random() > 0.7) {
        parti.push('Cappellino');
        merchItems.push({ articolo: 'Cappellino', taglia: null, prezzo: 5 });
      }
      if (Math.random() > 0.8) {
        parti.push('Asciugamano');
        merchItems.push({ articolo: 'Asciugamano', taglia: null, prezzo: 5 });
      }
      
      if (parti.length > 0) {
        note = parti.join(' | ');
        merchIscrizioneCount += merchItems.length;
        merchItemsForIscrizione = merchItems;
      }
    }
    
    // Inserisci iscritto
    db.run(`INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono, stato, note, nazionalita, metodo_pagamento) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, cognome, dataNascita, categoria, soc, email, telefono, stato, note || null, naz, metodo]);
    
    const iscrittoId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    
    // Crea ordine merch_ordini con origine 'iscrizione' (dopo l'inserimento dell'iscritto)
    if (merchItemsForIscrizione.length > 0) {
      const merchCodice = 'MRC-' + codice;
      const statoMerch = stato === 'confermata' ? 'confermata' : 'sospesa';
      
      db.run(`INSERT INTO merch_ordini (codice, nome, cognome, email, telefono, stato, note, origine, iscrizione_codice) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [merchCodice, nome, cognome, email, telefono, statoMerch, null, 'iscrizione', codice]);
      
      const merchOrdineId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
      
      for (const item of merchItemsForIscrizione) {
        db.run(`INSERT INTO merch_items (ordine_id, articolo, taglia, quantita, prezzo_unitario) VALUES (?, ?, ?, ?, ?)`,
          [merchOrdineId, item.articolo, item.taglia, 1, item.prezzo]);
      }
    }
    
    // Prove pista da iscrizione
    if (includeProveIscrizione) {
      const numProve = randomInt(1, 3);
      const giorni = ['2026-11-13', '2026-11-14'];
      const ore = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
      
      for (let p = 0; p < numProve; p++) {
        const giorno = randomItem(giorni);
        const ora = ore[randomInt(0, ore.length - 1)];
        const specialita = randomItem(['Speed Slalom', 'Classic Slalom', 'Battle', 'Slides']);
        const proveCodice = 'PRV-' + codice;
        const noteProva = `${ora}: ${specialita}`;
        const statoProva = stato === 'confermata' ? 'confermata' : 'sospesa';
        
        db.run(`INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, giorno, codice, stato, origine, iscrizione_codice, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [nome, cognome, email, telefono, ora, giorno, proveCodice, statoProva, 'iscrizione', codice, noteProva]);
        proveCount++;
      }
    }
    
    // Prove pista standalone (prenotate a parte)
    if (includeProveStandalone) {
      const numProve = randomInt(1, 2);
      const giorni = ['2026-11-13', '2026-11-14'];
      const ore = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
      
      for (let p = 0; p < numProve; p++) {
        const giorno = randomItem(giorni);
        const ora = ore[randomInt(0, ore.length - 1)];
        const specialita = randomItem(['Speed Slalom', 'Classic Slalom', 'Battle', 'Slides']);
        const proveCodice = 'PRV-' + Date.now().toString(36).toUpperCase() + randomInt(100, 999);
        const noteProva = `${ora}: ${specialita}`;
        
        db.run(`INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, giorno, codice, stato, origine, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [nome, cognome, email, telefono, ora, giorno, proveCodice, 'sospesa', 'standalone', noteProva]);
        proveCount++;
      }
    }
    
    // Merchandising standalone (ordinato a parte)
    if (includeMerchStandalone) {
      const merchCodice = 'MERCH-' + Date.now().toString(36).toUpperCase() + randomInt(100, 999);
      
      db.run(`INSERT INTO merch_ordini (codice, nome, cognome, email, telefono, stato, note) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [merchCodice, nome, cognome, email, telefono, 'sospesa', null]);
      
      const ordineId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
      
      // Aggiungi 1-3 articoli
      const numArticoli = randomInt(1, 3);
      const articoliPossibili = ['Maglia', 'Felpa', 'Cappellino', 'Asciugamano'];
      const articoliScelti = [];
      
      for (let a = 0; a < numArticoli; a++) {
        const articolo = articoliPossibili[a % articoliPossibili.length];
        if (!articoliScelti.includes(articolo)) {
          articoliScelti.push(articolo);
          const taglia = (articolo === 'Maglia' || articolo === 'Felpa') ? randomItem(taglie) : null;
          const prezzo = articolo === 'Felpa' ? 35 : articolo === 'Maglia' ? 15 : 5;
          
          db.run(`INSERT INTO merch_items (ordine_id, articolo, taglia, quantita, prezzo_unitario) VALUES (?, ?, ?, ?, ?)`,
            [ordineId, articolo, taglia, 1, prezzo]);
          merchOrdiniCount++;
        }
      }
    }
    
    athletes.push({ id: iscrittoId, nome, cognome, codice, stato, metodo });
    
    // Progress
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/50 atleti creati`);
    }
  }
  
  // Aggiungi alcuni ordini merch "orfani" (non associati a nessun iscritto)
  console.log('\n📦 Creazione ordini merch orfani...');
  const orfani = [
    { nome: 'Giuseppe', cognome: 'Verdi' },
    { nome: 'Maria', cognome: 'Neri' },
    { nome: 'Antonio', cognome: 'Blu' }
  ];
  
  for (const o of orfani) {
    const merchCodice = 'MERCH-ORFANO-' + randomInt(1000, 9999);
    db.run(`INSERT INTO merch_ordini (codice, nome, cognome, email, telefono, stato, note) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [merchCodice, o.nome, o.cognome, generateEmail(o.nome, o.cognome), generatePhone(), 'sospesa', null]);
    
    const ordineId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
    db.run(`INSERT INTO merch_items (ordine_id, articolo, taglia, quantita, prezzo_unitario) VALUES (?, ?, ?, ?, ?)`,
      [ordineId, 'Maglia', randomItem(taglie), 1, 15]);
    merchOrdiniCount++;
  }
  
  // Aggiungi alcune prove "orfane" (nomi diversi dagli iscritti)
  console.log('📅 Creazione prove pista orfane...');
  const proveOrfane = [
    { nome: 'Giuseppe', cognome: 'Verdi' },
    { nome: 'Maria', cognome: 'Neri' }
  ];
  
  for (const p of proveOrfane) {
    const proveCodice = 'PRV-ORFANO-' + randomInt(1000, 9999);
    db.run(`INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, giorno, codice, stato, origine, note) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.nome, p.cognome, generateEmail(p.nome, p.cognome), generatePhone(), '16:00', '2026-11-14', proveCodice, 'sospesa', 'standalone', '16:00: Classic Slalom']);
    proveCount++;
  }
  
  // Salva il database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log('\n✅ Seed completato!\n');
  console.log('📊 Riepilogo:');
  console.log(`   • 50 atleti iscritti`);
  console.log(`   • ${proveCount} prove pista totali (iscrizione + standalone + orfane)`);
  console.log(`   • ${merchIscrizioneCount} articoli merch da iscrizione`);
  console.log(`   • ${merchOrdiniCount} articoli merch da ordini separati`);
  console.log(`   • 3 ordini merch orfani (da associare)`);
  console.log(`   • 2 prove pista orfane (nomi non corrispondenti)`);
  console.log('\n🎯 Distribuzione atleti:');
  console.log('   • 0-9: solo iscrizione base');
  console.log('   • 10-19: iscrizione + maglia/felpa');
  console.log('   • 20-29: iscrizione + prove pista');
  console.log('   • 30-39: iscrizione + prove + merch');
  console.log('   • 40-44: iscrizione + prove standalone + merch standalone');
  console.log('   • 45-49: iscrizione + merch + prove standalone + merch standalone');
  
  db.close();
  console.log('\n🚀 Avvia il server con: npm start');
}

seed().catch(err => {
  console.error('❌ Errore durante il seed:', err);
  process.exit(1);
});
