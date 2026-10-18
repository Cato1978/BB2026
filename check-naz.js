const initSqlJs = require('sql.js');
const fs = require('fs');

initSqlJs().then(SQL => {
  const db = new SQL.Database(fs.readFileSync('./db/gara.db'));
  
  // Check if any records have nationality in notes
  const r = db.exec("SELECT note FROM iscritti WHERE note LIKE '%azional%' LIMIT 3");
  if(r.length && r[0].values.length) {
    console.log('Records con Nazionalita:');
    r[0].values.forEach(v => console.log(v[0]));
  } else {
    console.log('Nessun record con Nazionalita nelle note');
  }
  
  // Check column nazionalita
  const r2 = db.exec("SELECT nazionalita FROM iscritti WHERE nazionalita IS NOT NULL AND nazionalita != '' LIMIT 3");
  if(r2.length && r2[0].values.length) {
    console.log('Records con campo nazionalita:', r2[0].values);
  } else {
    console.log('Campo nazionalita vuoto per tutti');
  }
});
