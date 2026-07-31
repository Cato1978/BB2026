// Script per testare tutti i tipi di email
const TEST_EMAIL = 'amicocatoblepa78@gmail.com';
const BASE_URL = 'https://bb2026.onrender.com';

async function testEmails() {
  console.log('🧪 Test invio email a:', TEST_EMAIL);
  console.log('=====================================\n');

  // 1. Test email iscrizione - sollecito
  console.log('1️⃣ Test sollecito iscrizione...');
  try {
    // Prima creo un'iscrizione di test
    const iscrizioneRes = await fetch(`${BASE_URL}/api/iscritti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Test',
        cognome: 'Email',
        email: TEST_EMAIL,
        data_nascita: '2000-01-01',
        categoria: 'Speed Slalom (SENIOR)',
        societa: 'Test Club',
        telefono: '1234567890',
        note: 'Genere: M | Maglia: M'
      })
    });
    const iscrizione = await iscrizioneRes.json();
    console.log('   Iscrizione creata:', iscrizione.codice || iscrizione.id);

    // Sollecito
    const sollecitoRes = await fetch(`${BASE_URL}/api/iscritti/${iscrizione.id}/sollecito`, {
      method: 'POST'
    });
    console.log('   ✅ Sollecito:', sollecitoRes.ok ? 'OK' : 'ERRORE');

    // 2. Conferma iscrizione
    console.log('\n2️⃣ Test conferma iscrizione...');
    const confermaRes = await fetch(`${BASE_URL}/api/iscritti/${iscrizione.id}/conferma`, {
      method: 'POST'
    });
    console.log('   ✅ Conferma:', confermaRes.ok ? 'OK' : 'ERRORE');

    // Cleanup - elimina iscrizione test
    await fetch(`${BASE_URL}/api/iscritti/${iscrizione.id}`, { method: 'DELETE' });
    console.log('   🗑️ Iscrizione test eliminata');

  } catch (err) {
    console.log('   ❌ Errore:', err.message);
  }

  // 3. Test email prove pista
  console.log('\n3️⃣ Test email prove pista...');
  try {
    const proveRes = await fetch(`${BASE_URL}/api/prove/prenota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Test',
        cognome: 'Prove',
        email: TEST_EMAIL,
        telefono: '1234567890',
        atleti: [{ nome: 'Test', cognome: 'Atleta' }],
        slots: [{ giorno: '2026-11-12', ora: '14:00-14:30' }],
        metodoPagamento: 'online'
      })
    });
    const prove = await proveRes.json();
    console.log('   ✅ Prenotazione prove:', proveRes.ok ? 'OK' : 'ERRORE', prove.codice || '');
  } catch (err) {
    console.log('   ❌ Errore:', err.message);
  }

  // 4. Test email merchandising
  console.log('\n4️⃣ Test email merchandising...');
  try {
    const merchRes = await fetch(`${BASE_URL}/api/merch/ordine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Test',
        cognome: 'Merch',
        email: TEST_EMAIL,
        telefono: '1234567890',
        items: [{ articolo: 'Maglia', taglia: 'M', quantita: 1, prezzo: 15 }],
        metodoPagamento: 'online'
      })
    });
    const merch = await merchRes.json();
    console.log('   ✅ Ordine merch:', merchRes.ok ? 'OK' : 'ERRORE', merch.codice || '');
  } catch (err) {
    console.log('   ❌ Errore:', err.message);
  }

  // 5. Test form contatto
  console.log('\n5️⃣ Test form contatto...');
  try {
    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Test Contatto',
        email: TEST_EMAIL,
        oggetto: 'Test Email System',
        messaggio: 'Questo è un test del sistema email con il nuovo mittente noreply@bustobattle.com'
      })
    });
    console.log('   ✅ Contatto:', contactRes.ok ? 'OK' : 'ERRORE');
  } catch (err) {
    console.log('   ❌ Errore:', err.message);
  }

  console.log('\n=====================================');
  console.log('✅ Test completati! Controlla la casella email.');
}

testEmails();
