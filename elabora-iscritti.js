/**
 * Script per elaborare l'Excel export di Wespoort
 * 
 * Uso: node elabora-iscritti.js <file-input.xlsx> [file-output.xlsx]
 * 
 * Output: un Excel con:
 * - Foglio "Tutti" con filtri attivi: Nome, Cognome, Squadra, Tessera FISR, Gara, Categoria, Note
 * - Un foglio per ogni combinazione Gara + Categoria
 * 
 * Categoria: U15 (nati dal 2012), U19 (nati 2008-2011), SENIOR (nati 2007 o prima)
 */

const XLSX = require('xlsx');
const path = require('path');

// --- CONFIGURAZIONE ---
const ANNO_RIFERIMENTO = 2026;
const SOGLIA_U15 = 2012; // nati dal 2012 in poi
const SOGLIA_U19 = 2008; // nati dal 2008 al 2011

// --- ARGOMENTI ---
const inputFile = process.argv[2];
if (!inputFile) {
  console.log('Uso: node elabora-iscritti.js <file-input.xlsx> [file-output.xlsx]');
  process.exit(1);
}
const outputFile = process.argv[3] || inputFile.replace('.xlsx', '-elaborato.xlsx');

// --- FUNZIONI ---
function parseDataNascita(val) {
  if (!val) return null;
  
  // Se è un numero (serial date di Excel)
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    return date ? date.y : null;
  }
  
  const str = String(val).trim();
  
  // Formato dd/mm/yyyy
  const match1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match1) return parseInt(match1[3]);
  
  // Formato d/m/yy (anno a 2 cifre)
  const match2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (match2) {
    const y = parseInt(match2[3]);
    return y > 50 ? 1900 + y : 2000 + y;
  }
  
  // Formato yyyy-mm-dd
  const match3 = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match3) return parseInt(match3[1]);
  
  return null;
}

function getCategoria(annoNascita, note) {
  // Override da note: se contiene "SENIOR" o "U19" o "U15" usa quello
  if (note) {
    const noteUpper = note.toUpperCase();
    if (noteUpper.includes('SENIOR')) return 'SENIOR';
    if (noteUpper.includes('U19')) return 'U19';
    if (noteUpper.includes('U15')) return 'U15';
  }
  // Calcolo automatico dall'anno di nascita
  if (!annoNascita) return '?';
  if (annoNascita >= SOGLIA_U15) return 'U15';
  if (annoNascita >= SOGLIA_U19) return 'U19';
  return 'SENIOR';
}

// Nomi fogli Excel max 31 caratteri, no caratteri speciali
function sanitizeSheetName(name) {
  return name.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 31);
}

// --- ELABORAZIONE ---
console.log(`Elaborazione: ${inputFile}`);
const workbook = XLSX.readFile(inputFile);

const risultati = [];

// Usa sempre il foglio Riepilogo come fonte primaria
const riepilogoName = workbook.SheetNames.find(s => s.toLowerCase() === 'riepilogo');

