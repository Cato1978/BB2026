// Script per inviare TUTTI i tipi di email a scopo test
// Simula i dati di Gramegna Ilaria

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const TEST_EMAIL = 'amicocatoblepa78@gmail.com';
const BREVO_FROM = process.env.BREVO_FROM || 'noreply@bustobattle.com';

const testData = {
  nome: 'Ilaria',
  cognome: 'Gramegna',
  codice: 'BB11-TEST',
  categoria: 'Speed Slalom (U15), Slides (U15)'
};

// Header comune
const emailHeader = `
  <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:8px 8px 0 0">
    <img src="https://bb2026.onrender.com/LogoBB.jpeg" alt="Busto Battle XI" style="height:80px;border-radius:8px">
    <h1 style="color:#F7AF40;margin:15px 0 0;font-family:Arial,sans-serif">BUSTO BATTLE XI</h1>
  </div>
`;

// Footer comune
const emailFooter = `
  <div style="background:#1a1a1a;padding:20px;text-align:center;border-radius:0 0 8px 8px;margin-top:20px">
    <p style="color:#888;margin:0 0 15px;font-family:Arial,sans-serif">📅 13-15 Novembre / November 2026 | 📍 Busto Arsizio (VA), Italy</p>
    <p style="color:#666;margin:0;font-size:12px;font-family:Arial,sans-serif">
      <a href="https://bb2026.onrender.com" style="color:#F7AF40">www.bustobattle.it</a> | 
      <a href="mailto:bustobattle@gmail.com" style="color:#F7AF40">bustobattle@gmail.com</a>
    </p>
  </div>
`;

async function sendEmail(subject, html) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'Busto Battle XI', email: BREVO_FROM },
      to: [{ email: TEST_EMAIL, name: `${testData.nome} ${testData.cognome}` }],
      replyTo: { email: 'bustobattle@gmail.com', name: 'Busto Battle XI' },
      bcc: [{ email: 'bustobattle@gmail.com' }],
      subject: subject,
      htmlContent: html
    })
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(JSON.stringify(err));
  }
  return await response.json();
}

