const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const webpush = require('web-push');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const Stripe = require('stripe');
const ExcelJS = require('exceljs');

// Stripe config - imposta la chiave segreta nelle variabili d'ambiente
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_xxx');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'bustobattle-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Upload config
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
  }),
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf')
});

// Web Push config - genera le tue chiavi con: npx web-push generate-vapid-keys
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BKmSLTMCb78Qm9ZmSYCnGRdym7iFWTzzSdjR93FHROgewYYbPiLup6n_3wdf3vYklg0tEvxzp7ANfqg7dNQr988';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'C2DhpRwo6SLXftJGmRmY-lcESP0ndk04V3Z8CKC_cuE';
webpush.setVapidDetails('mailto:bustobattle@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

// Database - PostgreSQL se DATABASE_URL è presente, altrimenti SQLite
const usePostgres = !!process.env.DATABASE_URL;
let db, pgPool;

if (usePostgres) {
  const { Pool } = require('pg');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('Usando PostgreSQL');
} else {
  console.log('Usando SQLite');
}

const DB_DIR = process.env.RENDER ? '/tmp' : path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'gara.db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

async function initDb() {
  if (usePostgres) {
    // PostgreSQL - crea tabelle
    await pgPool.query(`CREATE TABLE IF NOT EXISTS iscritti (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      data_nascita TEXT,
      categoria TEXT,
      societa TEXT,
      email TEXT,
      telefono TEXT,
      navetta INTEGER DEFAULT 0,
      navetta_dettagli TEXT,
      pagamento INTEGER DEFAULT 0,
      stato TEXT DEFAULT 'sospesa',
      ricevuta_bonifico TEXT,
      ricevuta_base64 TEXT,
      note TEXT,
      note_admin TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    // Migrazione: aggiungi colonna note_admin se non esiste
    try { await pgPool.query('ALTER TABLE iscritti ADD COLUMN note_admin TEXT'); } catch(e) {}
    try { await pgPool.query('ALTER TABLE iscritti ADD COLUMN nazionalita TEXT'); } catch(e) {}
    await pgPool.query(`CREATE TABLE IF NOT EXISTS navetta_prenotazioni (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      giorno TEXT NOT NULL,
      ora TEXT NOT NULL,
      direzione TEXT NOT NULL,
      num_persone INTEGER NOT NULL DEFAULT 1,
      codice TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS risultati (
      id SERIAL PRIMARY KEY,
      titolo TEXT NOT NULL,
      filename TEXT NOT NULL,
      categoria TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT UNIQUE NOT NULL,
      keys_p256dh TEXT,
      keys_auth TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS cena_prenotazioni (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      giorno TEXT NOT NULL,
      num_persone INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      codice TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS merch_ordini (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      codice TEXT,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS merch_items (
      id SERIAL PRIMARY KEY,
      ordine_id INTEGER NOT NULL,
      articolo TEXT NOT NULL,
      taglia TEXT,
      quantita INTEGER NOT NULL DEFAULT 1,
      prezzo_unitario REAL NOT NULL
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS prove_prenotazioni (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      ora TEXT NOT NULL,
      codice TEXT,
      stato TEXT DEFAULT 'sospesa',
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    // Migrazione: aggiungi colonne se non esistono
    try { await pgPool.query('ALTER TABLE prove_prenotazioni ADD COLUMN stato TEXT DEFAULT \'sospesa\''); } catch(e) {}
    try { await pgPool.query('ALTER TABLE prove_prenotazioni ADD COLUMN note TEXT'); } catch(e) {}
    try { await pgPool.query('ALTER TABLE prove_prenotazioni ADD COLUMN ricevuta_bonifico TEXT'); } catch(e) {}
    try { await pgPool.query('ALTER TABLE prove_prenotazioni ADD COLUMN giorno TEXT'); } catch(e) {}
    await pgPool.query(`CREATE TABLE IF NOT EXISTS navetta_slots (
      id SERIAL PRIMARY KEY,
      giorno TEXT NOT NULL,
      ora TEXT NOT NULL,
      partenza TEXT NOT NULL,
      arrivo TEXT NOT NULL,
      posti_max INTEGER DEFAULT 8,
      costo REAL DEFAULT 2
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS prove_slots (
      id SERIAL PRIMARY KEY,
      giorno TEXT NOT NULL,
      ora_inizio TEXT NOT NULL,
      ora_fine TEXT NOT NULL,
      luogo TEXT NOT NULL,
      posti_max INTEGER DEFAULT 20,
      costo REAL DEFAULT 10
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pgPool.query(`CREATE TABLE IF NOT EXISTS page_settings (
      page TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      visible INTEGER DEFAULT 1
    )`);
    
    // Seed pagine default
    const pages = ['iscrizioni','iscrizioni2','verifica','programma','hotel','travel','navetta','maglia','risultati','contact','cena','prove'];
    for (const p of pages) {
      await pgPool.query('INSERT INTO page_settings (page, enabled, visible) VALUES ($1, 1, 1) ON CONFLICT (page) DO NOTHING', [p]);
    }
    
    // Seed navetta slots
    const navettaRes = await pgPool.query('SELECT COUNT(*) as c FROM navetta_slots');
    if (parseInt(navettaRes.rows[0].c) === 0) {
      const giorni = ['2026-11-13', '2026-11-14'];
      const ore = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
      for (const g of giorni) {
        for (const o of ore) {
          await pgPool.query('INSERT INTO navetta_slots (giorno, ora, partenza, arrivo, posti_max, costo) VALUES ($1,$2,$3,$4,$5,$6)',
            [g, o, 'Stazione FS Busto Arsizio', 'PalaCastiglioni', 8, 2]);
        }
      }
    }
    
    // Seed prove slots
    const proveRes = await pgPool.query('SELECT COUNT(*) as c FROM prove_slots');
    if (parseInt(proveRes.rows[0].c) === 0) {
      const proveSlots = [
        // Giovedì 12 Novembre (pre-qualifiche) - 10 slot ogni mezz'ora dalle 14 alle 17
        ['2026-11-12', '14:00', '14:30', 'PalaCastiglioni', 10, 5],
        ['2026-11-12', '14:30', '15:00', 'PalaCastiglioni', 10, 5],
        ['2026-11-12', '15:00', '15:30', 'PalaCastiglioni', 10, 5],
        ['2026-11-12', '15:30', '16:00', 'PalaCastiglioni', 10, 5],
        ['2026-11-12', '16:00', '16:30', 'PalaCastiglioni', 10, 5],
        ['2026-11-12', '16:30', '17:00', 'PalaCastiglioni', 10, 5],
        // Venerdì 13 Novembre
        ['2026-11-13', '21:00', '21:30', 'PalaCastiglioni', 5, 5],
        ['2026-11-13', '21:30', '22:00', 'PalaCastiglioni', 5, 5],
        ['2026-11-13', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
        ['2026-11-13', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
        // Sabato 14 Novembre
        ['2026-11-14', '21:30', '22:00', 'PalaCastiglioni', 10, 5],
        ['2026-11-14', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
        ['2026-11-14', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
      ];
      for (const [g, oi, of_, l, p, c] of proveSlots) {
        await pgPool.query('INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, luogo, posti_max, costo) VALUES ($1,$2,$3,$4,$5,$6)',
          [g, oi, of_, l, p, c]);
      }
    }
    
    // Seed admin user
    const admins = await pgPool.query('SELECT * FROM users WHERE username=$1', ['admin']);
    if (admins.rows.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      await pgPool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', ['admin', hash, 'admin']);
    }
    
    console.log('PostgreSQL inizializzato');
    return;
  }
  
  // SQLite fallback
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run(`CREATE TABLE IF NOT EXISTS iscritti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    data_nascita TEXT,
    categoria TEXT,
    societa TEXT,
    email TEXT,
    telefono TEXT,
    navetta INTEGER DEFAULT 0,
    navetta_dettagli TEXT,
    pagamento INTEGER DEFAULT 0,
    stato TEXT DEFAULT 'sospesa',
    ricevuta_bonifico TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  // Migrazione: aggiungi colonne se non esistono (per DB esistenti)
  try { db.run('ALTER TABLE iscritti ADD COLUMN stato TEXT DEFAULT \'sospesa\''); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN ricevuta_bonifico TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN ricevuta_base64 TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN note_admin TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE iscritti ADD COLUMN nazionalita TEXT'); } catch(e) {}
  db.run(`CREATE TABLE IF NOT EXISTS navetta_prenotazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    giorno TEXT NOT NULL,
    ora TEXT NOT NULL,
    direzione TEXT NOT NULL,
    num_persone INTEGER NOT NULL DEFAULT 1,
    codice TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS risultati (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT NOT NULL,
    filename TEXT NOT NULL,
    categoria TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    keys_p256dh TEXT,
    keys_auth TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cena_prenotazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    giorno TEXT NOT NULL,
    num_persone INTEGER NOT NULL DEFAULT 1,
    note TEXT,
    codice TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS merch_ordini (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    codice TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS merch_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordine_id INTEGER NOT NULL,
    articolo TEXT NOT NULL,
    taglia TEXT,
    quantita INTEGER NOT NULL DEFAULT 1,
    prezzo_unitario REAL NOT NULL,
    FOREIGN KEY (ordine_id) REFERENCES merch_ordini(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS prove_prenotazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    ora TEXT NOT NULL,
    codice TEXT,
    stato TEXT DEFAULT 'sospesa',
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  // Migrazione: aggiungi colonne se non esistono
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN stato TEXT DEFAULT \'sospesa\''); } catch(e) {}
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN note TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN ricevuta_bonifico TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE prove_prenotazioni ADD COLUMN giorno TEXT'); } catch(e) {}
  db.run(`CREATE TABLE IF NOT EXISTS navetta_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giorno TEXT NOT NULL,
    ora TEXT NOT NULL,
    partenza TEXT NOT NULL,
    arrivo TEXT NOT NULL,
    posti_max INTEGER DEFAULT 8,
    costo REAL DEFAULT 2
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS prove_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    giorno TEXT NOT NULL,
    ora_inizio TEXT NOT NULL,
    ora_fine TEXT NOT NULL,
    luogo TEXT NOT NULL,
    posti_max INTEGER DEFAULT 20,
    costo REAL DEFAULT 10
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS page_settings (
    page TEXT PRIMARY KEY,
    enabled INTEGER DEFAULT 1,
    visible INTEGER DEFAULT 1
  )`);
  // Assicura che la colonna visible esista (per DB esistenti)
  try { db.run('ALTER TABLE page_settings ADD COLUMN visible INTEGER DEFAULT 1'); } catch(e) {}
  // Seed pagine default
  const pages = ['iscrizioni','iscrizioni2','verifica','programma','hotel','travel','navetta','maglia','risultati','contact','cena','prove'];
  for (const p of pages) {
    db.run('INSERT OR IGNORE INTO page_settings (page, enabled, visible) VALUES (?, 1, 1)', [p]);
  }
  // Seed navetta slots default
  const navettaCount = all('SELECT COUNT(*) as c FROM navetta_slots')[0].c;
  if (navettaCount === 0) {
    const giorni = ['2026-11-13', '2026-11-14'];
    const ore = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];
    for (const g of giorni) {
      for (const o of ore) {
        db.run('INSERT INTO navetta_slots (giorno, ora, partenza, arrivo, posti_max, costo) VALUES (?,?,?,?,?,?)',
          [g, o, 'Stazione FS Busto Arsizio', 'PalaCastiglioni', 8, 2]);
      }
    }
  }
  // Seed prove slots default
  const proveCount = all('SELECT COUNT(*) as c FROM prove_slots')[0].c;
  if (proveCount === 0) {
    const proveSlots = [
      // Giovedì 12 Novembre (pre-qualifiche) - 10 slot ogni mezz'ora dalle 14 alle 17
      ['2026-11-12', '14:00', '14:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '14:30', '15:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '15:00', '15:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '15:30', '16:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '16:00', '16:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '16:30', '17:00', 'PalaCastiglioni', 10, 5],
      // Venerdì 13 Novembre
      ['2026-11-13', '21:00', '21:30', 'PalaCastiglioni', 5, 5],
      ['2026-11-13', '21:30', '22:00', 'PalaCastiglioni', 5, 5],
      ['2026-11-13', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-13', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
      // Sabato 14 Novembre
      ['2026-11-14', '21:30', '22:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-14', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-14', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
    ];
    for (const [g, oi, of, l, p, c] of proveSlots) {
      db.run('INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, luogo, posti_max, costo) VALUES (?,?,?,?,?,?)',
        [g, oi, of, l, p, c]);
    }
  }
  const admins = all('SELECT * FROM users WHERE username=?', ['admin']);
  if (!admins.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
  }
  // Seed utenti demo se tabella iscritti è vuota
  const count = all('SELECT COUNT(*) as c FROM iscritti');
  if (count[0].c === 0) {
    seedDemoAthletes();
  }
  save();
}

function seedDemoAthletes() {
  const nomiM = ['Marco', 'Luca', 'Alessandro', 'Andrea', 'Matteo', 'Lorenzo', 'Davide', 'Federico', 'Simone', 'Riccardo', 'Pierre', 'Jean', 'Hans', 'Klaus', 'Erik', 'Sven', 'James', 'Michael', 'Thomas', 'Carlos', 'Pablo', 'Miguel', 'João', 'Pedro', 'Anton', 'Dmitri', 'Yuki', 'Kenji', 'Chen', 'Wei'];
  const nomiF = ['Giulia', 'Francesca', 'Sara', 'Chiara', 'Valentina', 'Elisa', 'Martina', 'Alessia', 'Giorgia', 'Elena', 'Marie', 'Sophie', 'Anna', 'Emma', 'Lisa', 'Nina', 'Sarah', 'Emily', 'Laura', 'Maria', 'Carmen', 'Ana', 'Lucia', 'Marta', 'Olga', 'Natasha', 'Yuki', 'Sakura', 'Mei', 'Lin'];
  const cognomi = ['Rossi', 'Bianchi', 'Ferrari', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Dupont', 'Martin', 'Bernard', 'Müller', 'Schmidt', 'Weber', 'Smith', 'Johnson', 'Williams', 'Brown', 'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Silva', 'Santos', 'Oliveira', 'Petrov', 'Ivanov', 'Tanaka', 'Yamamoto', 'Wang', 'Li', 'Zhang', 'Kim', 'Park'];
  const societa = ['ASD Pattinatori Milano', 'Skating Club Torino', 'Roma Roller', 'Firenze Skate', 'Bologna Freestyle', 'Napoli Skating', 'Genova Rollers', 'Verona Inline', 'Padova Skate Club', 'Trieste Freestyle', 'Lyon Freestyle', 'Paris Roller', 'Marseille Skate', 'Berlin Inline', 'Munich Rollers', 'Vienna Skating', 'London Rollers', 'Manchester Skate', 'Madrid Skating', 'Barcelona Roller', 'Lisbon Skate', 'Amsterdam Inline', 'Brussels Freestyle', 'Zurich Rollers', 'Prague Skating', 'Warsaw Inline', 'Budapest Rollers', 'Moscow Skate', 'Tokyo Inline', 'Seoul Rollers'];
  const discipline = ['Speed Slalom', 'Classic Slalom', 'Battle', 'Slides', 'Pair Slalom', 'Free Jump'];
  const taglie = ['XS', 'S', 'M', 'L', 'XL'];
  
  // Funzione per generare data nascita in base alla categoria desiderata
  function randomDate(categoria) {
    let yearMin, yearMax;
    if (categoria === 'U15') { yearMin = 2012; yearMax = 2016; }
    else if (categoria === 'U19') { yearMin = 2008; yearMax = 2011; }
    else { yearMin = 1985; yearMax = 2007; } // SENIOR
    const year = yearMin + Math.floor(Math.random() * (yearMax - yearMin + 1));
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function randomPhone(country) {
    const prefixes = { IT: '33', FR: '06', DE: '017', ES: '06', UK: '07', US: '55' };
    const prefix = prefixes[country] || '33';
    return prefix + Math.floor(10000000 + Math.random() * 90000000);
  }

  function randomWsId() {
    return 'WS' + Math.floor(100000 + Math.random() * 900000);
  }

  function randomFisrCard() {
    return 'FISR' + Math.floor(10000 + Math.random() * 90000);
  }

  // Genera 100 atleti
  for (let i = 0; i < 100; i++) {
    const genere = Math.random() > 0.45 ? 'M' : 'F'; // 55% maschi
    const nome = genere === 'M' ? nomiM[Math.floor(Math.random() * nomiM.length)] : nomiF[Math.floor(Math.random() * nomiF.length)];
    const cognome = cognomi[Math.floor(Math.random() * cognomi.length)];
    const soc = societa[Math.floor(Math.random() * societa.length)];
    const email = `${nome.toLowerCase()}.${cognome.toLowerCase().replace(' ', '')}${Math.floor(Math.random() * 100)}@email.com`;
    
    // Categoria: distribuzione realistica
    const catRnd = Math.random();
    let categoria;
    if (catRnd < 0.25) categoria = 'U15';
    else if (catRnd < 0.5) categoria = 'U19';
    else categoria = 'SENIOR';
    
    const dataNascita = randomDate(categoria);
    const telefono = randomPhone(soc.includes('Milan') || soc.includes('Roma') || soc.includes('Torino') ? 'IT' : 'FR');
    
    // Discipline random (1-4 discipline)
    const numDisc = 1 + Math.floor(Math.random() * 4);
    const discShuffle = [...discipline].sort(() => Math.random() - 0.5);
    const discScelte = discShuffle.slice(0, numDisc).map(d => `${d} (${categoria})`);
    
    // Taglia maglia e eventuale felpa
    const tagliaMaglia = taglie[Math.floor(Math.random() * taglie.length)];
    const vuoleFelpa = Math.random() > 0.7; // 30% vuole felpa
    const tagliaFelpa = vuoleFelpa ? taglie[Math.floor(Math.random() * taglie.length)] : null;
    
    // Tessere (almeno una)
    const hasWsId = Math.random() > 0.3;
    const hasFisr = Math.random() > 0.5 || !hasWsId;
    const wsId = hasWsId ? randomWsId() : null;
    const fisrCard = hasFisr ? randomFisrCard() : null;
    
    // Costruisci note nel formato del form
    let note = [`Genere: ${genere}`];
    if (wsId) note.push(`WS ID: ${wsId}`);
    if (fisrCard) note.push(`FISR: ${fisrCard}`);
    note.push(`Maglia: ${tagliaMaglia}`);
    if (vuoleFelpa) note.push(`Felpa: ${tagliaFelpa}`);
    
    db.run(`INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono, note) VALUES (?,?,?,?,?,?,?,?)`,
      [nome, cognome, dataNascita, discScelte.join(', '), soc, email, telefono, note.join(' | ')]);
  }
  console.log('Seeded 100 demo athletes');
}

function save() {
  if (usePostgres) return; // PostgreSQL salva automaticamente
  const data = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, data);
}

function all(sql, params = []) {
  if (usePostgres) {
    throw new Error('Usa allAsync per PostgreSQL');
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Wrapper async per query - funziona con entrambi i database
async function dbAll(sql, params = []) {
  if (usePostgres) {
    // Converti placeholder ? in $1, $2, etc per PostgreSQL
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    const res = await pgPool.query(pgSql, params);
    return res.rows;
  }
  return all(sql, params);
}

async function dbRun(sql, params = []) {
  if (usePostgres) {
    let idx = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    const res = await pgPool.query(pgSql, params);
    return res;
  }
  db.run(sql, params);
  save();
}

async function dbInsert(sql, params = []) {
  if (usePostgres) {
    let idx = 0;
    let pgSql = sql.replace(/\?/g, () => `$${++idx}`);
    // Aggiungi RETURNING id per ottenere l'ID inserito
    if (!pgSql.toLowerCase().includes('returning')) {
      pgSql += ' RETURNING id';
    }
    const res = await pgPool.query(pgSql, params);
    return (res.rows[0] && res.rows[0].id) ? res.rows[0].id : null;
  }
  db.run(sql, params);
  save();
  const lastId = all('SELECT last_insert_rowid() as id')[0];
  return (lastId && lastId.id) ? lastId.id : null;
}

app.get('/api/iscritti', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM iscritti ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Errore GET iscritti:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- EXPORT EXCEL ISCRITTI ---
app.get('/api/iscritti/export', requireAdmin, async (req, res) => {
  try {
    const iscritti = await dbAll('SELECT * FROM iscritti ORDER BY cognome, nome');
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Busto Battle XI';
    workbook.created = new Date();
    
    // Helper per parsing note
    function parseNote(note) {
      const result = { genere: '', nazionalita: '', wsId: '', fisr: '', maglia: '', felpa: '' };
      if (!note) return result;
      const parts = note.split(' | ');
      for (const p of parts) {
        if (p.startsWith('Genere:')) result.genere = p.replace('Genere:', '').trim();
        else if (p.startsWith('Nazionalità:')) result.nazionalita = p.replace('Nazionalità:', '').trim();
        else if (p.startsWith('WS ID:')) result.wsId = p.replace('WS ID:', '').trim();
        else if (p.startsWith('FISR:')) result.fisr = p.replace('FISR:', '').trim();
        else if (p.startsWith('Maglia:')) result.maglia = p.replace('Maglia:', '').trim();
        else if (p.startsWith('Felpa:')) result.felpa = p.replace('Felpa:', '').trim();
      }
      return result;
    }
    
    // Helper per parsing discipline
    function parseDiscipline(categoria) {
      if (!categoria) return [];
      // Formato: "Speed Slalom (U15), Battle (SENIOR)"
      const disc = [];
      const matches = categoria.match(/([^,]+\([^)]+\))/g);
      if (matches) {
        for (const m of matches) {
          const match = m.trim().match(/^(.+)\s*\((\w+)\)$/);
          if (match) {
            disc.push({ nome: match[1].trim(), categoria: match[2].trim() });
          }
        }
      }
      return disc;
    }
    
    // ========== FOGLIO 1: TUTTI GLI ATLETI ==========
    const sheetAtleti = workbook.addWorksheet('Tutti gli Atleti');
    sheetAtleti.columns = [
      { header: 'N°', key: 'num', width: 5 },
      { header: 'Cognome', key: 'cognome', width: 18 },
      { header: 'Nome', key: 'nome', width: 15 },
      { header: 'Data Nascita', key: 'data_nascita', width: 12 },
      { header: 'Genere', key: 'genere', width: 8 },
      { header: 'Nazionalità', key: 'nazionalita', width: 12 },
      { header: 'Società', key: 'societa', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'World Skate ID', key: 'ws_id', width: 15 },
      { header: 'Skate Italia Card', key: 'fisr', width: 15 },
      { header: 'Maglia', key: 'maglia', width: 8 },
      { header: 'Felpa', key: 'felpa', width: 8 },
      { header: 'Discipline', key: 'discipline', width: 40 },
      { header: 'Pagamento', key: 'pagamento', width: 10 },
      { header: 'Note', key: 'note_extra', width: 30 },
      { header: 'Note Admin', key: 'note_admin', width: 30 }
    ];
    
    // Stile header
    sheetAtleti.getRow(1).font = { bold: true };
    sheetAtleti.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7AF40' } };
    
    iscritti.forEach((isc, idx) => {
      const note = parseNote(isc.note);
      // Estrai note extra (tutto ciò che non è nei campi strutturati)
      let noteExtra = '';
      if (isc.note) {
        const parts = isc.note.split(' | ');
        const extraParts = parts.filter(p => 
          !p.startsWith('Genere:') && 
          !p.startsWith('WS ID:') && 
          !p.startsWith('FISR:') && 
          !p.startsWith('Maglia:') && 
          !p.startsWith('Felpa:') &&
          !p.startsWith('Prove:')
        );
        noteExtra = extraParts.join(' | ');
      }
      
      sheetAtleti.addRow({
        num: idx + 1,
        cognome: isc.cognome,
        nome: isc.nome,
        data_nascita: isc.data_nascita,
        genere: note.genere,
        nazionalita: isc.nazionalita || note.nazionalita || '',
        societa: isc.societa,
        email: isc.email,
        telefono: isc.telefono,
        ws_id: note.wsId,
        fisr: note.fisr,
        maglia: note.maglia,
        felpa: note.felpa || '-',
        discipline: isc.categoria,
        pagamento: isc.pagamento ? 'Sì' : 'No',
        note_extra: noteExtra,
        note_admin: isc.note_admin || ''
      });
    });
    
    // ========== FOGLI PER DISCIPLINA/CATEGORIA/GENERE ==========
    const discipline = ['Speed Slalom', 'Classic Slalom', 'Battle', 'Slides', 'Pair Slalom', 'Free Jump'];
    const categorie = ['U15', 'U19', 'SENIOR'];
    const generi = [{ code: 'M', name: 'Maschi' }, { code: 'F', name: 'Femmine' }];
    
    for (const disc of discipline) {
      for (const cat of categorie) {
        for (const gen of generi) {
          // Filtra atleti per questa combinazione
          const atleti = iscritti.filter(isc => {
            const note = parseNote(isc.note);
            const discipline = parseDiscipline(isc.categoria);
            const hasDisc = discipline.some(d => d.nome === disc && d.categoria === cat);
            return hasDisc && note.genere === gen.code;
          });
          
          if (atleti.length === 0) continue; // Salta fogli vuoti
          
          // Nome foglio max 31 caratteri
          let sheetName = `${disc.replace(' Slalom', '').replace(' ', '')} ${cat} ${gen.code}`;
          if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
          
          const sheet = workbook.addWorksheet(sheetName);
          sheet.columns = [
            { header: 'N°', key: 'num', width: 5 },
            { header: 'Cognome', key: 'cognome', width: 18 },
            { header: 'Nome', key: 'nome', width: 15 },
            { header: 'Data Nascita', key: 'data_nascita', width: 12 },
            { header: 'Società', key: 'societa', width: 25 },
            { header: 'World Skate ID', key: 'ws_id', width: 15 },
            { header: 'Skate Italia Card', key: 'fisr', width: 15 }
          ];
          
          // Stile header
          sheet.getRow(1).font = { bold: true };
          sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7AF40' } };
          
          // Titolo
          sheet.insertRow(1, [`${disc} - ${cat} - ${gen.name}`]);
          sheet.getRow(1).font = { bold: true, size: 14 };
          sheet.mergeCells('A1:G1');
          
          atleti.forEach((isc, idx) => {
            const note = parseNote(isc.note);
            sheet.addRow({
              num: idx + 1,
              cognome: isc.cognome,
              nome: isc.nome,
              data_nascita: isc.data_nascita,
              societa: isc.societa,
              ws_id: note.wsId,
              fisr: note.fisr
            });
          });
          
          // Riga totale
          sheet.addRow([]);
          sheet.addRow([`Totale iscritti: ${atleti.length}`]);
        }
      }
    }
    
    // Genera e invia file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=BustoBattle_Iscritti.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ error: 'Errore generazione Excel: ' + err.message });
  }
});

// --- AUTH API ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const rows = await dbAll('SELECT * FROM users WHERE username=?', [username]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ ok: true, username: user.username, role: user.role });
  } catch (err) {
    console.error('Errore login:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Non autenticato' });
  res.json(req.session.user);
});

// Middleware protezione admin
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accesso negato' });
  }
  next();
}

// Protezione pagina admin
app.get('/admin.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login.html');
  }
  next();
});

// --- PAGE SETTINGS API ---
app.get('/api/pages', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM page_settings');
    res.json(rows);
  } catch (err) {
    console.error('Errore GET pages:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pages/:page', requireAdmin, async (req, res) => {
  try {
    const { enabled, visible } = req.body;
    if (enabled !== undefined) {
      await dbRun('UPDATE page_settings SET enabled=? WHERE page=?', [enabled ? 1 : 0, req.params.page]);
    }
    if (visible !== undefined) {
      await dbRun('UPDATE page_settings SET visible=? WHERE page=?', [visible ? 1 : 0, req.params.page]);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore PUT pages:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- SIMULAZIONE UTENTE ---
app.post('/api/admin/simulate', requireAdmin, async (req, res) => {
  try {
    const { iscritto_id } = req.body;
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [+iscritto_id]);
    const iscritto = rows[0];
    if (!iscritto) return res.status(404).json({ error: 'Iscritto non trovato' });
    req.session.simulating = iscritto;
    res.json({ ok: true, iscritto });
  } catch (err) {
    console.error('Errore simulate:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/stop-simulate', requireAdmin, (req, res) => {
  delete req.session.simulating;
  res.json({ ok: true });
});

app.get('/api/admin/simulating', requireAdmin, (req, res) => {
  res.json({ simulating: req.session.simulating || null });
});

// Endpoint temporaneo per aggiungere iscritto test
app.get('/api/add-test-user', async (req, res) => {
  try {
    const id = await dbInsert(`INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono, stato)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Test', 'Utente', '1990-01-01', 'Speed Slalom', 'Test Club', 'amicocatoblepa78@gmail.com', '3331234567', 'confermata']);
    const codice = 'BB11-' + String(id).padStart(4, '0');
    res.json({ ok: true, id, codice, email: 'amicocatoblepa78@gmail.com' });
  } catch (err) {
    console.error('Errore add-test-user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/iscritti', async (req, res) => {
  try {
    const { nome, cognome, data_nascita, categoria, societa, email, telefono, navetta, navetta_dettagli, note, prove, paymentMethod } = req.body;
    
    // Validazione età minima (nati dal 2016 o prima)
    if (data_nascita) {
      const annoNascita = parseInt(data_nascita.split('-')[0]);
      if (annoNascita > 2016) {
        return res.status(400).json({ error: 'Gli atleti devono essere nati nel 2016 o prima (età minima U15)' });
      }
    }
    
    const id = await dbInsert(`INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono, navetta, navetta_dettagli, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, cognome, data_nascita || null, categoria || null, societa || null, email || null, telefono || null, navetta ? 1 : 0, navetta_dettagli || null, note || null]);
    
    const codice = 'BB11-' + String(id).padStart(4, '0');
    console.log('Nuovo iscritto:', { id, codice, nome, cognome, paymentMethod });
    
    // Salva prenotazioni prove pista
    if (prove && prove.length > 0) {
      const proveCodice = 'PRV-' + codice;
      for (const p of prove) {
        // Supporta sia formato vecchio (stringa) che nuovo (oggetto {ora, giorno, specialita})
        let ora, giorno, specialita;
        if (typeof p === 'string') {
          ora = p;
          giorno = null;
          specialita = null;
        } else {
          ora = p.ora;
          giorno = p.giorno || null;
          specialita = p.specialita || null;
        }
        const noteProva = specialita ? `${ora}: ${specialita}` : null;
        await dbRun('INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, giorno, codice, note) VALUES (?,?,?,?,?,?,?,?)',
          [nome, cognome, email || null, telefono || null, ora, giorno, proveCodice, noteProva]);
      }
      console.log('Prove prenotate:', { codice: proveCodice, sessioni: prove });
    }
    
    // Invio email di conferma SOLO per bonifico (non per pagamento online)
    // Per pagamento online, l'email parte dopo il completamento del pagamento Stripe
    if (email && paymentMethod !== 'online') {
      const discipline = categoria ? categoria.split(', ') : [];
      const totale = discipline.length * 40;
      // Usa sendStatusEmail con stato 'sospesa' che usa Brevo API
      sendStatusEmail(email, { nome, cognome, codice, categoria, stato: 'sospesa' }).catch(console.error);
    }
    res.json({ id, codice });
  } catch (err) {
    console.error('Errore POST iscritti:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/iscritti/:id', async (req, res) => {
  try {
    const { nome, cognome, data_nascita, categoria, societa, nazionalita, email, telefono, navetta, navetta_dettagli, pagamento, note, note_admin } = req.body;
    await dbRun(`UPDATE iscritti SET nome=?, cognome=?, data_nascita=?, categoria=?, societa=?, nazionalita=?, email=?, telefono=?, navetta=?, navetta_dettagli=?, pagamento=?, note=?, note_admin=? WHERE id=?`,
      [nome, cognome, data_nascita || null, categoria || null, societa || null, nazionalita || null, email || null, telefono || null, navetta ? 1 : 0, navetta_dettagli || null, pagamento ? 1 : 0, note || null, note_admin || null, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore PUT iscritti:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/iscritti/:id', async (req, res) => {
  try {
    const id = +req.params.id;
    // Prima ottieni il codice per cancellare le prove associate
    const rows = await dbAll('SELECT id FROM iscritti WHERE id=?', [id]);
    if (rows.length) {
      const codice = 'BB11-' + String(id).padStart(4, '0');
      const proveCodice = 'PRV-' + codice;
      // Cancella le prenotazioni prove associate
      await dbRun('DELETE FROM prove_prenotazioni WHERE codice=?', [proveCodice]);
      console.log('Cancellate prove associate:', proveCodice);
    }
    // Poi cancella l'iscritto
    await dbRun('DELETE FROM iscritti WHERE id=?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore DELETE iscritti:', err);
    res.status(500).json({ error: err.message });
  }
});

// Conferma pagamento tramite codice (chiamato dopo ritorno da Stripe)
app.post('/api/iscritti/conferma-pagamento', async (req, res) => {
  try {
    const { codice } = req.body;
    if (!codice) return res.status(400).json({ error: 'Codice mancante' });
    
    // Estrai ID dal codice (es. BB11-0101 -> 101)
    const match = codice.match(/BB11-(\d+)/);
    if (!match) return res.status(400).json({ error: 'Codice non valido' });
    
    const id = parseInt(match[1]);
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    await dbRun('UPDATE iscritti SET pagamento=1, stato=? WHERE id=?', ['confermata', id]);
    console.log('Pagamento Stripe confermato per iscritto:', { codice, id });
    
    // Invia email conferma
    if (iscritto && iscritto.email) {
      sendStatusEmail(iscritto.email, { ...iscritto, codice, stato: 'confermata' }).catch(console.error);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore conferma pagamento:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload ricevuta bonifico
const uploadRicevute = multer({
  storage: multer.memoryStorage(), // Usa memoria invece di disco
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

app.post('/api/iscritti/upload-ricevuta', uploadRicevute.single('ricevuta'), async (req, res) => {
  try {
    const { codice } = req.body;
    if (!codice) return res.status(400).json({ error: 'Codice mancante' });
    if (!req.file) return res.status(400).json({ error: 'File ricevuta mancante' });
    
    const match = codice.match(/BB11-(\d+)/);
    if (!match) return res.status(400).json({ error: 'Codice non valido' });
    
    const id = parseInt(match[1]);
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    if (!iscritto) return res.status(404).json({ error: 'Iscrizione non trovata' });
    
    // Salva file come base64 nel database (per evitare problemi filesystem Render)
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    // Aggiorna stato a "verifica" e salva ricevuta come base64
    await dbRun('UPDATE iscritti SET stato=?, ricevuta_bonifico=?, ricevuta_base64=? WHERE id=?', ['verifica', filename, base64Data, id]);
    console.log('Ricevuta caricata:', { codice, id, filename });
    
    // Invia email conferma ricezione
    if (iscritto.email) {
      sendStatusEmail(iscritto.email, { ...iscritto, codice, stato: 'verifica' }).catch(console.error);
    }
    
    res.json({ ok: true, stato: 'verifica' });
  } catch (err) {
    console.error('Errore upload ricevuta:', err);
    res.status(500).json({ error: err.message });
  }
});

// Ottieni stato iscrizione per codice (pubblico)
app.get('/api/iscritti/stato/:codice', async (req, res) => {
  try {
    const match = req.params.codice.match(/BB11-(\d+)/);
    if (!match) return res.status(400).json({ error: 'Codice non valido' });
    
    const id = parseInt(match[1]);
    const rows = await dbAll('SELECT id, nome, cognome, stato, pagamento, ricevuta_bonifico FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    if (!iscritto) return res.status(404).json({ error: 'Iscrizione non trovata' });
    
    const codice = 'BB11-' + String(id).padStart(4, '0');
    res.json({ ...iscritto, codice });
  } catch (err) {
    console.error('Errore stato iscrizione:', err);
    res.status(500).json({ error: err.message });
  }
});

// Visualizza ricevuta (admin)
app.get('/api/iscritti/:id/ricevuta', requireAdmin, async (req, res) => {
  try {
    const id = +req.params.id;
    const rows = await dbAll('SELECT ricevuta_base64, ricevuta_bonifico FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    if (!iscritto || !iscritto.ricevuta_base64) {
      return res.status(404).json({ error: 'Ricevuta non trovata' });
    }
    
    // Estrai mimetype e dati dal base64
    const matches = iscritto.ricevuta_base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(500).json({ error: 'Formato ricevuta non valido' });
    }
    
    const mimetype = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${iscritto.ricevuta_bonifico || 'ricevuta'}"`);
    res.send(data);
  } catch (err) {
    console.error('Errore ricevuta:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: conferma pagamento bonifico
app.post('/api/iscritti/:id/conferma-bonifico', requireAdmin, async (req, res) => {
  try {
    const id = +req.params.id;
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    if (!iscritto) return res.status(404).json({ error: 'Iscritto non trovato' });
    
    await dbRun('UPDATE iscritti SET pagamento=1, stato=? WHERE id=?', ['confermata', id]);
    
    const codice = 'BB11-' + String(id).padStart(4, '0');
    console.log('Bonifico confermato da admin:', { codice, id });
    
    // Conferma automaticamente le prove pista collegate
    const proveCodice = 'PRV-' + codice;
    const proveCollegate = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [proveCodice]);
    if (proveCollegate.length > 0) {
      await dbRun('UPDATE prove_prenotazioni SET stato=? WHERE codice=?', ['confermata', proveCodice]);
      console.log('Prove pista confermate automaticamente:', { proveCodice, count: proveCollegate.length });
    }
    
    // Invia email conferma
    if (iscritto.email) {
      sendStatusEmail(iscritto.email, { ...iscritto, codice, stato: 'confermata' }).catch(console.error);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore conferma bonifico:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin: rigetta ricevuta bonifico
app.post('/api/iscritti/:id/rigetta-bonifico', requireAdmin, async (req, res) => {
  try {
    const id = +req.params.id;
    const { motivo } = req.body;
    
    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ error: 'Motivo del rigetto obbligatorio' });
    }
    
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [id]);
    const iscritto = rows[0];
    if (!iscritto) return res.status(404).json({ error: 'Iscritto non trovato' });
    
    // Resetta stato a sospesa e rimuovi ricevuta per permettere nuovo upload
    await dbRun('UPDATE iscritti SET stato=?, ricevuta_bonifico=NULL, ricevuta_base64=NULL WHERE id=?', ['sospesa', id]);
    
    const codice = 'BB11-' + String(id).padStart(4, '0');
    console.log('Ricevuta rigettata da admin:', { codice, id, motivo });
    
    // Invia email rigetto
    if (iscritto.email) {
      sendStatusEmail(iscritto.email, { ...iscritto, codice, stato: 'rigettata', motivo }).catch(console.error);
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore rigetto bonifico:', err);
    res.status(500).json({ error: err.message });
  }
});

// Funzione per inviare email di stato
async function sendStatusEmail(to, data) {
  const { nome, cognome, codice, stato, categoria } = data;
  
  // Header comune con logo (senza sottotitolo)
  const emailHeader = `
    <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:8px 8px 0 0">
      <img src="https://bb2026.onrender.com/LogoBB.jpeg" alt="Busto Battle XI" style="height:80px;border-radius:8px">
      <h1 style="color:#F7AF40;margin:15px 0 0;font-family:Arial,sans-serif">BUSTO BATTLE XI</h1>
    </div>
  `;
  
  // Footer comune bilingue con sponsor
  const emailFooter = `
    <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:0 0 8px 8px;margin-top:20px">
      <p style="color:#888;margin:0 0 15px;font-family:Arial,sans-serif">📅 13-15 Novembre / November 2026 | 📍 Busto Arsizio (VA), Italy</p>
      
      <div style="margin:20px 0;padding:15px 0;border-top:1px solid #333">
        <p style="color:#666;margin:0 0 10px;font-size:11px;font-family:Arial,sans-serif">SPONSORS</p>
        <a href="https://www.fr-skates.com" target="_blank" style="display:inline-block;margin:0 15px">
          <img src="https://bb2026.onrender.com/Fr.webp" alt="FR Skates" style="height:50px">
        </a>
        <a href="https://www.tmc.it" target="_blank" style="display:inline-block;margin:0 15px">
          <img src="https://bb2026.onrender.com/tmc.png" alt="TMC" style="height:40px;filter:invert(1)">
        </a>
      </div>
      
      <p style="color:#666;margin:0;font-size:12px;font-family:Arial,sans-serif">
        <a href="https://bb2026.onrender.com" style="color:#F7AF40">www.bustobattle.it</a> | 
        <a href="mailto:bustobattle@gmail.com" style="color:#F7AF40">bustobattle@gmail.com</a>
      </p>
    </div>
  `;
  
  let subject, html;
  
  if (stato === 'sospesa') {
    subject = `Busto Battle XI - Iscrizione Sospesa / Registration Pending - ${codice}`;
    html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#f59e0b;color:#000;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🕐 Iscrizione Sospesa / Registration Pending</h2>
          </div>
          
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua iscrizione è stata registrata con successo!<br><em style="color:#888">Your registration has been recorded successfully!</em></p>
          
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice iscrizione / Registration code:</strong> ${codice}</p>
            <p style="margin:0"><strong style="color:#F7AF40">Discipline / Disciplines:</strong> ${categoria || 'N/D'}</p>
          </div>
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px">📋 Per completare l'iscrizione / To complete registration:</h3>
          
          <p><strong>1. Effettua il bonifico bancario / Make a bank transfer:</strong></p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:10px 0 20px">
            <p style="margin:5px 0"><strong>IBAN:</strong> IT54Y0326822800052416865080</p>
            <p style="margin:5px 0"><strong>Banca:</strong> Banca Sella</p>
            <p style="margin:5px 0"><strong>Intestatario / Account holder:</strong> Accademia Bustese Pattinaggio ASD</p>
            <p style="margin:5px 0"><strong>Causale / Reference:</strong> ${codice} - ${nome} ${cognome}</p>
          </div>
          
          <p><strong>2. Carica la ricevuta del bonifico / Upload the transfer receipt:</strong></p>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta.html?codice=${codice}" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Ricevuta / Upload Receipt</a>
          </p>
          
          <p style="color:#888;font-size:14px;margin-top:30px">Dopo aver caricato la ricevuta, verificheremo il pagamento e riceverai la conferma via email.<br><em>After uploading the receipt, we will verify the payment and send you a confirmation email.</em></p>
        </div>
        ${emailFooter}
      </div>
    `;
  } else if (stato === 'verifica') {
    subject = `Busto Battle XI - Iscrizione in Verifica / Under Review - ${codice}`;
    html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#3b82f6;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🔍 Iscrizione in Verifica / Under Review</h2>
          </div>
          
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>Abbiamo ricevuto la ricevuta del bonifico per la tua iscrizione.<br><em style="color:#888">We have received the bank transfer receipt for your registration.</em></p>
          
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0"><strong style="color:#F7AF40">Codice iscrizione / Registration code:</strong> ${codice}</p>
          </div>
          
          <div style="background:#1e3a5f;border:1px solid #3b82f6;padding:20px;border-radius:6px;margin:20px 0">
            <p style="margin:0;text-align:center">
              <strong style="color:#3b82f6">⏳ Verifica in corso / Verification in progress</strong><br>
              <span style="color:#888;font-size:14px">Il nostro team verificherà il pagamento entro 2-3 giorni lavorativi.<br><em>Our team will verify the payment within 2-3 business days.</em></span>
            </p>
          </div>
          
          <p>Riceverai una email di conferma non appena completata la verifica.<br><em style="color:#888">You will receive a confirmation email as soon as the verification is complete.</em></p>
          
          <p style="color:#888;font-size:14px;margin-top:30px">Grazie per la pazienza! / Thank you for your patience!</p>
        </div>
        ${emailFooter}
      </div>
    `;
  } else if (stato === 'confermata') {
    subject = `Busto Battle XI - Iscrizione Confermata / Registration Confirmed! - ${codice}`;
    html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#22c55e;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">✅ Iscrizione Confermata / Registration Confirmed!</h2>
          </div>
          
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua iscrizione è stata <strong style="color:#22c55e">confermata</strong>!<br><em style="color:#888">Your registration has been <strong style="color:#22c55e">confirmed</strong>!</em></p>
          
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice iscrizione / Registration code:</strong> ${codice}</p>
            <p style="margin:0"><strong style="color:#F7AF40">Discipline / Disciplines:</strong> ${categoria || 'N/D'}</p>
          </div>
          
          <div style="background:#1a3a1a;border:2px solid #22c55e;padding:20px;border-radius:6px;text-align:center;margin:20px 0">
            <p style="margin:0;font-size:20px;color:#22c55e">🎉 Ci vediamo a Busto Arsizio! / See you in Busto Arsizio!</p>
            <p style="margin:10px 0 0;color:#888">📅 13-15 Novembre / November 2026</p>
          </div>
          
          ${(categoria && (categoria.includes('Classic Slalom') || categoria.includes('Pair Slalom'))) ? `
          <div style="background:#2d1f3d;border:2px solid #9333ea;padding:20px;border-radius:6px;margin:20px 0">
            <h3 style="color:#9333ea;margin:0 0 15px">🎵 Invia la tua musica / Send your music</h3>
            <p style="margin:0;color:#f0f0f0">Se sei iscritto a <strong>Classic Slalom</strong> o <strong>Pair Slalom</strong>, invia il file musicale a:<br><em style="color:#888">If you registered for <strong>Classic Slalom</strong> or <strong>Pair Slalom</strong>, send your music file to:</em></p>
            <p style="margin:15px 0;text-align:center">
              <a href="mailto:bustobattle@gmail.com?subject=Musica ${codice} - ${nome} ${cognome}" style="background:#9333ea;color:#fff;padding:12px 25px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📧 bustobattle@gmail.com</a>
            </p>
            <p style="margin:0;color:#888;font-size:13px">📝 Oggetto / Subject: <strong style="color:#ccc">"Musica - ${nome} ${cognome}"</strong></p>
          </div>
          ` : ''}
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px;margin-top:30px">🚆 Come Arrivare / How to Get Here</h3>
          <div style="background:#222;padding:15px;border-radius:6px;margin:15px 0">
            <p style="margin:0;color:#ccc;font-size:13px"><strong>Da Malpensa:</strong> Malpensa Express → Busto Arsizio FN (~15 min)</p>
            <p style="margin:5px 0 0;color:#ccc;font-size:13px"><strong>Da Milano Cadorna/Centrale:</strong> Treno FN → Busto Arsizio FN (~35 min)</p>
            <p style="margin:8px 0 0;color:#888;font-size:12px"><em>From Malpensa: Malpensa Express → Busto Arsizio FN (~15 min)<br>From Milan Cadorna/Centrale: FN train → Busto Arsizio FN (~35 min)</em></p>
          </div>
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px;margin-top:30px">📍 Luoghi della Gara / Competition Venues</h3>
          
          <div style="background:#222;padding:15px;border-radius:6px;margin:15px 0">
            <p style="margin:0 0 5px"><strong style="color:#F7AF40">PalaCastiglioni</strong> - Speed Slalom • Classic Slalom • Battle • Slides • Pair Slalom • Free Jump</p>
            <p style="margin:0;color:#888;font-size:12px">🚶 200m dalla Stazione FN e dagli hotel / 200m from FN Station and hotels</p>
            <p style="margin:5px 0 0"><a href="https://share.google/6E1klmiKIJL51MLUg" style="color:#F7AF40;font-size:12px">📍 Google Maps →</a></p>
          </div>
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px;margin-top:30px">🏨 Hotel Convenzionati / Partner Hotels</h3>
          <p style="color:#888;font-size:12px;margin-bottom:10px">200m dalla Stazione FN e ~500m dal PalaCastiglioni</p>
          
          <div style="background:#222;padding:12px;border-radius:6px;margin:10px 0">
            <p style="margin:0"><strong style="color:#F7AF40">Hotel Ristorante Mazzini</strong> - 📍 Piazza Manzoni 1</p>
            <p style="margin:5px 0 0;color:#ccc;font-size:12px">Singola €50 | Doppia €70 | Tripla €90</p>
            <p style="margin:5px 0 0;font-size:12px">📞 0331 631715 | 💬 <a href="https://wa.me/393299835000" style="color:#25D366">WhatsApp</a></p>
          </div>
          <div style="background:#222;padding:12px;border-radius:6px;margin:10px 0">
            <p style="margin:0"><strong style="color:#F7AF40">Tower Hotel</strong> <span style="color:#888;font-size:12px">- Dettagli in arrivo / Coming soon</span></p>
          </div>
          <p style="color:#888;font-size:12px;margin:8px 0">💡 Indica "Busto Battle XI" per la convenzione / Mention "Busto Battle XI" for special rate</p>
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px;margin-top:30px">🍽️ Cena Atleti / Athletes Dinner</h3>
          <p style="color:#ccc;font-size:13px"><strong>Ristorante Albergo Mazzini</strong> - 📍 Piazza Manzoni 1</p>
          <p style="color:#ccc;font-size:13px">13-14 Novembre | Menu completo: <strong style="color:#F7AF40">€18</strong></p>
          
          <h3 style="color:#F7AF40;border-bottom:1px solid #333;padding-bottom:10px;margin-top:30px">🔗 Link Utili / Useful Links</h3>
          <p style="text-align:center;margin:15px 0">
            <a href="https://bb2026.onrender.com/programma.html" style="background:#F7AF40;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;margin:5px;font-size:13px">📅 Programma / Schedule</a>
            <a href="https://bb2026.onrender.com/travel.html" style="background:#F7AF40;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;margin:5px;font-size:13px">✈️ Travel Info</a>
          </p>
        </div>
        ${emailFooter}
      </div>
    `;
  } else if (stato === 'rigettata') {
    const motivo = data.motivo || 'Motivo non specificato';
    subject = `Busto Battle XI - Ricevuta Non Valida / Invalid Receipt - ${codice}`;
    html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#ef4444;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">❌ Ricevuta Non Valida / Invalid Receipt</h2>
          </div>
          
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La ricevuta del bonifico che hai caricato per la tua iscrizione <strong style="color:#ef4444">non è stata accettata</strong>.<br><em style="color:#888">The bank transfer receipt you uploaded for your registration <strong style="color:#ef4444">has not been accepted</strong>.</em></p>
          
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0"><strong style="color:#F7AF40">Codice iscrizione / Registration code:</strong> ${codice}</p>
          </div>
          
          <div style="background:#3d1515;border:2px solid #ef4444;padding:20px;border-radius:6px;margin:20px 0">
            <p style="margin:0;color:#ef4444;font-weight:bold">📋 Motivo / Reason:</p>
            <p style="margin:10px 0 0;color:#f0f0f0">${motivo}</p>
          </div>
          
          <p>Per completare l'iscrizione, carica una nuova ricevuta valida:<br><em style="color:#888">To complete your registration, please upload a new valid receipt:</em></p>
          
          <p style="text-align:center;margin:25px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta.html?codice=${codice}" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Nuova Ricevuta / Upload New Receipt</a>
          </p>
          
          <p style="color:#888;font-size:14px;margin-top:30px">Se hai domande, contattaci a <a href="mailto:bustobattle@gmail.com" style="color:#F7AF40">bustobattle@gmail.com</a><br><em>If you have questions, contact us at bustobattle@gmail.com</em></p>
        </div>
        ${emailFooter}
      </div>
    `;
  }
  
  if (!subject) return;
  
  // Usa Brevo API per inviare email
  try {
    const brevoApiKey = process.env.BREVO_API_KEY;
    const bccEmail = 'bustobattle@gmail.com'; // Copia di sicurezza
    
    if (brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Busto Battle XI', email: process.env.BREVO_FROM || 'noreply@bustobattle.it' },
          to: [{ email: to }],
          bcc: [{ email: bccEmail }],
          subject: subject,
          htmlContent: html
        })
      });
      
      if (response.ok) {
        console.log('Email stato inviata via Brevo API:', { to, bcc: bccEmail, stato, codice });
      } else {
        const errorData = await response.json();
        console.error('Errore Brevo API:', errorData);
      }
    } else {
      console.log('Email non inviata (BREVO_API_KEY non configurata):', { to, stato, codice });
    }
  } catch (err) {
    console.error('Errore invio email stato:', err);
  }
}

// Endpoint per inviare email di test (solo per admin)
app.get('/api/test-email', async (req, res) => {
  const { to, stato, nome, cognome, motivo, categoria } = req.query;
  
  if (!to || !stato) {
    return res.status(400).json({ error: 'Parametri mancanti: to, stato. Esempio: /api/test-email?to=email@test.com&stato=confermata&nome=Pino&cognome=Pinotto. Per rigettata aggiungere &motivo=... Per testare musica: &categoria=Classic Slalom (SENIOR)' });
  }
  
  // Dati per il test (usa parametri o default)
  const testData = {
    nome: nome || 'Mario',
    cognome: cognome || 'Rossi',
    codice: 'BB11-TEST',
    stato: stato,
    categoria: categoria || 'Speed Slalom (U15), Battle (U19), Classic Slalom (SENIOR)',
    motivo: motivo || 'Importo non corrispondente'
  };
  
  try {
    await sendStatusEmail(to, testData);
    res.json({ ok: true, message: `Email di test (${stato}) inviata a ${to}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- STRIPE CHECKOUT API ---
app.post('/api/stripe/create-checkout', async (req, res) => {
  try {
    const { iscritto_id, totale, descrizione, success_url, cancel_url, from_page } = req.body;
    
    console.log('Stripe checkout request:', { iscritto_id, totale, descrizione });
    
    if (!iscritto_id || iscritto_id === 0 || !totale || totale <= 0) {
      return res.status(400).json({ error: 'Dati mancanti', details: { iscritto_id, totale } });
    }

    // Recupera l'iscritto (usa dbAll per compatibilità PostgreSQL/SQLite)
    const rows = await dbAll('SELECT * FROM iscritti WHERE id=?', [+iscritto_id]);
    const iscritto = rows[0];
    if (!iscritto) {
      return res.status(404).json({ error: 'Iscritto non trovato' });
    }

    const codice = 'BB11-' + String(iscritto_id).padStart(4, '0');
    
    // Determina la pagina di ritorno (default iscrizioni.html)
    const returnPage = from_page || 'iscrizioni.html';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Crea sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Iscrizione Busto Battle XI - ${codice}`,
            description: descrizione || `${iscritto.nome} ${iscritto.cognome} - ${iscritto.categoria || 'N/D'}`,
          },
          unit_amount: Math.round(totale * 100), // Stripe usa centesimi
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url || `${baseUrl}/${returnPage}?payment=success&codice=${codice}`,
      cancel_url: cancel_url || `${baseUrl}/${returnPage}?payment=cancel&codice=${codice}`,
      metadata: {
        iscritto_id: String(iscritto_id),
        codice: codice
      },
      customer_email: iscritto.email || undefined,
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Errore creazione pagamento: ' + err.message });
  }
});

// Webhook Stripe per confermare pagamento (opzionale, per server sempre attivi)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    return res.status(400).send('Webhook secret non configurato');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const iscritto_id = session.metadata && session.metadata.iscritto_id ? session.metadata.iscritto_id : null;
    if (iscritto_id) {
      db.run('UPDATE iscritti SET pagamento=1 WHERE id=?', [+iscritto_id]);
      save();
      console.log(`Pagamento confermato per iscritto ${iscritto_id}`);
      
      // Conferma automaticamente le prove pista collegate
      const codice = 'BB11-' + String(iscritto_id).padStart(4, '0');
      const proveCodice = 'PRV-' + codice;
      db.run('UPDATE prove_prenotazioni SET stato=? WHERE codice=?', ['confermata', proveCodice]);
      save();
      console.log(`Prove pista confermate automaticamente: ${proveCodice}`);
    }
  }

  res.json({ received: true });
});

// --- NAVETTA API ---
app.get('/api/navetta/slots', (req, res) => {
  res.json(all('SELECT * FROM navetta_slots ORDER BY giorno, ora'));
});

app.post('/api/navetta/slots', requireAdmin, (req, res) => {
  const { giorno, ora, partenza, arrivo, posti_max, costo } = req.body;
  if (!giorno || !ora || !partenza || !arrivo) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  db.run('INSERT INTO navetta_slots (giorno, ora, partenza, arrivo, posti_max, costo) VALUES (?,?,?,?,?,?)',
    [giorno, ora, partenza, arrivo, posti_max || 8, costo || 2]);
  save();
  res.json({ ok: true });
});

app.put('/api/navetta/slots/:id', requireAdmin, (req, res) => {
  const { giorno, ora, partenza, arrivo, posti_max, costo } = req.body;
  db.run('UPDATE navetta_slots SET giorno=?, ora=?, partenza=?, arrivo=?, posti_max=?, costo=? WHERE id=?',
    [giorno, ora, partenza, arrivo, posti_max, costo, +req.params.id]);
  save();
  res.json({ ok: true });
});

app.delete('/api/navetta/slots/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM navetta_slots WHERE id=?', [+req.params.id]);
  save();
  res.json({ ok: true });
});

app.get('/api/navetta/config', (req, res) => {
  const slots = all('SELECT DISTINCT giorno FROM navetta_slots ORDER BY giorno');
  const ore = all('SELECT DISTINCT ora FROM navetta_slots ORDER BY ora');
  const first = all('SELECT * FROM navetta_slots LIMIT 1')[0] || {};
  res.json({
    giorni: slots.map(s => s.giorno),
    ore: ore.map(o => o.ora),
    posti_max: first.posti_max || 8,
    max_per_prenotazione: 8,
    costo_persona: first.costo || 2,
    partenza: first.partenza || '',
    arrivo: first.arrivo || ''
  });
});

app.get('/api/navetta/disponibilita', (req, res) => {
  const slots = all('SELECT * FROM navetta_slots ORDER BY giorno, ora');
  const result = {};
  for (const slot of slots) {
    if (!result[slot.giorno]) result[slot.giorno] = {};
    for (const dir of ['andata', 'ritorno']) {
      const key = `${slot.ora}_${dir}`;
      const rows = all('SELECT SUM(num_persone) as tot FROM navetta_prenotazioni WHERE giorno=? AND ora=? AND direzione=?', [slot.giorno, slot.ora, dir]);
      const occupati = (rows[0] && rows[0].tot) ? rows[0].tot : 0;
      result[slot.giorno][key] = {
        posti: slot.posti_max - occupati,
        partenza: dir === 'andata' ? slot.partenza : slot.arrivo,
        arrivo: dir === 'andata' ? slot.arrivo : slot.partenza
      };
    }
  }
  res.json(result);
});

app.post('/api/navetta/prenota', (req, res) => {
  const { nome, cognome, email, telefono, corse } = req.body;
  if (!corse || !corse.length) return res.status(400).json({ error: 'Nessuna corsa selezionata' });
  
  for (const c of corse) {
    const slot = all('SELECT * FROM navetta_slots WHERE giorno=? AND ora=?', [c.giorno, c.ora])[0];
    if (!slot) return res.status(400).json({ error: `Slot ${c.giorno} ${c.ora} non trovato` });
    
    if (c.num_persone < 1 || c.num_persone > 8) {
      return res.status(400).json({ error: 'Max 8 persone per corsa' });
    }
    const rows = all('SELECT SUM(num_persone) as tot FROM navetta_prenotazioni WHERE giorno=? AND ora=? AND direzione=?', [c.giorno, c.ora, c.direzione]);
    const occupati = (rows[0] && rows[0].tot) ? rows[0].tot : 0;
    if (occupati + c.num_persone > slot.posti_max) {
      return res.status(400).json({ error: `Posti esauriti per ${c.giorno} ${c.ora} ${c.direzione}` });
    }
  }
  
  const codice = 'NAV-' + Date.now().toString(36).toUpperCase();
  let totale = 0;
  for (const c of corse) {
    const slot = all('SELECT costo FROM navetta_slots WHERE giorno=? AND ora=?', [c.giorno, c.ora])[0];
    db.run('INSERT INTO navetta_prenotazioni (nome, cognome, email, telefono, giorno, ora, direzione, num_persone, codice) VALUES (?,?,?,?,?,?,?,?,?)',
      [nome, cognome, email || null, telefono || null, c.giorno, c.ora, c.direzione, c.num_persone, codice]);
    totale += c.num_persone * ((slot && slot.costo) ? slot.costo : 2);
  }
  save();
  res.json({ codice, totale });
});

app.get('/api/navetta/prenotazioni', (req, res) => {
  res.json(all('SELECT * FROM navetta_prenotazioni ORDER BY giorno, ora, direzione'));
});

app.delete('/api/navetta/prenotazioni/:codice', (req, res) => {
  db.run('DELETE FROM navetta_prenotazioni WHERE codice=?', [req.params.codice]);
  save();
  res.json({ ok: true });
});

app.put('/api/navetta/prenotazioni/:id', (req, res) => {
  const { ora, direzione } = req.body;
  db.run('UPDATE navetta_prenotazioni SET ora=?, direzione=? WHERE id=?', [ora, direzione, +req.params.id]);
  save();
  res.json({ ok: true });
});

// --- CONTACT API ---
app.post('/api/contact', (req, res) => {
  const { nome, email, oggetto, messaggio } = req.body;
  if (!nome || !email || !oggetto || !messaggio) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  sendContactEmail({ nome, email, oggetto, messaggio }).catch(console.error);
  res.json({ ok: true });
});

// --- RISULTATI API ---
app.get('/api/risultati', (req, res) => {
  res.json(all('SELECT * FROM risultati ORDER BY created_at DESC'));
});

app.post('/api/risultati', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File PDF richiesto' });
  const { titolo, categoria } = req.body;
  if (!titolo) return res.status(400).json({ error: 'Titolo richiesto' });
  db.run('INSERT INTO risultati (titolo, filename, categoria) VALUES (?, ?, ?)',
    [titolo, req.file.filename, categoria || null]);
  save();
  // Invia push notification a tutti gli iscritti
  const subs = all('SELECT * FROM push_subscriptions');
  const payload = JSON.stringify({
    title: '🏆 Busto Battle XI',
    body: `Nuova classifica: ${titolo}`,
    url: '/risultati.html'
  });
  for (const sub of subs) {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
    };
    webpush.sendNotification(pushSub, payload).catch(err => {
      if (err.statusCode === 410) {
        db.run('DELETE FROM push_subscriptions WHERE endpoint=?', [sub.endpoint]);
        save();
      }
    });
  }
  res.json({ ok: true, filename: req.file.filename });
});

app.delete('/api/risultati/:id', (req, res) => {
  const rows = all('SELECT filename FROM risultati WHERE id=?', [+req.params.id]);
  if (rows.length) {
    const filepath = path.join(UPLOADS_DIR, rows[0].filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }
  db.run('DELETE FROM risultati WHERE id=?', [+req.params.id]);
  save();
  res.json({ ok: true });
});

// --- MERCHANDISING API ---
app.post('/api/merch/ordina', (req, res) => {
  const { nome, cognome, email, telefono, items, note } = req.body;
  if (!nome || !cognome) return res.status(400).json({ error: 'Nome e cognome richiesti' });
  if (!items || !items.length) return res.status(400).json({ error: 'Seleziona almeno un articolo' });

  const codice = 'MRC-' + Date.now().toString(36).toUpperCase();
  db.run('INSERT INTO merch_ordini (nome, cognome, email, telefono, codice, note) VALUES (?,?,?,?,?,?)',
    [nome, cognome, email || null, telefono || null, codice, note || null]);
  save();
  const ordineId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];

  let totale = 0;
  for (const item of items) {
    const prezzo = item.articolo === 'Felpa' ? 30 : 5;
    db.run('INSERT INTO merch_items (ordine_id, articolo, taglia, quantita, prezzo_unitario) VALUES (?,?,?,?,?)',
      [ordineId, item.articolo, item.taglia || null, item.quantita, prezzo]);
    totale += prezzo * item.quantita;
  }
  save();

  res.json({ codice, totale });
});

app.get('/api/merch/ordini', (req, res) => {
  const ordini = all('SELECT * FROM merch_ordini ORDER BY created_at DESC');
  for (const o of ordini) {
    o.items = all('SELECT * FROM merch_items WHERE ordine_id=?', [o.id]);
  }
  res.json(ordini);
});

app.delete('/api/merch/ordini/:codice', (req, res) => {
  const ordine = all('SELECT id FROM merch_ordini WHERE codice=?', [req.params.codice])[0];
  if (ordine) {
    db.run('DELETE FROM merch_items WHERE ordine_id=?', [ordine.id]);
    db.run('DELETE FROM merch_ordini WHERE codice=?', [req.params.codice]);
    save();
  }
  res.json({ ok: true });
});

// --- PROVE PISTA API ---
app.get('/api/prove/slots', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prove/slots', requireAdmin, async (req, res) => {
  try {
    const { giorno, ora_inizio, ora_fine, luogo, posti_max, costo } = req.body;
    if (!giorno || !ora_inizio || !ora_fine || !luogo) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
    await dbRun('INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, luogo, posti_max, costo) VALUES (?,?,?,?,?,?)',
      [giorno, ora_inizio, ora_fine, luogo, posti_max || 10, costo || 5]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/prove/slots/:id', requireAdmin, async (req, res) => {
  try {
    const { giorno, ora_inizio, ora_fine, luogo, posti_max, costo } = req.body;
    await dbRun('UPDATE prove_slots SET giorno=?, ora_inizio=?, ora_fine=?, luogo=?, posti_max=?, costo=? WHERE id=?',
      [giorno, ora_inizio, ora_fine, luogo, posti_max, costo, +req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/prove/slots/:id', requireAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM prove_slots WHERE id=?', [+req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint per forzare reset slot (interno)
app.post('/api/prove/force-reset', async (req, res) => {
  try {
    // Prima elimina tutti gli slot esistenti
    await dbRun('DELETE FROM prove_slots');
    // Poi inserisce i nuovi
    const proveSlots = [
      ['2026-11-12', '14:00', '14:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '14:30', '15:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '15:00', '15:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '15:30', '16:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '16:00', '16:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-12', '16:30', '17:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-13', '21:00', '21:30', 'PalaCastiglioni', 5, 5],
      ['2026-11-13', '21:30', '22:00', 'PalaCastiglioni', 5, 5],
      ['2026-11-13', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-13', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-14', '21:30', '22:00', 'PalaCastiglioni', 10, 5],
      ['2026-11-14', '22:00', '22:30', 'PalaCastiglioni', 10, 5],
      ['2026-11-14', '22:30', '23:00', 'PalaCastiglioni', 10, 5],
    ];
    for (const [g, oi, of_, l, p, c] of proveSlots) {
      await dbRun('INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, luogo, posti_max, costo) VALUES (?,?,?,?,?,?)',
        [g, oi, of_, l, p, c]);
    }
    res.json({ ok: true, count: proveSlots.length });
  } catch (err) {
    console.error('Force reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prove/config', async (req, res) => {
  try {
    const slots = await dbAll('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
    const first = slots[0] || {};
    res.json({
      giorno: first.giorno || '2026-11-14',
      slots: slots.map(s => ({ ora: `${s.ora_inizio}-${s.ora_fine}`, luogo: s.luogo, posti_max: s.posti_max, costo: s.costo })),
      posti_max: first.posti_max || 20,
      costo_ora: first.costo || 10
    });
  } catch (err) {
    console.error('Errore prove config:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prove/disponibilita', async (req, res) => {
  try {
    const slots = await dbAll('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
    const result = {};
    for (const slot of slots) {
      const ora = `${slot.ora_inizio}-${slot.ora_fine}`;
      // Chiave unica: giorno + ora
      const key = `${slot.giorno}|${ora}`;
      const rows = await dbAll('SELECT COUNT(*) as tot FROM prove_prenotazioni WHERE ora=?', [ora]);
      const occupati = (rows[0] && rows[0].tot) ? rows[0].tot : 0;
      result[key] = {
        ora: ora,
        posti: slot.posti_max - occupati,
        luogo: slot.luogo,
        costo: slot.costo,
        posti_max: slot.posti_max,
        giorno: slot.giorno
      };
    }
    res.json(result);
  } catch (err) {
    console.error('Errore prove disponibilita:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prove/prenota', async (req, res) => {
  const { nome, cognome, email, telefono, sessioni, note, paymentMethod } = req.body;
  if (!nome || !cognome) return res.status(400).json({ error: 'Nome e cognome richiesti' });
  if (!sessioni || !sessioni.length) return res.status(400).json({ error: 'Seleziona almeno una sessione' });

  try {
    // Verifica disponibilità
    let totale = 0;
    // Supporta sia formato vecchio (array di stringhe) che nuovo (array di oggetti {ora, giorno})
    const sessioniNormalizzate = sessioni.map(s => {
      if (typeof s === 'string') {
        return { ora: s, giorno: null };
      }
      return s;
    });
    
    for (const sess of sessioniNormalizzate) {
      const ora = sess.ora;
      const parts = ora.split('-');
      const slots = await dbAll('SELECT * FROM prove_slots WHERE ora_inizio=? AND ora_fine=?', [parts[0], parts[1]]);
      const slot = slots[0];
      if (!slot) return res.status(400).json({ error: `Slot ${ora} non trovato` });
      
      // Conta prenotazioni per ora E giorno se disponibile
      let rows;
      if (sess.giorno) {
        rows = await dbAll('SELECT COUNT(*) as tot FROM prove_prenotazioni WHERE ora=? AND giorno=?', [ora, sess.giorno]);
      } else {
        rows = await dbAll('SELECT COUNT(*) as tot FROM prove_prenotazioni WHERE ora=?', [ora]);
      }
      const occupati = (rows[0] && rows[0].tot) ? rows[0].tot : 0;
      if (occupati >= slot.posti_max) {
        return res.status(400).json({ error: `Sessione ${ora} esaurita` });
      }
      totale += slot.costo;
    }

    const codice = 'PRV-' + Date.now().toString(36).toUpperCase();
    for (const sess of sessioniNormalizzate) {
      const giorno = sess.giorno || null;
      await dbRun('INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, giorno, codice, stato, note) VALUES (?,?,?,?,?,?,?,?,?)',
        [nome, cognome, email || null, telefono || null, sess.ora, giorno, codice, 'sospesa', note || null]);
    }

    // Invia email di prenotazione in attesa SOLO per bonifico (non per pagamento online)
    if (email && transporter && paymentMethod !== 'online') {
      const sessioniList = sessioniNormalizzate.map(s => `• ${s.giorno ? s.giorno + ' ' : ''}${s.ora}`).join('\n');
      const linkRicevuta = `https://bustobattle.onrender.com/carica-ricevuta-prove.html?codice=${codice}`;
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: email,
          subject: `Prenotazione Prove Pista in Attesa - ${codice}`,
          text: `Ciao ${nome} ${cognome},

La tua prenotazione prove pista è IN ATTESA DI CONFERMA.

📋 RIEPILOGO PRENOTAZIONE
Codice: ${codice}
Slot prenotati:
${sessioniList}
${note ? `\nNote: ${note}` : ''}

💰 TOTALE DA PAGARE: €${totale}

💳 ISTRUZIONI PAGAMENTO
IBAN: IT54Y0326822800052416865080
Banca: Banca Sella
Intestatario: Accademia Bustese Pattinaggio ASD
Causale: Prove Pista - ${codice} - ${cognome}
Importo: €${totale}

📤 DOPO IL PAGAMENTO
Carica la ricevuta del bonifico qui:
${linkRicevuta}

⚠️ La prenotazione sarà confermata dopo la verifica del pagamento.

📍 Luogo: PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)

Per informazioni: bustobattle@gmail.com

Ci vediamo in pista!
Il Team Busto Battle XI`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#f59e0b">⏳ Prenotazione Prove Pista in Attesa</h2>
              <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
              <p>La tua prenotazione prove pista è <strong style="color:#f59e0b">IN ATTESA DI CONFERMA</strong>.</p>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Riepilogo</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot prenotati:</strong></p>
                <ul>${sessioniNormalizzate.map(s => `<li>${s.giorno ? s.giorno + ' ' : ''}${s.ora}</li>`).join('')}</ul>
                ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
                <p style="font-size:1.2em;color:#F7AF40"><strong>Totale: €${totale}</strong></p>
              </div>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">💳 Istruzioni Pagamento</h3>
                <p><strong>IBAN:</strong> IT54Y0326822800052416865080</p>
                <p><strong>Banca:</strong> Banca Sella</p>
                <p><strong>Intestatario:</strong> Accademia Bustese Pattinaggio ASD</p>
                <p><strong>Causale:</strong> Prove Pista - ${codice} - ${cognome}</p>
                <p><strong>Importo:</strong> €${totale}</p>
              </div>
              
              <div style="background:#1a4a1a;padding:15px;border-radius:8px;margin:20px 0;border:2px solid #22c55e">
                <h3 style="color:#22c55e;margin-top:0">📤 Dopo il pagamento</h3>
                <p>Carica la ricevuta del bonifico per confermare la prenotazione:</p>
                <p style="text-align:center;margin-top:15px">
                  <a href="${linkRicevuta}" style="background:#F7AF40;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">📤 Carica Ricevuta</a>
                </p>
              </div>
              
              <p style="color:#f59e0b">⚠️ La prenotazione sarà confermata dopo la verifica del pagamento.</p>
              <p>📍 <strong>Luogo:</strong> PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)</p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore invio email prove:', emailErr);
      }
    }

    res.json({ codice, totale, sessioni: sessioniNormalizzate });
  } catch (err) {
    console.error('Errore prenotazione prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// Notifica admin per prenotazioni prove pista (chiamato dopo tutte le prenotazioni)
app.post('/api/prove/notifica-admin', async (req, res) => {
  try {
    const { atleti, email, telefono, paymentMethod, totaleComplessivo } = req.body;
    
    if (!atleti || !atleti.length) {
      return res.status(400).json({ error: 'Nessun atleta da notificare' });
    }
    
    if (transporter) {
      // Costruisci riepilogo atleti
      const atletiText = atleti.map(a => 
        `👤 ${a.nome} ${a.cognome} (${a.codice})\n   Slot: ${a.sessioni.join(', ')}\n   Specialità: ${a.note || 'Non specificata'}\n   Totale: €${a.totale}`
      ).join('\n\n');
      
      const atletiHtml = atleti.map(a => `
        <div style="background:#333;padding:10px;border-radius:6px;margin-bottom:10px">
          <p style="margin:0"><strong>👤 ${a.nome} ${a.cognome}</strong> · <span style="color:#F7AF40">${a.codice}</span></p>
          <p style="margin:5px 0 0;font-size:0.9em">Slot: ${a.sessioni.join(', ')}</p>
          <p style="margin:5px 0 0;font-size:0.9em">Specialità: ${a.note || 'Non specificata'}</p>
          <p style="margin:5px 0 0;color:#22c55e">€${a.totale}</p>
        </div>
      `).join('');
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: 'bustobattle@gmail.com',
          subject: `🆕 Nuova Prenotazione Prove Pista - ${atleti.length} atleta/i - €${totaleComplessivo}`,
          text: `Nuova prenotazione prove pista ricevuta!

📧 CONTATTO
Email: ${email || 'Non fornita'}
Telefono: ${telefono || 'Non fornito'}

👥 ATLETI (${atleti.length})
${atletiText}

💰 TOTALE COMPLESSIVO: €${totaleComplessivo}
💳 Metodo: ${paymentMethod === 'online' ? 'Pagamento online' : 'Bonifico'}

🔗 Gestisci da admin: https://bustobattle.onrender.com/admin.html`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">🆕 Nuova Prenotazione Prove Pista</h1>
              <p style="color:#000;margin:5px 0 0">${atleti.length} atleta/i · €${totaleComplessivo}</p>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <div style="background:#222;padding:15px;border-radius:8px;margin-bottom:15px">
                <h3 style="color:#F7AF40;margin-top:0">📧 Contatto</h3>
                <p><strong>Email:</strong> ${email || 'Non fornita'}</p>
                <p><strong>Telefono:</strong> ${telefono || 'Non fornito'}</p>
              </div>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin-bottom:15px">
                <h3 style="color:#F7AF40;margin-top:0">👥 Atleti (${atleti.length})</h3>
                ${atletiHtml}
              </div>
              
              <div style="background:#222;padding:15px;border-radius:8px">
                <p style="font-size:1.2em;margin:0"><strong>💰 Totale complessivo:</strong> <span style="color:#22c55e">€${totaleComplessivo}</span></p>
                <p style="margin:10px 0 0"><strong>💳 Metodo:</strong> ${paymentMethod === 'online' ? 'Pagamento online' : 'Bonifico'}</p>
              </div>
              
              <p style="text-align:center;margin-top:20px">
                <a href="https://bustobattle.onrender.com/admin.html" style="background:#F7AF40;color:#000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Gestisci da Admin</a>
              </p>
            </div>
          </div>`
        });
        console.log('Email notifica admin prove batch inviata:', atleti.length, 'atleti');
      } catch (emailErr) {
        console.error('Errore invio email notifica admin prove:', emailErr);
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore notifica admin prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- STRIPE CHECKOUT per PROVE PISTA ---
app.post('/api/prove/stripe-checkout', async (req, res) => {
  try {
    const { codice, totale, email, nome, cognome, from_page } = req.body;
    
    console.log('Stripe prove checkout request:', { codice, totale, email });
    
    if (!codice || !totale || totale <= 0) {
      return res.status(400).json({ error: 'Dati mancanti', details: { codice, totale } });
    }

    // Verifica che la prenotazione esista
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Prenotazione non trovata' });
    }

    const returnPage = from_page || 'prove.html';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Crea sessione Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Prove Pista Busto Battle XI - ${codice}`,
            description: `${nome} ${cognome} - ${rows.length} slot`,
          },
          unit_amount: Math.round(totale * 100), // Stripe usa centesimi
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/${returnPage}?payment=success&codice=${codice}`,
      cancel_url: `${baseUrl}/${returnPage}?payment=cancel&codice=${codice}`,
      metadata: {
        tipo: 'prove',
        codice: codice
      },
      customer_email: email || undefined,
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error('Stripe prove error:', err);
    res.status(500).json({ error: 'Errore creazione pagamento: ' + err.message });
  }
});

// Conferma pagamento prove (chiamato dopo ritorno da Stripe)
app.post('/api/prove/conferma-pagamento', async (req, res) => {
  try {
    const { codice } = req.body;
    if (!codice) return res.status(400).json({ error: 'Codice mancante' });
    
    // Aggiorna stato a confermata
    await dbRun('UPDATE prove_prenotazioni SET stato=? WHERE codice=?', ['confermata', codice]);
    console.log('Pagamento Stripe prove confermato:', codice);
    
    // Recupera dati per email
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (rows.length > 0 && rows[0].email && transporter) {
      const prenotazione = rows[0];
      const sessioni = rows.map(r => r.ora);
      const totale = rows.length * 5; // €5 per slot
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: prenotazione.email,
          subject: `Prova Pista Confermata - ${codice}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#4CAF50">✅ Prova Pista Confermata!</h2>
              <p>Ciao <strong>${prenotazione.nome} ${prenotazione.cognome}</strong>,</p>
              <p>Il pagamento è stato ricevuto. La tua prenotazione prove pista è <strong style="color:#4CAF50">CONFERMATA</strong>.</p>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Riepilogo</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot prenotati:</strong></p>
                <ul>${sessioni.map(s => `<li>${s}</li>`).join('')}</ul>
                <p style="font-size:1.2em;color:#4CAF50"><strong>Pagato: €${totale}</strong></p>
              </div>
              
              <p>📍 <strong>Luogo:</strong> PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)</p>
              <p>Ci vediamo in pista!</p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore email conferma prove:', emailErr);
      }
    }
    
    res.json({ ok: true });
  } catch (err) {
    console.error('Errore conferma pagamento prove:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prove/prenotazioni', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM prove_prenotazioni ORDER BY ora, cognome, nome');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/prove/prenotazioni/:codice', async (req, res) => {
  try {
    await dbRun('DELETE FROM prove_prenotazioni WHERE codice=?', [req.params.codice]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conferma prova pista (admin)
app.post('/api/prove/prenotazioni/:codice/conferma', async (req, res) => {
  try {
    const { codice } = req.params;
    
    // Prendi le info della prenotazione
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) return res.status(404).json({ error: 'Prenotazione non trovata' });
    
    const first = rows[0];
    
    // Aggiorna stato a confermata
    await dbRun('UPDATE prove_prenotazioni SET stato=? WHERE codice=?', ['confermata', codice]);
    
    // Invia email di conferma
    if (first.email && transporter) {
      const sessioni = rows.map(r => r.ora);
      const totale = sessioni.length * 5; // €5 per slot
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: first.email,
          subject: `✅ Prova Pista Prenotata - ${codice}`,
          text: `Ciao ${first.nome} ${first.cognome},

La tua prenotazione prove pista è stata CONFERMATA!

📋 RIEPILOGO
Codice: ${codice}
Slot prenotati:
${sessioni.map(s => `• ${s}`).join('\n')}
${first.note ? `\nNote: ${first.note}` : ''}

💰 Totale pagato: €${totale}

📍 Luogo: PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)

Per informazioni: bustobattle@gmail.com

Ci vediamo in pista!
Il Team Busto Battle XI`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#22c55e">✅ Prova Pista Prenotata!</h2>
              <p>Ciao <strong>${first.nome} ${first.cognome}</strong>,</p>
              <p>La tua prenotazione prove pista è stata <strong style="color:#22c55e">CONFERMATA</strong>!</p>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Riepilogo</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot prenotati:</strong></p>
                <ul>${sessioni.map(s => `<li>${s}</li>`).join('')}</ul>
                ${first.note ? `<p><strong>Note:</strong> ${first.note}</p>` : ''}
                <p style="font-size:1.2em;color:#22c55e"><strong>Totale pagato: €${totale}</strong></p>
              </div>
              
              <p>📍 <strong>Luogo:</strong> PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)</p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore invio email conferma prove:', emailErr);
      }
    }
    
    res.json({ ok: true, message: 'Prenotazione confermata' });
  } catch (err) {
    console.error('Errore conferma prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// Annulla prova pista (admin) - libera gli slot
app.put('/api/prove/prenotazioni/:codice/annulla', async (req, res) => {
  try {
    const { codice } = req.params;
    
    // Prendi le info prima di cancellare
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) return res.status(404).json({ error: 'Prenotazione non trovata' });
    
    const first = rows[0];
    
    // Elimina la prenotazione (libera gli slot)
    await dbRun('DELETE FROM prove_prenotazioni WHERE codice=?', [codice]);
    
    // Invia email di annullamento
    if (first.email && transporter) {
      const sessioni = rows.map(r => r.ora);
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: first.email,
          subject: `❌ Prenotazione Prova Pista Annullata - ${codice}`,
          text: `Ciao ${first.nome} ${first.cognome},

La tua prenotazione prove pista è stata ANNULLATA.

📋 Dettagli prenotazione annullata:
Codice: ${codice}
Slot: ${sessioni.join(', ')}

Se ritieni sia un errore o hai domande, contattaci a bustobattle@gmail.com

Il Team Busto Battle XI`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#ef4444">❌ Prenotazione Annullata</h2>
              <p>Ciao <strong>${first.nome} ${first.cognome}</strong>,</p>
              <p>La tua prenotazione prove pista è stata <strong style="color:#ef4444">ANNULLATA</strong>.</p>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Dettagli</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot:</strong> ${sessioni.join(', ')}</p>
              </div>
              
              <p>Se ritieni sia un errore o hai domande, contattaci a <a href="mailto:bustobattle@gmail.com" style="color:#F7AF40">bustobattle@gmail.com</a></p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore invio email annullamento prove:', emailErr);
      }
    }
    
    res.json({ ok: true, message: 'Prenotazione annullata e slot liberati' });
  } catch (err) {
    console.error('Errore annullamento prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload ricevuta bonifico prove pista
app.post('/api/prove/prenotazioni/:codice/ricevuta', uploadRicevute.single('ricevuta'), async (req, res) => {
  try {
    const { codice } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
    
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) return res.status(404).json({ error: 'Prenotazione non trovata' });
    
    // Salva il file path e aggiorna stato a verifica
    const filePath = req.file.filename;
    await dbRun('UPDATE prove_prenotazioni SET ricevuta_bonifico=?, stato=? WHERE codice=?', [filePath, 'verifica', codice]);
    
    res.json({ ok: true, message: 'Ricevuta caricata, in attesa di verifica' });
  } catch (err) {
    console.error('Errore upload ricevuta prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// Visualizza ricevuta prove pista
app.get('/api/prove/prenotazioni/:codice/ricevuta', async (req, res) => {
  try {
    const { codice } = req.params;
    const rows = await dbAll('SELECT ricevuta_bonifico FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length || !rows[0].ricevuta_bonifico) {
      return res.status(404).json({ error: 'Ricevuta non trovata' });
    }
    
    const filePath = path.join(__dirname, 'uploads', rows[0].ricevuta_bonifico);
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conferma bonifico prove pista (admin)
app.post('/api/prove/prenotazioni/:codice/conferma-bonifico', requireAdmin, async (req, res) => {
  try {
    const { codice } = req.params;
    
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) return res.status(404).json({ error: 'Prenotazione non trovata' });
    
    const first = rows[0];
    
    // Aggiorna stato a confermata
    await dbRun('UPDATE prove_prenotazioni SET stato=? WHERE codice=?', ['confermata', codice]);
    
    // Invia email di conferma
    if (first.email && transporter) {
      const sessioni = rows.map(r => r.ora);
      const totale = sessioni.length * 5;
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: first.email,
          subject: `✅ Pagamento Confermato - Prova Pista ${codice}`,
          text: `Ciao ${first.nome} ${first.cognome},

Il tuo pagamento per la prenotazione prove pista è stato CONFERMATO!

📋 Dettagli prenotazione:
Codice: ${codice}
Slot prenotati: ${sessioni.join(', ')}
Totale pagato: €${totale}

📍 Luogo: PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)

A presto!
Il Team Busto Battle XI`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#22c55e">✅ Pagamento Confermato!</h2>
              <p>Ciao <strong>${first.nome} ${first.cognome}</strong>,</p>
              <p>Il tuo pagamento per la prenotazione prove pista è stato <strong style="color:#22c55e">CONFERMATO</strong>!</p>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Riepilogo</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot prenotati:</strong></p>
                <ul>${sessioni.map(s => `<li>${s}</li>`).join('')}</ul>
                <p style="font-size:1.2em;color:#22c55e"><strong>Totale pagato: €${totale}</strong></p>
              </div>
              
              <p>📍 <strong>Luogo:</strong> PalaCastiglioni - Via Ariosto 3, Busto Arsizio (VA)</p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore invio email conferma bonifico prove:', emailErr);
      }
    }
    
    res.json({ ok: true, message: 'Bonifico confermato' });
  } catch (err) {
    console.error('Errore conferma bonifico prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rigetta ricevuta prove pista (admin)
app.post('/api/prove/prenotazioni/:codice/rigetta', requireAdmin, async (req, res) => {
  try {
    const { codice } = req.params;
    const { motivo } = req.body;
    
    const rows = await dbAll('SELECT * FROM prove_prenotazioni WHERE codice=?', [codice]);
    if (!rows.length) return res.status(404).json({ error: 'Prenotazione non trovata' });
    
    const first = rows[0];
    
    // Torna a stato sospesa e rimuovi ricevuta
    await dbRun('UPDATE prove_prenotazioni SET stato=?, ricevuta_bonifico=NULL WHERE codice=?', ['sospesa', codice]);
    
    // Invia email di rigetto
    if (first.email && transporter) {
      const sessioni = rows.map(r => r.ora);
      const totale = sessioni.length * 5;
      
      try {
        await transporter.sendMail({
          from: '"Busto Battle XI" <bustobattle@gmail.com>',
          to: first.email,
          subject: `❌ Ricevuta Rifiutata - Prova Pista ${codice}`,
          text: `Ciao ${first.nome} ${first.cognome},

La ricevuta caricata per la prenotazione prove pista NON è stata accettata.

📋 Motivo del rifiuto:
${motivo || 'Non specificato'}

📋 Dettagli prenotazione:
Codice: ${codice}
Slot prenotati: ${sessioni.join(', ')}
Totale da pagare: €${totale}

Per favore carica una nuova ricevuta corretta.

💳 Coordinate bancarie:
IBAN: IT54Y0326822800052416865080
Banca: Banca Sella
Intestatario: Accademia Bustese Pattinaggio ASD
Causale: Prove pista ${codice}

Il Team Busto Battle XI`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#F7AF40;padding:20px;text-align:center">
              <h1 style="color:#000;margin:0">Busto Battle XI</h1>
            </div>
            <div style="padding:20px;background:#1a1a1a;color:#fff">
              <h2 style="color:#ef4444">❌ Ricevuta Rifiutata</h2>
              <p>Ciao <strong>${first.nome} ${first.cognome}</strong>,</p>
              <p>La ricevuta caricata per la prenotazione prove pista <strong style="color:#ef4444">NON è stata accettata</strong>.</p>
              
              <div style="background:#331111;padding:15px;border-radius:8px;margin:20px 0;border:1px solid #ef4444">
                <h3 style="color:#ef4444;margin-top:0">📋 Motivo del rifiuto:</h3>
                <p>${motivo || 'Non specificato'}</p>
              </div>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">📋 Dettagli prenotazione</h3>
                <p><strong>Codice:</strong> ${codice}</p>
                <p><strong>Slot:</strong> ${sessioni.join(', ')}</p>
                <p><strong>Totale da pagare:</strong> €${totale}</p>
              </div>
              
              <div style="background:#222;padding:15px;border-radius:8px;margin:20px 0">
                <h3 style="color:#F7AF40;margin-top:0">💳 Coordinate bancarie</h3>
                <p><strong>IBAN:</strong> IT54Y0326822800052416865080</p>
                <p><strong>Banca:</strong> Banca Sella</p>
                <p><strong>Intestatario:</strong> Accademia Bustese Pattinaggio ASD</p>
                <p><strong>Causale:</strong> Prove pista ${codice}</p>
              </div>
              
              <p>Per favore carica una nuova ricevuta corretta dalla pagina di verifica.</p>
            </div>
            <div style="background:#111;padding:15px;text-align:center;color:#888">
              <p>Busto Battle XI - bustobattle@gmail.com</p>
            </div>
          </div>`
        });
      } catch (emailErr) {
        console.error('Errore invio email rigetto prove:', emailErr);
      }
    }
    
    res.json({ ok: true, message: 'Ricevuta rigettata, email inviata' });
  } catch (err) {
    console.error('Errore rigetto prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- EXPORT EXCEL PROVE PISTA ---
app.get('/api/prove/export', requireAdmin, async (req, res) => {
  try {
    const prenotazioni = await dbAll('SELECT * FROM prove_prenotazioni ORDER BY codice, ora');
    const slots = await dbAll('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
    
    // Mappa slot per lookup giorno
    const slotMap = {};
    for (const s of slots) {
      const ora = `${s.ora_inizio}-${s.ora_fine}`;
      slotMap[ora] = s;
    }
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Busto Battle XI';
    workbook.created = new Date();
    
    // ========== FOGLIO 1: TUTTE LE PRENOTAZIONI ==========
    const sheetAll = workbook.addWorksheet('Tutte le Prenotazioni');
    sheetAll.columns = [
      { header: 'Codice', key: 'codice', width: 20 },
      { header: 'Cognome', key: 'cognome', width: 15 },
      { header: 'Nome', key: 'nome', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Giorno', key: 'giorno', width: 12 },
      { header: 'Orario', key: 'ora', width: 12 },
      { header: 'Specialità', key: 'specialita', width: 20 },
      { header: 'Stato', key: 'stato', width: 12 },
      { header: 'Note', key: 'note', width: 30 },
      { header: 'Data Prenotazione', key: 'created_at', width: 18 }
    ];
    
    sheetAll.getRow(1).font = { bold: true };
    sheetAll.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7AF40' } };
    
    for (const p of prenotazioni) {
      const slot = slotMap[p.ora];
      // Estrai specialità dalle note
      let specialita = '';
      if (p.note && p.ora) {
        // Escape caratteri speciali per la regex
        const oraEscaped = p.ora.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = p.note.match(new RegExp(oraEscaped + ':\\s*([^,]+)'));
        if (match) specialita = match[1].trim();
      }
      
      // Usa giorno dalla prenotazione se disponibile, altrimenti dallo slot
      const giorno = p.giorno || ((slot && slot.giorno) ? slot.giorno : '');
      
      sheetAll.addRow({
        codice: p.codice,
        cognome: p.cognome,
        nome: p.nome,
        email: p.email || '',
        telefono: p.telefono || '',
        giorno: giorno,
        ora: p.ora,
        specialita: specialita,
        stato: p.stato || 'sospesa',
        note: p.note || '',
        created_at: p.created_at ? new Date(p.created_at).toLocaleDateString('it-IT') : ''
      });
    }
    
    // ========== FOGLIO 2: RIEPILOGO PER PERSONA ==========
    const sheetRiepilogo = workbook.addWorksheet('Riepilogo per Persona');
    sheetRiepilogo.columns = [
      { header: 'Codice', key: 'codice', width: 20 },
      { header: 'Cognome', key: 'cognome', width: 15 },
      { header: 'Nome', key: 'nome', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'N° Sessioni', key: 'num_sessioni', width: 12 },
      { header: 'Sessioni', key: 'sessioni', width: 50 },
      { header: 'Totale €', key: 'totale', width: 10 },
      { header: 'Stato', key: 'stato', width: 12 }
    ];
    
    sheetRiepilogo.getRow(1).font = { bold: true };
    sheetRiepilogo.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7AF40' } };
    
    // Raggruppa per codice
    const grouped = {};
    for (const p of prenotazioni) {
      if (!grouped[p.codice]) grouped[p.codice] = [];
      grouped[p.codice].push(p);
    }
    
    for (const [codice, sessioni] of Object.entries(grouped)) {
      const first = sessioni[0];
      const sessioniList = sessioni.map(s => {
        const slot = slotMap[s.ora];
        // Usa giorno dalla prenotazione se disponibile
        let giornoStr = '';
        if (s.giorno) {
          giornoStr = s.giorno.split('-').slice(1).reverse().join('/');
        } else if (slot && slot.giorno) {
          giornoStr = slot.giorno.split('-').slice(1).reverse().join('/');
        }
        let spec = '';
        if (s.note && s.ora) {
          const oraEscaped = s.ora.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const match = s.note.match(new RegExp(oraEscaped + ':\\s*([^,]+)'));
          if (match) spec = ` (${match[1].trim()})`;
        }
        return `${giornoStr} ${s.ora}${spec}`;
      }).join(', ');
      
      sheetRiepilogo.addRow({
        codice: codice,
        cognome: first.cognome,
        nome: first.nome,
        email: first.email || '',
        telefono: first.telefono || '',
        num_sessioni: sessioni.length,
        sessioni: sessioniList,
        totale: sessioni.length * 5,
        stato: first.stato || 'sospesa'
      });
    }
    
    // ========== FOGLIO 3: PER GIORNO/ORA ==========
    const sheetPerSlot = workbook.addWorksheet('Per Giorno e Orario');
    sheetPerSlot.columns = [
      { header: 'Giorno', key: 'giorno', width: 12 },
      { header: 'Orario', key: 'ora', width: 12 },
      { header: 'Luogo', key: 'luogo', width: 20 },
      { header: 'N° Iscritti', key: 'num', width: 12 },
      { header: 'Posti Max', key: 'posti_max', width: 12 },
      { header: 'Partecipanti', key: 'partecipanti', width: 60 }
    ];
    
    sheetPerSlot.getRow(1).font = { bold: true };
    sheetPerSlot.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7AF40' } };
    
    for (const slot of slots) {
      const ora = `${slot.ora_inizio}-${slot.ora_fine}`;
      const iscritti = prenotazioni.filter(p => p.ora === ora);
      const partecipanti = iscritti.map(p => {
        let spec = '';
        if (p.note && ora) {
          const oraEscaped = ora.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const match = p.note.match(new RegExp(oraEscaped + ':\\s*([^,]+)'));
          if (match) spec = ` (${match[1].trim()})`;
        }
        return `${p.cognome} ${p.nome}${spec}`;
      }).join(', ');
      
      sheetPerSlot.addRow({
        giorno: slot.giorno,
        ora: ora,
        luogo: slot.luogo,
        num: iscritti.length,
        posti_max: slot.posti_max,
        partecipanti: partecipanti
      });
    }
    
    // Genera file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=prove_pista_export.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('Errore export prove:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- CENA ATLETI API ---
app.post('/api/cena/prenota', (req, res) => {
  const { nome, cognome, email, telefono, giorni, num_persone, note } = req.body;
  if (!nome || !cognome) return res.status(400).json({ error: 'Nome e cognome richiesti' });
  if (!giorni || !giorni.length) return res.status(400).json({ error: 'Seleziona almeno una serata' });
  if (num_persone < 1 || num_persone > 10) return res.status(400).json({ error: 'Numero persone non valido (1-10)' });

  const codice = 'CEN-' + Date.now().toString(36).toUpperCase();
  for (const giorno of giorni) {
    db.run('INSERT INTO cena_prenotazioni (nome, cognome, email, telefono, giorno, num_persone, note, codice) VALUES (?,?,?,?,?,?,?,?)',
      [nome, cognome, email || null, telefono || null, giorno, num_persone, note || null, codice]);
  }
  save();

  const totale = giorni.length * num_persone * 20;
  const nomiGiorni = giorni.map(g => {
    if (g === '2025-11-13') return 'Gio 13/11';
    if (g === '2025-11-14') return 'Ven 14/11';
    return g;
  });
  const riepilogo = `${num_persone} persone × ${nomiGiorni.join(' + ')}`;
  res.json({ codice, totale, riepilogo });
});

app.get('/api/cena/prenotazioni', (req, res) => {
  res.json(all('SELECT * FROM cena_prenotazioni ORDER BY giorno, cognome, nome'));
});

app.delete('/api/cena/prenotazioni/:codice', (req, res) => {
  db.run('DELETE FROM cena_prenotazioni WHERE codice=?', [req.params.codice]);
  save();
  res.json({ ok: true });
});

// --- PUSH SUBSCRIPTION API ---
app.get('/api/push/vapidPublicKey', (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: 'Subscription invalida' });
    
    if (usePostgres) {
      await pgPool.query(
        'INSERT INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES ($1, $2, $3) ON CONFLICT (endpoint) DO UPDATE SET keys_p256dh = $2, keys_auth = $3',
        [endpoint, keys.p256dh, keys.auth]
      );
    } else {
      db.run('INSERT OR REPLACE INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES (?, ?, ?)',
        [endpoint, keys.p256dh, keys.auth]);
      save();
    }
    console.log('Push subscription salvata:', endpoint.substring(0, 50) + '...');
    res.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Errore salvataggio subscription' });
  }
});

// --- NOTIFICA MANUALE ---
app.post('/api/push/send', requireAdmin, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Titolo e messaggio richiesti' });
    
    let subs;
    try {
      subs = await dbAll('SELECT * FROM push_subscriptions');
    } catch (dbErr) {
      console.error('DB error fetching subscriptions:', dbErr);
      return res.json({ ok: true, sent: 0 });
    }
    
    if (!subs || subs.length === 0) {
      return res.json({ ok: true, sent: 0 });
    }
    
    console.log(`Invio notifica a ${subs.length} utenti: "${title}"`);
    const payload = JSON.stringify({ title, body, url: '/risultati.html' });
    let sent = 0;
    for (const sub of subs) {
      try {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth }
        };
        webpush.sendNotification(pushSub, payload).catch(async err => {
          console.error('Push error for endpoint:', sub.endpoint.substring(0, 50), err.statusCode || err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription scaduta, rimuovi
            await dbRun('DELETE FROM push_subscriptions WHERE endpoint=?', [sub.endpoint]);
          }
        });
        sent++;
      } catch (pushErr) {
        console.error('Push preparation error:', pushErr);
      }
    }
    res.json({ ok: true, sent });
  } catch (err) {
    console.error('Push send error:', err);
    res.status(500).json({ error: 'Errore invio notifiche: ' + err.message });
  }
});

// --- EMAIL ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// --- EMAIL BROADCAST ---
app.post('/api/email/broadcast', requireAdmin, async (req, res) => {
  try {
    const { oggetto, messaggio, soloConfermati } = req.body;
    if (!oggetto || !messaggio) {
      return res.status(400).json({ error: 'Oggetto e messaggio richiesti' });
    }
    
    // Recupera iscritti con email
    let iscritti;
    if (soloConfermati) {
      iscritti = await dbAll("SELECT * FROM iscritti WHERE email IS NOT NULL AND email != '' AND (stato = 'confermata' OR pagamento = 1)");
    } else {
      iscritti = await dbAll("SELECT * FROM iscritti WHERE email IS NOT NULL AND email != ''");
    }
    
    if (!iscritti || iscritti.length === 0) {
      return res.json({ ok: true, sent: 0, errors: 0 });
    }
    
    console.log(`Invio email broadcast a ${iscritti.length} iscritti: "${oggetto}"`);
    
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return res.status(500).json({ error: 'BREVO_API_KEY non configurata' });
    }
    
    let sent = 0;
    let errors = 0;
    
    for (const iscritto of iscritti) {
      try {
        // Personalizza il messaggio
        const messaggioPersonalizzato = messaggio
          .replace(/\{nome\}/g, iscritto.nome)
          .replace(/\{cognome\}/g, iscritto.cognome);
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Busto Battle XI', email: process.env.BREVO_FROM || 'noreply@bustobattle.it' },
            to: [{ email: iscritto.email, name: `${iscritto.nome} ${iscritto.cognome}` }],
            bcc: [{ email: 'bustobattle@gmail.com' }],
            subject: oggetto,
            htmlContent: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#f0f0f0;border-radius:8px;overflow:hidden">
                <div style="background:#1a1a1a;padding:20px;text-align:center;border-bottom:3px solid #F7AF40">
                  <h1 style="color:#F7AF40;margin:0;font-size:24px">🏆 Busto Battle XI</h1>
                  <p style="color:#888;margin:5px 0 0 0;font-size:14px">13-14-15 Novembre 2026 | Busto Arsizio</p>
                </div>
                <div style="padding:25px">
                  <p style="margin:0 0 15px 0">Ciao <strong style="color:#F7AF40">${iscritto.nome}</strong>,</p>
                  <div style="background:#1a1a1a;padding:20px;border-radius:6px;border-left:4px solid #F7AF40;white-space:pre-wrap;line-height:1.6">${messaggioPersonalizzato}</div>
                </div>
                <div style="background:#0a0a0a;padding:20px;text-align:center;border-top:1px solid #222">
                  <p style="margin:0;color:#888;font-size:12px">
                    📧 bustobattle@gmail.com | 📸 @bustobattle
                  </p>
                  <p style="margin:10px 0 0 0;color:#666;font-size:11px">
                    Ricevi questa email perché sei iscritto a Busto Battle XI
                  </p>
                </div>
              </div>
            `
          })
        });
        
        if (response.ok) {
          sent++;
        } else {
          const errorData = await response.json();
          console.error(`Errore invio email a ${iscritto.email}:`, errorData);
          errors++;
        }
        
        // Piccola pausa per evitare rate limiting
        await new Promise(r => setTimeout(r, 100));
        
      } catch (err) {
        console.error(`Errore invio email a ${iscritto.email}:`, err.message);
        errors++;
      }
    }
    
    console.log(`Email broadcast completato: ${sent} inviate, ${errors} errori`);
    res.json({ ok: true, sent, errors });
    
  } catch (err) {
    console.error('Email broadcast error:', err);
    res.status(500).json({ error: 'Errore invio email: ' + err.message });
  }
});

async function sendConfirmationEmail(to, { nome, cognome, codice, categoria, totale }) {
  await transporter.sendMail({
    from: '"Busto Battle XI" <noreply@bustobattle.it>',
    to,
    subject: `Conferma iscrizione - ${codice}`,
    html: `
      <h2>🏆 Busto Battle XI - Conferma Iscrizione</h2>
      <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
      <p>La tua iscrizione è stata registrata con successo!</p>
      <ul>
        <li><strong>Codice:</strong> ${codice}</li>
        <li><strong>Discipline:</strong> ${categoria || 'N/D'}</li>
        <li><strong>Totale:</strong> €${totale}</li>
      </ul>
      <p><strong>Pagamento via bonifico:</strong></p>
      <ul>
        <li><strong>IBAN:</strong> xxsdsdsd</li>
        <li><strong>Causale:</strong> ${codice} - ${nome} - ${cognome}</li>
      </ul>
      <p>📅 13-14-15 Novembre 2025 | 📍 Busto Arsizio (VA)</p>
      <p>A presto!<br>Lo staff Busto Battle</p>
    `
  });
}

async function sendContactEmail({ nome, email, oggetto, messaggio }) {
  // Usa Brevo API per inviare email
  const brevoApiKey = process.env.BREVO_API_KEY;
  
  if (!brevoApiKey) {
    console.log('Email contatto non inviata (BREVO_API_KEY non configurata):', { nome, email, oggetto });
    return;
  }
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Busto Battle XI', email: process.env.BREVO_FROM || 'noreply@bustobattle.it' },
        to: [{ email: 'bustobattle@gmail.com' }],
        replyTo: { email: email, name: nome },
        subject: `[Contatto BB XI] ${oggetto}`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#f0f0f0;border-radius:8px;overflow:hidden">
            <div style="background:#1a1a1a;padding:20px;text-align:center">
              <h1 style="color:#F7AF40;margin:0">📬 Nuovo Messaggio</h1>
            </div>
            <div style="padding:20px">
              <p><strong style="color:#F7AF40">Da:</strong> ${nome}</p>
              <p><strong style="color:#F7AF40">Email:</strong> <a href="mailto:${email}" style="color:#F7AF40">${email}</a></p>
              <p><strong style="color:#F7AF40">Oggetto:</strong> ${oggetto}</p>
              <div style="background:#222;padding:15px;border-radius:6px;margin-top:15px">
                <p style="margin:0;white-space:pre-wrap">${messaggio}</p>
              </div>
            </div>
          </div>
        `
      })
    });
    
    if (response.ok) {
      console.log('Email contatto inviata via Brevo API:', { nome, email, oggetto });
    } else {
      const errorData = await response.json();
      console.error('Errore Brevo API (contatto):', errorData);
    }
  } catch (err) {
    console.error('Errore invio email contatto:', err);
  }
}

initDb().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Server avviato su porta ' + PORT));
});
