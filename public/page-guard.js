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
      const lang = typeof getLang === 'function' ? getLang() : 'it';
      const t = (typeof T !== 'undefined') ? T[lang] : {};
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