if (riepilogoName) {
  const sheet = workbook.Sheets[riepilogoName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  
  for (const row of data) {
    const nome = (row['Nome'] || '').trim();
    const cognome = (row['Cognome'] || '').trim();
    if (!nome && !cognome) continue;
    
    const dataNascita = row['Data di nascita'] || '';
    const annoNascita = parseDataNascita(dataNascita);
    const tessera = (row['TESSERA FISR'] || '').toString().trim();
    const squadra = (row['Squadra'] || '').toString().trim();
    const note = (row['Note'] || '').toString().trim();
    const eventi = (row['Eventi iscritti'] || '').toString().trim();
    
    // Splitta le gare (separate da virgola)
    const gare = eventi.split(',').map(g => g.trim()).filter(g => g);
    
    if (gare.length === 0) {
      // Se non ci sono eventi, aggiungi comunque con gara "?"
      risultati.push({
        Nome: nome,
        Cognome: cognome,
        Squadra: squadra,
        'Tessera FISR': tessera,
        Gara: '?',
        Categoria: getCategoria(annoNascita, note),
        'Anno nascita': annoNascita || '?',
        Note: note
      });
    } else {
      for (const gara of gare) {
        risultati.push({
          Nome: nome,
          Cognome: cognome,
          Squadra: squadra,
          'Tessera FISR': tessera,
          Gara: gara,
          Categoria: getCategoria(annoNascita, note),
          'Anno nascita': annoNascita || '?',
          Note: note
        });
      }
    }
  }
} else {
  // Fallback: usa i fogli singoli come gare
  console.log('Foglio Riepilogo non trovato, uso i fogli singoli...');
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (!data.length) continue;
    
    const gara = sheetName;
    
    for (const row of data) {
      const nome = (row['Nome'] || '').trim();
      const cognome = (row['Cognome'] || '').trim();
      if (!nome && !cognome) continue;
      
      const dataNascita = row['Data di nascita'] || '';
      const annoNascita = parseDataNascita(dataNascita);
      const tessera = (row['TESSERA FISR'] || '').toString().trim();
      const squadra = (row['Squadra'] || '').toString().trim();
      const note = (row['Note'] || '').toString().trim();
      
      risultati.push({
        Nome: nome,
        Cognome: cognome,
        Squadra: squadra,
        'Tessera FISR': tessera,
        Gara: gara,
        Categoria: getCategoria(annoNascita, note),
        'Anno nascita': annoNascita || '?',
        Note: note
      });
    }
  }
}

// Deduplica (stesso nome+cognome+gara)
const unici = [];
const visti = new Set();
for (const r of risultati) {
  const key = `${r.Nome}|${r.Cognome}|${r.Gara}`;
  if (!visti.has(key)) {
    visti.add(key);
    unici.push(r);
  }
}

console.log(`Trovati ${unici.length} record (atleti x gare)`);

// --- OUTPUT ---
const HEADERS = ['Nome', 'Cognome', 'Squadra', 'Tessera FISR', 'Gara', 'Categoria', 'Anno nascita', 'Note'];
const COL_WIDTHS = [
  { wch: 15 }, // Nome
  { wch: 15 }, // Cognome
  { wch: 20 }, // Squadra
  { wch: 15 }, // Tessera FISR
  { wch: 20 }, // Gara
  { wch: 10 }, // Categoria
  { wch: 12 }, // Anno nascita
  { wch: 25 }, // Note
];

const wbOut = XLSX.utils.book_new();

// --- Foglio "Tutti" con autofilter ---
const wsAll = XLSX.utils.json_to_sheet(unici, { header: HEADERS });
wsAll['!cols'] = COL_WIDTHS;
wsAll['!autofilter'] = { ref: `A1:H${unici.length + 1}` };
XLSX.utils.book_append_sheet(wbOut, wsAll, 'Tutti');

// --- Fogli per Gara + Categoria ---
const gruppi = {};
for (const r of unici) {
  const key = `${r.Gara} - ${r.Categoria}`;
  if (!gruppi[key]) gruppi[key] = [];
  gruppi[key].push(r);
}

// Ordina i gruppi per nome
const gruppiOrdinati = Object.keys(gruppi).sort();

for (const key of gruppiOrdinati) {
  const dati = gruppi[key];
  const sheetName = sanitizeSheetName(key);
  const ws = XLSX.utils.json_to_sheet(dati, { header: HEADERS });
  ws['!cols'] = COL_WIDTHS;
  ws['!autofilter'] = { ref: `A1:H${dati.length + 1}` };
  XLSX.utils.book_append_sheet(wbOut, ws, sheetName);
  console.log(`  Foglio "${sheetName}": ${dati.length} atleti`);
}

XLSX.writeFile(wbOut, outputFile);
console.log(`\nOutput salvato: ${outputFile}`);
