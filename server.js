const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const webpush = require('web-push');
const bcrypt = require('bcryptjs');
const session = require('express-session');

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
webpush.setVapidDetails('mailto:info@bustobattle.it', VAPID_PUBLIC, VAPID_PRIVATE);

const DB_DIR = process.env.RENDER ? '/tmp' : path.join(__dirname, 'db');
const DB_PATH = path.join(DB_DIR, 'gara.db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
let db;

async function initDb() {
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
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
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
    created_at TEXT DEFAULT (datetime('now'))
  )`);
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
          [g, o, 'Stazione FS Busto Arsizio', 'E Work Arena / PalaCastiglioni', 8, 2]);
      }
    }
  }
  // Seed prove slots default
  const proveCount = all('SELECT COUNT(*) as c FROM prove_slots')[0].c;
  if (proveCount === 0) {
    const proveSlots = [
      ['2026-11-14', '08:00', '09:00', 'PalaCastiglioni', 20, 10],
      ['2026-11-14', '09:00', '10:00', 'PalaCastiglioni', 20, 10],
      ['2026-11-14', '10:00', '11:00', 'PalaCastiglioni', 20, 10],
      ['2026-11-14', '11:00', '12:00', 'PalaCastiglioni', 20, 10],
      ['2026-11-14', '12:00', '13:00', 'PalaCastiglioni', 20, 10],
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
    const demo = [
      ['Marco', 'Rossi', '1995-03-12', 'Classic Slalom, Battle', 'ASD Pattinatori Milano', 'marco.rossi@email.com', '3331234567'],
      ['Laura', 'Bianchi', '1998-07-22', 'Speed, Slide', 'Skating Club Torino', 'laura.bianchi@email.com', '3339876543'],
      ['Pierre', 'Dupont', '1992-11-05', 'Classic Slalom, Pairs, Battle', 'Lyon Freestyle', 'pierre.dupont@email.com', '0033612345'],
      ['Sofia', 'Garcia', '2001-01-18', 'Battle, Speed', 'Madrid Skating', 'sofia.garcia@email.com', '0034678901'],
      ['James', 'Smith', '1999-09-30', 'Classic Slalom, Speed, Slide', 'London Rollers', 'james.smith@email.com', '0044712345'],
    ];
    for (const [nome, cognome, nascita, cat, soc, email, tel] of demo) {
      db.run('INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono) VALUES (?,?,?,?,?,?,?)',
        [nome, cognome, nascita, cat, soc, email, tel]);
    }
  }
  save();
}

function save() {
  const data = Buffer.from(db.export());
  fs.writeFileSync(DB_PATH, data);
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

app.get('/api/iscritti', (req, res) => {
  res.json(all('SELECT * FROM iscritti ORDER BY cognome, nome'));
});

// --- AUTH API ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = all('SELECT * FROM users WHERE username=?', [username])[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ ok: true, username: user.username, role: user.role });
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
app.get('/api/pages', (req, res) => {
  res.json(all('SELECT * FROM page_settings'));
});

app.put('/api/pages/:page', requireAdmin, (req, res) => {
  const { enabled, visible } = req.body;
  if (enabled !== undefined) {
    db.run('UPDATE page_settings SET enabled=? WHERE page=?', [enabled ? 1 : 0, req.params.page]);
  }
  if (visible !== undefined) {
    db.run('UPDATE page_settings SET visible=? WHERE page=?', [visible ? 1 : 0, req.params.page]);
  }
  save();
  res.json({ ok: true });
});

// --- SIMULAZIONE UTENTE ---
app.post('/api/admin/simulate', requireAdmin, (req, res) => {
  const { iscritto_id } = req.body;
  const iscritto = all('SELECT * FROM iscritti WHERE id=?', [+iscritto_id])[0];
  if (!iscritto) return res.status(404).json({ error: 'Iscritto non trovato' });
  req.session.simulating = iscritto;
  res.json({ ok: true, iscritto });
});

app.post('/api/admin/stop-simulate', requireAdmin, (req, res) => {
  delete req.session.simulating;
  res.json({ ok: true });
});

app.get('/api/admin/simulating', requireAdmin, (req, res) => {
  res.json({ simulating: req.session.simulating || null });
});

app.post('/api/iscritti', async (req, res) => {
  const { nome, cognome, data_nascita, categoria, societa, email, telefono, navetta, navetta_dettagli, note } = req.body;
  db.run(`INSERT INTO iscritti (nome, cognome, data_nascita, categoria, societa, email, telefono, navetta, navetta_dettagli, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, cognome, data_nascita || null, categoria || null, societa || null, email || null, telefono || null, navetta ? 1 : 0, navetta_dettagli || null, note || null]);
  save();
  const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
  const codice = 'BB11-' + String(id).padStart(4, '0');
  // Invio email di conferma
  if (email) {
    const discipline = categoria ? categoria.split(', ') : [];
    const totale = discipline.length * 40;
    sendConfirmationEmail(email, { nome, cognome, codice, categoria, totale }).catch(console.error);
  }
  res.json({ id, codice });
});

app.put('/api/iscritti/:id', (req, res) => {
  const { nome, cognome, data_nascita, categoria, societa, email, telefono, navetta, navetta_dettagli, pagamento, note } = req.body;
  db.run(`UPDATE iscritti SET nome=?, cognome=?, data_nascita=?, categoria=?, societa=?, email=?, telefono=?, navetta=?, navetta_dettagli=?, pagamento=?, note=? WHERE id=?`,
    [nome, cognome, data_nascita || null, categoria || null, societa || null, email || null, telefono || null, navetta ? 1 : 0, navetta_dettagli || null, pagamento ? 1 : 0, note || null, req.params.id]);
  save();
  res.json({ ok: true });
});

