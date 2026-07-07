// Page Guard - controlla se la pagina è attiva e gestisce visibilità nel menu
(async function() {
  try {
    const res = await fetch('/api/pages');
    const pages = await res.json();

    // Nascondi dal nav i link alle pagine con visible=0
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      const pageName = href.replace('.html', '').replace('/', '');
      const page = pages.find(p => p.page === pageName);
      if (page && !page.visible) {
        link.style.display = 'none';
      }
    });

    // Controlla se la pagina corrente è disabilitata
    const currentPage = location.pathname.replace('/', '').replace('.html', '');
    if (!currentPage || currentPage === 'index' || currentPage === 'login' || currentPage === 'admin') return;

    const page = pages.find(p => p.page === currentPage);
    if (page && !page.enabled) {
      // Legge lingua da localStorage direttamente
      const lang = localStorage.getItem('lang') || 'it';
      const t = (typeof T !== 'undefined') ? T[lang] : {};
      
      // Messaggio personalizzato per la navetta
      if (currentPage === 'navetta') {
        const navettaTitle = lang === 'en' ? '🚐 Shuttle Service' : '🚐 Servizio Navetta';
        const navettaText = lang === 'en' 
          ? 'A shuttle service (only €2) will be available to reach the event venues. Booking will open as soon as the competition schedule is finalized. Stay tuned!'
          : 'Sarà disponibile un servizio navetta (a soli 2€) per raggiungere le sedi dell\'evento. La prenotazione sarà attiva non appena verrà definito il programma della manifestazione. Restate connessi!';
        
        document.querySelector('main').innerHTML = `
          <div style="text-align:center;padding:3rem 1rem;max-width:600px;margin:0 auto">
            <h2 style="color:#F7AF40;margin-bottom:1rem">${navettaTitle}</h2>
            <p style="color:#ccc;font-size:1.1rem;line-height:1.6">${navettaText}</p>
            <a href="index.html" style="display:inline-block;margin-top:1.5rem;background:#F7AF40;color:#000;padding:0.8rem 2rem;border-radius:6px;text-decoration:none;font-weight:700">← ${lang === 'en' ? 'Back to Home' : 'Torna alla Home'}</a>
          </div>
        `;
        return;
      }
      
      // Messaggio personalizzato per le iscrizioni
      if (currentPage === 'iscrizioni' || currentPage === 'iscrizioni2') {
        const iscrizioniTitle = lang === 'en' ? '📝 Registration' : '📝 Iscrizioni';
        const iscrizioniText = lang === 'en' 
          ? 'Registrations will open on July 21, 2026. Download the app and enable notifications to be notified as soon as they open!'
          : 'Le iscrizioni apriranno il 21 Luglio 2026. Scarica la app e attiva le notifiche per essere avvisato non appena apriranno!';
        
        document.querySelector('main').innerHTML = `
          <div style="text-align:center;padding:3rem 1rem;max-width:600px;margin:0 auto">
            <h2 style="color:#F7AF40;margin-bottom:1rem">${iscrizioniTitle}</h2>
            <div style="background:#1a1a1a;border:2px solid #F7AF40;padding:2rem;border-radius:12px;margin:1.5rem 0">
              <p style="color:#F7AF40;font-size:1.5rem;font-weight:700;margin:0">📅 21 ${lang === 'en' ? 'July' : 'Luglio'} 2026</p>
            </div>
            <p style="color:#ccc;font-size:1.1rem;line-height:1.6">${iscrizioniText}</p>
            <a href="index.html" style="display:inline-block;margin-top:1.5rem;background:#F7AF40;color:#000;padding:0.8rem 2rem;border-radius:6px;text-decoration:none;font-weight:700">← ${lang === 'en' ? 'Back to Home' : 'Torna alla Home'}</a>
          </div>
        `;
        return;
      }
      
      // Messaggio generico per altre pagine
      const title = t.pageDisabledTitle || '🚧 Pagina in costruzione';
      const text = t.pageDisabledText || "La pagina è attualmente in costruzione, verrete avvisati non appena sarà disponibile. Scaricate la app e attendete la notifica!";
      const btn = t.installBtn || 'Installa App';
      document.querySelector('main').innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;max-width:600px;margin:0 auto">
          <h2 style="color:#F7AF40;margin-bottom:1rem">${title}</h2>
          <p style="color:#ccc;font-size:1.1rem;line-height:1.6">${text}</p>
          <a href="#" onclick="installApp()" style="display:inline-block;margin-top:1.5rem;background:#F7AF40;color:#000;padding:0.8rem 2rem;border-radius:6px;text-decoration:none;font-weight:700">${btn}</a>
        </div>
      `;
    }
  } catch(e) {}
})();