async function sendAllEmails() {
  console.log('📧 Invio email di test a:', TEST_EMAIL);
  console.log('📤 Mittente:', BREVO_FROM);
  console.log('=====================================\n');

  const { nome, cognome, codice, categoria } = testData;

  // 1. ISCRIZIONE SOSPESA
  console.log('1️⃣ Iscrizione Sospesa...');
  try {
    await sendEmail(
      `Busto Battle XI - Iscrizione Sospesa / Registration Pending - ${codice}`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#f59e0b;color:#000;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🕐 Iscrizione Sospesa / Registration Pending</h2>
          </div>
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua iscrizione è stata registrata con successo!<br><em style="color:#888">Your registration has been recorded successfully!</em></p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> ${codice}</p>
            <p style="margin:0"><strong style="color:#F7AF40">Discipline:</strong> ${categoria}</p>
          </div>
          <p><strong>Dati bonifico:</strong></p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:10px 0">
            <p style="margin:5px 0"><strong>IBAN:</strong> IT54Y0326822800052416865080</p>
            <p style="margin:5px 0"><strong>Banca:</strong> Banca Sella</p>
            <p style="margin:5px 0"><strong>Intestatario:</strong> Accademia Bustese Pattinaggio ASD</p>
            <p style="margin:5px 0"><strong>Causale:</strong> ${codice} - ${nome} ${cognome}</p>
          </div>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta.html?codice=${codice}" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Ricevuta</a>
          </p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 2. ISCRIZIONE IN VERIFICA
  console.log('2️⃣ Iscrizione in Verifica...');
  try {
    await sendEmail(
      `Busto Battle XI - Iscrizione in Verifica / Under Review - ${codice}`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#3b82f6;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🔍 Iscrizione in Verifica / Under Review</h2>
          </div>
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>Abbiamo ricevuto la ricevuta del bonifico per la tua iscrizione.<br><em style="color:#888">We have received the bank transfer receipt.</em></p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0"><strong style="color:#F7AF40">Codice:</strong> ${codice}</p>
          </div>
          <p style="text-align:center;color:#888">⏳ Verifica in corso (2-3 giorni lavorativi)</p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 3. ISCRIZIONE CONFERMATA
  console.log('3️⃣ Iscrizione Confermata...');
  try {
    await sendEmail(
      `Busto Battle XI - Iscrizione Confermata / Registration Confirmed! - ${codice}`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#22c55e;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">✅ Iscrizione Confermata / Registration Confirmed!</h2>
          </div>
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua iscrizione è stata <strong style="color:#22c55e">confermata</strong>!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> ${codice}</p>
            <p style="margin:0"><strong style="color:#F7AF40">Discipline:</strong> ${categoria}</p>
          </div>
          <div style="background:#1a3a1a;border:2px solid #22c55e;padding:20px;border-radius:6px;text-align:center;margin:20px 0">
            <p style="margin:0;font-size:20px;color:#22c55e">🎉 Ci vediamo a Busto Arsizio!</p>
            <p style="margin:10px 0 0;color:#888">📅 13-15 Novembre 2026</p>
          </div>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 4. SOLLECITO
  console.log('4️⃣ Sollecito Iscrizione...');
  try {
    await sendEmail(
      `Busto Battle XI - Promemoria Iscrizione / Registration Reminder - ${codice}`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#f59e0b;color:#000;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">⏰ PROMEMORIA ISCRIZIONE</h2>
          </div>
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua iscrizione è ancora in attesa di conferma!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> ${codice}</p>
            <p style="margin:0"><strong style="color:#F7AF40">Discipline:</strong> ${categoria}</p>
          </div>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta.html?codice=${codice}" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Ricevuta</a>
          </p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 5. RICEVUTA RIGETTATA
  console.log('5️⃣ Ricevuta Rigettata...');
  try {
    await sendEmail(
      `Busto Battle XI - Ricevuta Non Valida / Invalid Receipt - ${codice}`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#ef4444;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">❌ Ricevuta Non Valida / Invalid Receipt</h2>
          </div>
          <p>Ciao / Hello <strong>${nome} ${cognome}</strong>,</p>
          <p>La ricevuta del bonifico <strong style="color:#ef4444">non è stata accettata</strong>.</p>
          <div style="background:#3d1515;border:2px solid #ef4444;padding:20px;border-radius:6px;margin:20px 0">
            <p style="margin:0;color:#ef4444;font-weight:bold">📋 Motivo:</p>
            <p style="margin:10px 0 0;color:#f0f0f0">L'importo non corrisponde alla quota di iscrizione</p>
          </div>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta.html?codice=${codice}" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Nuova Ricevuta</a>
          </p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 6. PROVE PISTA - SOSPESA
  console.log('6️⃣ Prove Pista Sospesa...');
  try {
    await sendEmail(
      `Busto Battle XI - Prenotazione Prove Sospesa - PRV-TEST`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#f59e0b;color:#000;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🕐 Prenotazione Prove Sospesa</h2>
          </div>
          <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
          <p>La prenotazione per le prove pista è stata registrata!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> PRV-TEST</p>
            <p style="margin:0"><strong style="color:#F7AF40">Slot:</strong> Giovedì 12 Nov - 14:00-14:30</p>
            <p style="margin:10px 0 0"><strong style="color:#F7AF40">Totale:</strong> €5</p>
          </div>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta-prove.html?codice=PRV-TEST" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Ricevuta</a>
          </p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 7. PROVE PISTA - CONFERMATA
  console.log('7️⃣ Prove Pista Confermata...');
  try {
    await sendEmail(
      `Busto Battle XI - Prenotazione Prove Confermata! - PRV-TEST`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#22c55e;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">✅ Prenotazione Prove Confermata!</h2>
          </div>
          <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
          <p>La tua prenotazione per le prove pista è <strong style="color:#22c55e">confermata</strong>!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> PRV-TEST</p>
            <p style="margin:0"><strong style="color:#F7AF40">Slot:</strong> Giovedì 12 Nov - 14:00-14:30</p>
          </div>
          <p style="color:#22c55e;text-align:center">🎉 Ci vediamo in pista!</p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 8. MERCH - SOSPESO
  console.log('8️⃣ Ordine Merch Sospeso...');
  try {
    await sendEmail(
      `Busto Battle XI - Ordine Merchandising Sospeso - MERCH-TEST`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#f59e0b;color:#000;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">🕐 Ordine Sospeso</h2>
          </div>
          <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
          <p>Il tuo ordine merchandising è stato registrato!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> MERCH-TEST</p>
            <p style="margin:0"><strong style="color:#F7AF40">Articoli:</strong> 1x Maglia M, 1x Felpa L</p>
            <p style="margin:10px 0 0"><strong style="color:#F7AF40">Totale:</strong> €50</p>
          </div>
          <p style="text-align:center;margin:20px 0">
            <a href="https://bb2026.onrender.com/carica-ricevuta-merch.html?codice=MERCH-TEST" style="background:#F7AF40;color:#000;padding:15px 30px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">📤 Carica Ricevuta</a>
          </p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  // 9. MERCH - CONFERMATO
  console.log('9️⃣ Ordine Merch Confermato...');
  try {
    await sendEmail(
      `Busto Battle XI - Ordine Merchandising Confermato! - MERCH-TEST`,
      `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#111;border-radius:8px">
        ${emailHeader}
        <div style="padding:30px;color:#f0f0f0">
          <div style="background:#22c55e;color:#fff;padding:15px;border-radius:6px;text-align:center;margin-bottom:20px">
            <h2 style="margin:0">✅ Ordine Confermato!</h2>
          </div>
          <p>Ciao <strong>${nome} ${cognome}</strong>,</p>
          <p>Il tuo ordine merchandising è <strong style="color:#22c55e">confermato</strong>!</p>
          <div style="background:#222;padding:15px;border-radius:6px;margin:20px 0">
            <p style="margin:0 0 10px"><strong style="color:#F7AF40">Codice:</strong> MERCH-TEST</p>
            <p style="margin:0"><strong style="color:#F7AF40">Articoli:</strong> 1x Maglia M, 1x Felpa L</p>
          </div>
          <p style="color:#22c55e;text-align:center">🎁 Ritirerai il merchandising durante l'evento!</p>
        </div>
        ${emailFooter}
      </div>`
    );
    console.log('   ✅ OK');
  } catch (e) { console.log('   ❌', e.message); }

  console.log('\n=====================================');
  console.log('✅ Invio completato! Controlla ' + TEST_EMAIL);
}

sendAllEmails();
