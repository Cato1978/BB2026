const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('./db/gara.db'));
  
  // Aggiungi nazionalità di test ad alcuni iscritti
  const updates = [
    { cognome: 'Barbieri', naz: 'IT' },
    { cognome: 'Bernard', naz: 'ES' },
    { cognome: 'Bianchi', naz: 'IT' },
    { cognome: 'Brown', naz: 'RU' },
    { cognome: 'Bruno', naz: 'IT' },
    { cognome: 'Conti', naz: 'IT' },
    { cognome: 'Costa', naz: 'ES' },
    { cognome: 'De Luca', naz: 'IT' },
    { cognome: 'Dupont', naz: 'UA' },
    { cognome: 'Ferrari', naz: 'IT' }
  ];
  
  for (const u of updates) {
    // Prendi le note attuali
    const r = db.exec(`SELECT id, note FROM iscritti WHERE cognome = '${u.cognome}' LIMIT 1`);
    if (r.length && r[0].values.length) {
      const id = r[0].values[0][0];
      let note = r[0].values[0][1] || '';
      // Aggiungi nazionalità se non presente
      if (!note.includes('Nazionalità:')) {
        note = note ? note + ` | Nazionalità: ${u.naz}` : `Nazionalità: ${u.naz}`;
        db.run(`UPDATE iscritti SET note = ? WHERE id = ?`, [note, id]);
        console.log(`Aggiornato ${u.cognome} con ${u.naz}`);
      }
    }
  }
  
  // Salva il database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync('./db/gara.db', buffer);
  console.log('Database salvato');
});
