/* Comportamento comum a todas as páginas: ano do rodapé, cabeçalho, menu no celular,
   animação de entrada das seções e medição dos cliques de contato (WhatsApp, e-mail, telefone). */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js', 'js-ready');

  var yr = d.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  var hdr = d.getElementById('hdr'), ticking = false;
  function onScroll() {
    if (ticking || !hdr) return;
    ticking = true;
    requestAnimationFrame(function () {
      hdr.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    });
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var nav = d.getElementById('nav'), burger = d.getElementById('burger');
  var en = /^en\b/i.test(root.getAttribute('lang') || '');
  function setMenu(open) {
    if (!nav || !burger) return;
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    if (hdr) hdr.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? (en ? 'Close menu' : 'Fechar menu') : (en ? 'Open menu' : 'Abrir menu'));
  }
  if (nav && burger) {
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    d.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setMenu(false); });
  }

  var pending = [].slice.call(d.querySelectorAll('.reveal'));
  pending.forEach(function (el) {
    var sibs = [].slice.call(el.parentNode.children).filter(function (n) {
      return n.classList && n.classList.contains('reveal');
    });
    var i = Math.min(Math.max(sibs.indexOf(el), 0), 5);
    if (i > 0) el.style.transitionDelay = (i * 90) + 'ms';
  });
  var sweeping = false;
  function sweep() {
    if (sweeping) return;
    sweeping = true;
    requestAnimationFrame(function () {
      var limit = window.innerHeight * 0.92;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
        return true;
      });
      sweeping = false;
      if (!pending.length) {
        window.removeEventListener('scroll', sweep);
        window.removeEventListener('resize', sweep);
      }
    });
  }
  sweep();
  window.addEventListener('scroll', sweep, { passive: true });
  window.addEventListener('resize', sweep);
  window.addEventListener('load', sweep);

  // Medição de contatos: cada clique em WhatsApp, e-mail ou telefone gera o evento
  // "generate_lead" no Google Analytics 4, que pode ser importado como conversão no Google Ads.
  // Sem consentimento, o Consent Mode envia apenas um sinal sem cookies.
  d.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || typeof window.gtag !== 'function') return;
    var h = a.getAttribute('href') || '', via = null;
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(h)) via = 'whatsapp';
    else if (/^mailto:/i.test(h)) via = 'email';
    else if (/^tel:/i.test(h)) via = 'telefone';
    if (!via) return;
    var place = a.closest('.hdr') ? 'cabecalho'
      : a.closest('.hero, .art-hero') ? 'topo'
      : a.closest('.art-cta, .cbox, .contact') ? 'chamada'
      : a.closest('.ft') ? 'rodape' : 'texto';
    window.gtag('event', 'generate_lead', {
      lead_source: via,
      link_location: place,
      link_url: h.split('?')[0]
    });
  }, true);
})();
