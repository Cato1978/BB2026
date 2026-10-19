const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('./db/gara.db'));
  
  // Conta maglie dalle iscrizioni (campo note contiene "Maglia: XXX")
  const iscritti = db.exec("SELECT note FROM iscritti WHERE note LIKE '%Maglia:%'");
  const maglieIscrizioni = {};
  
  if (iscritti.length && iscritti[0].values) {
    iscritti[0].values.forEach(row => {
      const note = row[0];
      const match = note.match(/Maglia:\s*([^|]+)/);
      if (match) {
        const taglia = match[1].trim();
        maglieIscrizioni[taglia] = (maglieIscrizioni[taglia] || 0) + 1;
      }
    });
  }
  
  console.log('=== MAGLIE DA ISCRIZIONI ===');
  console.log(JSON.stringify(maglieIscrizioni, null, 2));
  
  // Conta maglie dal merch
  const merch = db.exec("SELECT prodotto, taglia FROM merch_orders WHERE prodotto LIKE '%Maglia%' OR prodotto LIKE '%T-Shirt%'");
  const maglieMerch = {};
  
  if (merch.length && merch[0].values) {
    merch[0].values.forEach(row => {
      const prodotto = row[0];
      const taglia = row[1];
      const key = taglia || prodotto;
      maglieMerch[key] = (maglieMerch[key] || 0) + 1;
    });
  }
  
  console.log('\n=== MAGLIE DA MERCH ===');
  console.log(JSON.stringify(maglieMerch, null, 2));
  
  // Verifica struttura tabella merch
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\n=== TABELLE ===');
  console.log(tables[0]?.values.map(v => v[0]).join(', '));
  
  // Prova a vedere la struttura merch_orders
  try {
    const merchAll = db.exec("SELECT * FROM merch_orders LIMIT 5");
    if (merchAll.length) {
      console.log('\n=== SAMPLE MERCH_ORDERS ===');
      console.log('Columns:', merchAll[0].columns);
      console.log('Values:', merchAll[0].values);
    }
  } catch(e) {
    console.log('Tabella merch_orders non esiste o errore:', e.message);
  }
});