app.delete('/api/iscritti/:id', (req, res) => {
  db.run('DELETE FROM iscritti WHERE id=?', [+req.params.id]);
  save();
  res.json({ ok: true });
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
      const occupati = rows[0]?.tot || 0;
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
    const occupati = rows[0]?.tot || 0;
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
    totale += c.num_persone * (slot?.costo || 2);
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
app.get('/api/prove/slots', (req, res) => {
  res.json(all('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio'));
});

app.post('/api/prove/slots', requireAdmin, (req, res) => {
  const { giorno, ora_inizio, ora_fine, luogo, posti_max, costo } = req.body;
  if (!giorno || !ora_inizio || !ora_fine || !luogo) return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  db.run('INSERT INTO prove_slots (giorno, ora_inizio, ora_fine, luogo, posti_max, costo) VALUES (?,?,?,?,?,?)',
    [giorno, ora_inizio, ora_fine, luogo, posti_max || 20, costo || 10]);
  save();
  res.json({ ok: true });
});

app.put('/api/prove/slots/:id', requireAdmin, (req, res) => {
  const { giorno, ora_inizio, ora_fine, luogo, posti_max, costo } = req.body;
  db.run('UPDATE prove_slots SET giorno=?, ora_inizio=?, ora_fine=?, luogo=?, posti_max=?, costo=? WHERE id=?',
    [giorno, ora_inizio, ora_fine, luogo, posti_max, costo, +req.params.id]);
  save();
  res.json({ ok: true });
});

app.delete('/api/prove/slots/:id', requireAdmin, (req, res) => {
  db.run('DELETE FROM prove_slots WHERE id=?', [+req.params.id]);
  save();
  res.json({ ok: true });
});

app.get('/api/prove/config', (req, res) => {
  const slots = all('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
  const first = slots[0] || {};
  res.json({
    giorno: first.giorno || '2026-11-14',
    slots: slots.map(s => ({ ora: `${s.ora_inizio}-${s.ora_fine}`, luogo: s.luogo, posti_max: s.posti_max, costo: s.costo })),
    posti_max: first.posti_max || 20,
    costo_ora: first.costo || 10
  });
});

app.get('/api/prove/disponibilita', (req, res) => {
  const slots = all('SELECT * FROM prove_slots ORDER BY giorno, ora_inizio');
  const result = {};
  for (const slot of slots) {
    const ora = `${slot.ora_inizio}-${slot.ora_fine}`;
    const rows = all('SELECT COUNT(*) as tot FROM prove_prenotazioni WHERE ora=?', [ora]);
    const occupati = rows[0]?.tot || 0;
    result[ora] = {
      posti: slot.posti_max - occupati,
      luogo: slot.luogo,
      costo: slot.costo,
      posti_max: slot.posti_max
    };
  }
  res.json(result);
});

app.post('/api/prove/prenota', (req, res) => {
  const { nome, cognome, email, telefono, sessioni } = req.body;
  if (!nome || !cognome) return res.status(400).json({ error: 'Nome e cognome richiesti' });
  if (!sessioni || !sessioni.length) return res.status(400).json({ error: 'Seleziona almeno una sessione' });

  // Verifica disponibilità
  let totale = 0;
  for (const ora of sessioni) {
    const parts = ora.split('-');
    const slot = all('SELECT * FROM prove_slots WHERE ora_inizio=? AND ora_fine=?', [parts[0], parts[1]])[0];
    if (!slot) return res.status(400).json({ error: `Slot ${ora} non trovato` });
    
    const rows = all('SELECT COUNT(*) as tot FROM prove_prenotazioni WHERE ora=?', [ora]);
    const occupati = rows[0]?.tot || 0;
    if (occupati >= slot.posti_max) {
      return res.status(400).json({ error: `Sessione ${ora} esaurita` });
    }
    totale += slot.costo;
  }

  const codice = 'PRV-' + Date.now().toString(36).toUpperCase();
  for (const ora of sessioni) {
    db.run('INSERT INTO prove_prenotazioni (nome, cognome, email, telefono, ora, codice) VALUES (?,?,?,?,?,?)',
      [nome, cognome, email || null, telefono || null, ora, codice]);
  }
  save();

  res.json({ codice, totale, sessioni });
});

app.get('/api/prove/prenotazioni', (req, res) => {
  res.json(all('SELECT * FROM prove_prenotazioni ORDER BY ora, cognome, nome'));
});

app.delete('/api/prove/prenotazioni/:codice', (req, res) => {
  db.run('DELETE FROM prove_prenotazioni WHERE codice=?', [req.params.codice]);
  save();
  res.json({ ok: true });
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

app.post('/api/push/subscribe', (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) return res.status(400).json({ error: 'Subscription invalida' });
  db.run('INSERT OR IGNORE INTO push_subscriptions (endpoint, keys_p256dh, keys_auth) VALUES (?, ?, ?)',
    [endpoint, keys.p256dh, keys.auth]);
  save();
  res.json({ ok: true });
});

// --- NOTIFICA MANUALE ---
app.post('/api/push/send', (req, res) => {
  const { title, body } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Titolo e messaggio richiesti' });
  const subs = all('SELECT * FROM push_subscriptions');
  const payload = JSON.stringify({ title, body, url: '/risultati.html' });
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
  res.json({ ok: true, sent: subs.length });
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
  await transporter.sendMail({
    from: '"Busto Battle XI" <noreply@bustobattle.it>',
    to: 'info@bustobattle.it',
    replyTo: email,
    subject: `[Contatto] ${oggetto}`,
    html: `<p><strong>Da:</strong> ${nome} (${email})</p><p><strong>Oggetto:</strong> ${oggetto}</p><p>${messaggio}</p>`
  });
}

initDb().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Server avviato su porta ' + PORT));
});
