// Page Guard - controlla se la pagina è attiva
(async function() {
  const pageName = location.pathname.replace('/', '').replace('.html', '');
  if (!pageName || pageName === 'index' || pageName === 'login' || pageName === 'admin') return;

  try {
    const res = await fetch('/api/pages');
    const pages = await res.json();
    const page = pages.find(p => p.page === pageName);
    if (page && !page.enabled) {
      const lang = getLang ? getLang() : 'it';
      const t = T ? T[lang] : {};
      const title = t.pageDisabledTitle || '🚧 Pagina in costruzione';
      const text = t.pageDisabledText || "La pagina è attualmente in costruzione, verrete avvisati non appena sarà disponibile. Scaricate la app e attendete la notifica!";
      const btn = t.installBtn || '📲 Installa App';
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
