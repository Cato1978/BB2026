/**
 * Script di verifica unificazione prove pista
 */
const initSqlJs = require('sql.js');
const fs = require('fs');

async function test() {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync('./db/gara.db');
  const db = new SQL.Database(buf);
  
  console.log('=== VERIFICA DATI CHECK-IN ===\n');
  
  // 1. Conta totale per origine
  const countByOrigin = db.exec(`
    SELECT origine, COUNT(*) as cnt 
    FROM prove_prenotazioni 
    GROUP BY origine
  `);
  console.log('📅 PROVE PISTA PER ORIGINE:');
  if (countByOrigin.length) {
    countByOrigin[0].values.forEach(r => console.log(`   ${r[0]}: ${r[1]}`));
  }
  
  // 2. Verifica atleti con prove
  const athletesWithProve = db.exec(`
    SELECT i.id, i.nome, i.cognome,
      (SELECT COUNT(*) FROM prove_prenotazioni p WHERE LOWER(p.nome)=LOWER(i.nome) AND LOWER(p.cognome)=LOWER(i.cognome) AND p.origine='iscrizione') as prove_isc,
      (SELECT COUNT(*) FROM prove_prenotazioni p WHERE LOWER(p.nome)=LOWER(i.nome) AND LOWER(p.cognome)=LOWER(i.cognome) AND p.origine='standalone') as prove_std
    FROM iscritti i
    ORDER BY i.id
  `);
  
  console.log('\n👥 ATLETI CON PROVE (sia iscrizione che standalone):');
  console.log('   ID | Nome Cognome          | Da Iscrizione | Standalone');
  console.log('   ---|----------------------|---------------|----------');
  if (athletesWithProve.length) {
    athletesWithProve[0].values.filter(r => r[3] > 0 || r[4] > 0).forEach(r => {
      const nomeCognome = `${r[1]} ${r[2]}`.padEnd(20);
      console.log(`   ${String(r[0]).padStart(2)} | ${nomeCognome} | ${String(r[3]).padStart(13)} | ${String(r[4]).padStart(9)}`);
    });
  }
  
  // 3. Verifica merch
  const merchStats = db.exec(`
    SELECT 
      (SELECT COUNT(*) FROM merch_ordini) as ordini,
      (SELECT COUNT(*) FROM merch_items) as items,
      (SELECT COUNT(*) FROM iscritti WHERE note LIKE '%Maglia%' OR note LIKE '%Felpa%' OR note LIKE '%Cappellino%' OR note LIKE '%Asciugamano%') as isc_con_merch
  `);
  
  console.log('\n🛍️ MERCHANDISING:');
  if (merchStats.length) {
    const m = merchStats[0].values[0];
    console.log(`   Ordini separati: ${m[0]}`);
    console.log(`   Articoli da ordini: ${m[1]}`);
    console.log(`   Iscritti con merch in note: ${m[2]}`);
  }
  
  // 4. Verifica ordini orfani (non collegati a nessun iscritto)
  const ordiniOrfani = db.exec(`
    SELECT mo.codice, mo.nome, mo.cognome
    FROM merch_ordini mo
    WHERE NOT EXISTS (
      SELECT 1 FROM iscritti i 
      WHERE LOWER(i.nome)=LOWER(mo.nome) AND LOWER(i.cognome)=LOWER(mo.cognome)
    )
  `);
  
  console.log('\n⚠️ ORDINI MERCH ORFANI (da associare):');
  if (ordiniOrfani.length && ordiniOrfani[0].values.length > 0) {
    ordiniOrfani[0].values.forEach(r => console.log(`   ${r[0]} - ${r[1]} ${r[2]}`));
  } else {
    console.log('   (nessuno)');
  }
  
  // 5. Prove orfane
  const proveOrfane = db.exec(`
    SELECT p.codice, p.nome, p.cognome, p.giorno, p.ora
    FROM prove_prenotazioni p
    WHERE NOT EXISTS (
      SELECT 1 FROM iscritti i 
      WHERE LOWER(i.nome)=LOWER(p.nome) AND LOWER(i.cognome)=LOWER(p.cognome)
    )
  `);
  
  console.log('\n⚠️ PROVE PISTA ORFANE (nomi non corrispondenti):');
  if (proveOrfane.length && proveOrfane[0].values.length > 0) {
    proveOrfane[0].values.forEach(r => console.log(`   ${r[0]} - ${r[1]} ${r[2]} (${r[3]} ${r[4]})`));
  } else {
    console.log('   (nessuna)');
  }
  
  console.log('\n✅ Verifica completata!');
  console.log('\n📝 NOTA: Per testare la pagina check-in:');
  console.log('   1. Vai su http://localhost:3000/login.html');
  console.log('   2. Login con admin / admin123');
  console.log('   3. Clicca su "Check-in Atleti"');
  
  db.close();
}

test().catch(console.error);
