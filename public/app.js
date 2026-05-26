// Install App function (used by nav menu)
function installApp() {
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
  } else {
    alert('Per installare: apri il menu del browser (⋮) e seleziona "Installa app" o "Aggiungi a schermata Home"');
  }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    console.log('SW registrato');
    // Se già ha il permesso, sottoscrivi silenziosamente
    if (Notification.permission === 'granted') {
      subscribePush(reg);
    } else if (Notification.permission !== 'denied') {
      showNotificationBanner(reg);
    }
  });
}

// Mostra banner per attivare notifiche
function showNotificationBanner(reg) {
  // Non mostrare se già chiuso in questa sessione
  if (sessionStorage.getItem('notif-dismissed')) return;
  const banner = document.createElement('div');
  banner.id = 'notif-banner';
  banner.innerHTML = `
    <span>🔔 Vuoi ricevere notifiche live durante la gara?</span>
    <button id="notif-yes">Attiva</button>
    <button id="notif-close">✕</button>
  `;
  document.body.prepend(banner);

  document.getElementById('notif-yes').addEventListener('click', async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribePush(reg);
    }
    banner.remove();
  });

  document.getElementById('notif-close').addEventListener('click', () => {
    sessionStorage.setItem('notif-dismissed', '1');
    banner.remove();
  });
}

// Subscribe to push
async function subscribePush(reg) {
  if (!('PushManager' in window)) return;
  try {
    const res = await fetch('/api/push/vapidPublicKey');
    const { key } = await res.json();

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
      });
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON())
    });
    console.log('Push subscription attiva');
  } catch (err) {
    console.error('Errore push subscription:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// Install Banner (PWA)
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window.deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  if (document.getElementById('install-banner')) return;
  if (sessionStorage.getItem('install-dismissed')) return;
  const banner = document.createElement('div');
  banner.id = 'install-banner';
  banner.innerHTML = `
    <span>📲 Installa l'app Busto Battle per ricevere aggiornamenti live!</span>
    <button id="install-btn">Installa</button>
    <button id="install-close">✕</button>
  `;
  document.body.prepend(banner);

  document.getElementById('install-btn').addEventListener('click', async () => {
    if (!window.deferredPrompt) return;
    window.deferredPrompt.prompt();
    await window.deferredPrompt.userChoice;
    window.deferredPrompt = null;
    banner.remove();
  });

  document.getElementById('install-close').addEventListener('click', () => {
    sessionStorage.setItem('install-dismissed', '1');
    banner.remove();
  });
}
