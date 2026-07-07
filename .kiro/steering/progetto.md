# Busto Battle XI

Sito web per la gara internazionale di pattinaggio freestyle "Busto Battle XI".

## Stack

- **Server:** Node.js + Express, porta 3000
- **DB:** SQLite via sql.js, file in `/db/gara.db`
- **Frontend:** HTML statico servito da `/public/`
- **Avvio:** `npm start` (node server.js)

## Lingue

Solo Italiano (IT) e Inglese (EN). Switcher testuale "IT" / "EN" nell'header.

## Discipline

- Speed Slalom ⭐
- Classic Slalom ⭐
- Battle ⭐
- Slides ⭐⭐
- Pair Slalom ⭐⭐
- Free Jump ⭐⭐

## Pagine pubbliche

- index.html (home con countdown e CTA)
- iscrizioni.html (form iscrizione)
- verifica.html (verifica iscrizione per cognome)
- programma.html (programma gara)
- hotel.html (hotel convenzionati)
- travel.html (info viaggio e come arrivare)
- maglia.html (merchandising)
- contact.html (form contatto)
- faq.html (domande frequenti)
- risultati.html (classifiche PDF, rimossa dal nav ma accessibile via URL)

## Admin

- Login: `/login.html`
- Pannello: `/admin.html`
- Credenziali default: admin / admin123

## Convenzioni

- Ogni pagina ha lo stesso header con lang-switcher (IT/EN) e nav
- Traduzioni gestite in `translations.js` (oggetto `T` con chiavi `it` e `en`)
- Il page-guard.js gestisce le pagine disabilitate
- Upload risultati in `/public/uploads/` (solo PDF)
- Push notifications via web-push + VAPID keys
