/* Third-party consent gate.
 *
 * Tawk.to is the only thing on this site that sets a third-party cookie. The
 * first-party analytics beacon stores a path and a referrer hostname, no IP and
 * no cookie, so it needs no consent and is deliberately not gated here. Gating
 * it would be theatre.
 *
 * One gate covers two requirements. Global Privacy Control is a legally valid
 * opt-out of sale/sharing in California (CCPA/CPRA), Colorado and Connecticut,
 * so a GPC signal suppresses the widget AND the prompt. Asking someone who has
 * already broadcast "do not sell" is the dark pattern the law exists to stop.
 *
 * No consent state leaves the browser. The choice lives in localStorage, so
 * there is no profile to build and nothing to subpoena.
 *
 * Text is English or Spanish, following <html lang>, as lux-brand-kit/ga.js
 * does on the other Vipelex sites. Both halves set lang="es" on /es/ pages.
 */
(function () {
  'use strict';

  var KEY = 'ag-chat-consent';
  var cfg = window.__AG_CHAT;
  var T = /^es\b/i.test(document.documentElement.lang || '') ? {
    title: 'Chat en vivo',
    body: 'Nuestro chat lo opera Tawk.to, que usa sus propias cookies. Permanece ' +
      'desactivado hasta que lo actives. Todo lo demás en este sitio funciona sin ' +
      'cookies ni rastreo.',
    yes: 'Activar el chat',
    no: 'No, gracias'
  } : {
    title: 'Live chat',
    body: 'Our chat widget is run by Tawk.to and sets its own cookies. It stays off ' +
      'until you say so. Everything else here runs without cookies or tracking.',
    yes: 'Turn on chat',
    no: 'No thanks'
  };

  // Chat not configured on this deploy. Nothing to gate, nothing to ask.
  if (!cfg || !cfg.p || !cfg.w) return;

  function loadChat() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://embed.tawk.to/' + cfg.p + '/' + cfg.w;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }

  function remember(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
  }

  // Standing opt-out. Never prompt, never load.
  if (navigator.globalPrivacyControl === true) return;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (stored === 'yes') { loadChat(); return; }
  if (stored === 'no') return;

  // ── First visit: ask ──────────────────────────────────────────────────────
  function prompt() {
    var box = document.createElement('div');
    box.className = 'consent-box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'consent-title');
    box.innerHTML =
      '<p id="consent-title" class="consent-title">' + T.title + '</p>' +
      '<p class="consent-body">' + T.body + '</p>' +
      '<div class="consent-actions">' +
        '<button type="button" class="consent-btn consent-btn-yes">' + T.yes + '</button>' +
        '<button type="button" class="consent-btn consent-btn-no">' + T.no + '</button>' +
      '</div>';

    function close() {
      box.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      // Escape declines. The privacy-preserving option is the safe default.
      if (e.key === 'Escape') { remember('no'); close(); }
    }

    box.querySelector('.consent-btn-yes').addEventListener('click', function () {
      remember('yes'); close(); loadChat();
    });
    box.querySelector('.consent-btn-no').addEventListener('click', function () {
      remember('no'); close();
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(box);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prompt);
  } else {
    prompt();
  }
})();
