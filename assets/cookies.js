/* Aviso de cookies (LGPD) para o Google Analytics 4 com Consent Mode v2.
   O padrão "negado" é definido no <head> de cada página, antes da tag do Google;
   este arquivo exibe o aviso, guarda a escolha e atualiza o consentimento. */
(function () {
  'use strict';

  // VERSION e MAX_AGE se repetem no script de consentimento do <head> de cada página
  // ("c.v === 1" e "31536e6"): ao mudar aqui, mude lá também, em todas as páginas.
  var KEY = 'tc-consent';                   // registro da escolha no localStorage
  var VERSION = 1;                          // aumentar faz o aviso aparecer de novo
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;  // a escolha vale por 12 meses
  // Ao aceitar, libera só o Analytics: o aviso e a política não tratam de publicidade.
  // Se um dia usar Google Ads, inclua ad_storage, ad_user_data e ad_personalization
  // aqui e atualize o texto do aviso e a política de privacidade.
  var GRANTED = { analytics_storage: 'granted' };
  var DENIED = { analytics_storage: 'denied' };

  var doc = document;
  var root = doc.documentElement;
  var me = doc.currentScript;
  var en = /^en\b/i.test(root.getAttribute('lang') || '');

  var T = en ? {
    region: 'Cookie notice',
    title: 'Cookies',
    text: 'We use Google Analytics cookies to understand, in aggregate, how this site is used. They are only enabled if you accept.',
    link: 'Privacy policy',
    policy: '../en/privacy-policy.html',
    deny: 'Decline',
    accept: 'Accept',
    granted: 'Your current choice: Google Analytics cookies accepted.',
    denied: 'Your current choice: Google Analytics cookies declined.',
    none: 'You have not made a choice yet.'
  } : {
    region: 'Aviso de cookies',
    title: 'Cookies',
    text: 'Usamos cookies do Google Analytics para entender, de forma agregada, como o site é utilizado. Eles só são ativados se você aceitar.',
    link: 'Política de privacidade',
    policy: '../politica-de-privacidade.html',
    deny: 'Recusar',
    accept: 'Aceitar',
    granted: 'Sua escolha atual: cookies do Google Analytics aceitos.',
    denied: 'Sua escolha atual: cookies do Google Analytics recusados.',
    none: 'Você ainda não fez uma escolha.'
  };

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function read() {
    try {
      var c = JSON.parse(window.localStorage.getItem(KEY));
      if (c && c.v === VERSION && (c.analytics === 'granted' || c.analytics === 'denied') &&
          typeof c.ts === 'number' && c.ts <= Date.now() && Date.now() - c.ts < MAX_AGE) {
        return c.analytics;
      }
    } catch (e) { /* armazenamento indisponível */ }
    return null;
  }

  function write(state) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: VERSION, analytics: state, ts: Date.now() }));
    } catch (e) { /* armazenamento bloqueado: a escolha vale só para esta página */ }
  }

  // Apaga os cookies do Google Analytics (_ga, _ga_<ID>) no domínio atual e nos superiores.
  function clearCookies() {
    var names = doc.cookie.split(';').map(function (c) {
      return c.split('=')[0].trim();
    }).filter(function (n) {
      return /^_ga($|_)|^_gid$|^_gat/.test(n);
    });
    if (!names.length) return;
    var parts = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) domains.push('; domain=.' + parts.slice(i).join('.'));
    names.forEach(function (n) {
      domains.forEach(function (d) {
        doc.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
      });
    });
  }

  function policyHref() {
    try { return new URL(T.policy, me.src).href; } catch (e) { return T.policy.replace('../', '/'); }
  }

  var current = read();
  var box = null;

  function status() {
    var st = doc.getElementById('ck-status');
    if (st) st.textContent = current === 'granted' ? T.granted : current === 'denied' ? T.denied : T.none;
  }

  function choose(state) {
    current = state;
    write(state);
    gtag('consent', 'update', state === 'granted' ? GRANTED : DENIED);
    if (state === 'denied') clearCookies();
    hide();
    status();
  }

  function button(label, state) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'ck__btn';
    b.textContent = label;
    b.addEventListener('click', function () { choose(state); });
    return b;
  }

  function build() {
    var el = doc.createElement('div');
    el.className = 'ck';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', T.region);

    var k = doc.createElement('span');
    k.className = 'label on-dark';
    k.textContent = T.title;

    var p = doc.createElement('p');
    p.className = 'ck__t';
    p.appendChild(doc.createTextNode(T.text + ' '));
    var a = doc.createElement('a');
    a.href = policyHref();
    a.textContent = T.link;
    p.appendChild(a);
    p.appendChild(doc.createTextNode('.'));

    var row = doc.createElement('div');
    row.className = 'ck__b';
    row.appendChild(button(T.deny, 'denied'));
    row.appendChild(button(T.accept, 'granted'));

    el.appendChild(k);
    el.appendChild(p);
    el.appendChild(row);
    return el;
  }

  // No celular o aviso ocupa a largura toda: reserva espaço no fim da página.
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 520px)') : null;
  function pad() {
    if (!box) return;
    var full = narrow ? narrow.matches : window.innerWidth <= 520;
    root.classList.toggle('ck-pad', full);
    root.style.setProperty('--ck-h', box.offsetHeight + 'px');
  }

  function show(focus) {
    if (!box) {
      box = build();
      doc.body.insertBefore(box, doc.body.firstChild);
      pad();
      window.addEventListener('resize', pad);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (box) box.classList.add('ck--on'); });
      });
    }
    if (focus) box.querySelector('button').focus();
  }

  function hide() {
    if (!box) return;
    var el = box;
    box = null;
    window.removeEventListener('resize', pad);
    root.classList.remove('ck-pad');
    root.style.removeProperty('--ck-h');
    el.classList.remove('ck--on');
    el.setAttribute('aria-hidden', 'true');
    if (el.contains(doc.activeElement)) {
      var back = doc.getElementById('ck-open');
      if (back) back.focus(); else doc.activeElement.blur();
    }
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
  }

  function init() {
    var prefs = doc.getElementById('ck-prefs');
    if (prefs) {
      prefs.hidden = false;
      var open = doc.getElementById('ck-open');
      if (open) open.addEventListener('click', function () { show(true); });
    }
    status();
    if (!current) show(false);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
