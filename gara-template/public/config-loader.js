/**
 * CONFIG LOADER
 * Carica la configurazione dal server e la rende disponibile globalmente
 * Tutte le pagine dovrebbero includere questo script prima di app.js
 */

// Configurazione globale
window.GARA_CONFIG = null;

// Carica la configurazione dal server
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Errore caricamento config');
    window.GARA_CONFIG = await res.json();
    console.log('Config caricato:', window.GARA_CONFIG.event.fullName);
    
    // Applica configurazione alla pagina
    applyConfigToPage();
    
    // Notifica che il config è pronto
    document.dispatchEvent(new CustomEvent('configLoaded', { detail: window.GARA_CONFIG }));
    
    return window.GARA_CONFIG;
  } catch (err) {
    console.error('Errore caricamento configurazione:', err);
    return null;
  }
}

// Applica la configurazione agli elementi della pagina
function applyConfigToPage() {
  const cfg = window.GARA_CONFIG;
  if (!cfg) return;
  
  // Titolo pagina
  document.title = document.title.replace(/Busto Battle XI/g, cfg.event.fullName);
  
  // Elementi con data-config
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.getAttribute('data-config');
    const value = getConfigValue(key);
    if (value !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = value;
      } else if (el.tagName === 'IMG') {
        el.src = value;
      } else if (el.tagName === 'A') {
        el.href = value;
      } else {
        el.textContent = value;
      }
    }
  });
  
  // Colori CSS custom properties
  document.documentElement.style.setProperty('--primary-color', cfg.branding.primary_color);
  document.documentElement.style.setProperty('--secondary-color', cfg.branding.secondary_color);
  document.documentElement.style.setProperty('--accent-color', cfg.branding.accent_color);
  
  // Nascondi sezioni disabilitate
  if (!cfg.features.track_practice) {
    document.querySelectorAll('[data-feature="track_practice"]').forEach(el => el.style.display = 'none');
  }
  if (!cfg.features.merchandise) {
    document.querySelectorAll('[data-feature="merchandise"]').forEach(el => el.style.display = 'none');
  }
  if (!cfg.features.dinner_reservation) {
    document.querySelectorAll('[data-feature="dinner"]').forEach(el => el.style.display = 'none');
  }
  if (!cfg.features.shuttle) {
    document.querySelectorAll('[data-feature="shuttle"]').forEach(el => el.style.display = 'none');
  }
}

// Ottiene un valore dal config usando dot notation (es: "event.name")
function getConfigValue(path) {
  const parts = path.split('.');
  let value = window.GARA_CONFIG;
  for (const part of parts) {
    if (value === undefined || value === null) return undefined;
    value = value[part];
  }
  return value;
}

// Formatta data nel formato italiano
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  return `${giorni[d.getDay()]} ${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
}

// Formatta prezzo in EUR
function formatPrice(amount) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Helper per generare HTML discipline
function generateDisciplinesHTML() {
  const cfg = window.GARA_CONFIG;
  if (!cfg) return '';
  
  return cfg.disciplines.map(d => `
    <div class="discipline-item">
      <span class="discipline-name">${d.name}</span>
      <span class="discipline-stars">${'⭐'.repeat(d.stars)}</span>
    </div>
  `).join('');
}

// Helper per generare HTML programma
function generateScheduleHTML() {
  const cfg = window.GARA_CONFIG;
  if (!cfg || !cfg.schedule) return '';
  
  return cfg.schedule.days.map(day => `
    <div class="schedule-day">
      <h3>${day.name} - ${formatDate(day.date)}</h3>
      <ul>
        ${day.events.map(e => `<li><strong>${e.time}</strong> - ${e.activity}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

// Helper per generare HTML hotel
function generateHotelsHTML() {
  const cfg = window.GARA_CONFIG;
  if (!cfg || !cfg.hotels) return '';
  
  return cfg.hotels.map(h => `
    <div class="hotel-card">
      <h3>${h.name} ${'⭐'.repeat(h.stars)}</h3>
      <p>${h.address}</p>
      <p>📞 ${h.phone}</p>
      <p>📧 <a href="mailto:${h.email}">${h.email}</a></p>
      <p>🌐 <a href="${h.website}" target="_blank">Sito web</a></p>
      <p>📍 ${h.distance}</p>
      ${h.discount_code ? `<p class="discount">Codice sconto: <strong>${h.discount_code}</strong> (-${h.discount_percent}%)</p>` : ''}
    </div>
  `).join('');
}

// Calcola il costo iscrizione
function calculateRegistrationFee(disciplines) {
  const cfg = window.GARA_CONFIG;
  if (!cfg) return 0;
  
  let total = cfg.pricing.registration.base_fee;
  
  disciplines.forEach(discId => {
    const disc = cfg.disciplines.find(d => d.id === discId);
    if (disc) {
      if (disc.stars === 1) {
        total += cfg.pricing.registration.per_discipline_1star;
      } else if (disc.stars >= 2) {
        total += cfg.pricing.registration.per_discipline_2star;
      }
    }
  });
  
  // Late fee
  const today = new Date();
  const lateFeeDate = new Date(cfg.pricing.registration.late_fee_date);
  if (today > lateFeeDate) {
    total += cfg.pricing.registration.late_fee;
  }
  
  return total;
}

// Carica config al caricamento della pagina
document.addEventListener('DOMContentLoaded', loadConfig);
