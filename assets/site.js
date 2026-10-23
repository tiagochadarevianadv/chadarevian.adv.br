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

  // Barra de contato fixa (só no celular, pelo CSS): aparece quando os botões do topo saem da
  // tela e some quando a chamada do fim do texto ou o rodapé aparecem, para não repetir botões.
  var bar = d.getElementById('sticky-cta');
  if (bar && 'IntersectionObserver' in window) {
    var topCta = d.querySelector('.art-hero .hero__cta, .hero .hero__cta');
    var topVisible = !!topCta, seen = {};
    var upd = function () {
      var endVisible = Object.keys(seen).some(function (k) { return seen[k]; });
      bar.classList.toggle('is-on', !topVisible && !endVisible);
    };
    if (topCta) {
      new IntersectionObserver(function (es) {
        topVisible = es[es.length - 1].isIntersecting; upd();
      }).observe(topCta);
    }
    var endObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target.getAttribute('data-end')] = e.isIntersecting; });
      upd();
    });
    [].slice.call(d.querySelectorAll('.art-cta, .ft')).forEach(function (el, i) {
      el.setAttribute('data-end', 'e' + i);
      endObs.observe(el);
    });
    upd();
  }

  // Visita vinda de anúncio do Google (gclid, gbraid, wbraid ou gad_source no endereço desta página
  // ou da página anterior do próprio site; ou cookie do Google Ads, que só existe com consentimento):
  // a mensagem pronta do WhatsApp passa a dizer "Vim pelo Google" em vez de "Vim pelo site". Assim os
  // contatos gerados pelos anúncios podem ser contados na própria conversa, inclusive os de quem não
  // aceitou cookies. Nada é gravado no aparelho do visitante.
  var AD = /[?&](gclid|gbraid|wbraid|gad_source)=|[?&]utm_medium=(cpc|ppc|paid)(&|$)/i;
  var fromAd = AD.test(location.search);
  if (!fromAd && d.referrer) {
    try {
      var ref = new URL(d.referrer);
      fromAd = ref.origin === location.origin && AD.test(ref.search);
    } catch (err) {}
  }
  if (!fromAd) fromAd = /(?:^|;\s*)_gcl_(?:aw|gb)=/.test(d.cookie);
  if (fromAd) {
    [].slice.call(d.querySelectorAll('a[href^="https://wa.me/"]')).forEach(function (a) {
      var h = a.getAttribute('href'), i = h.indexOf('?text='), t;
      if (i < 0) {
        t = en ? 'Hello! I found you on Google and would like to get in touch.'
          : 'Olá! Vim pelo Google e gostaria de falar com o escritório.';
        a.setAttribute('href', h + '?text=' + encodeURIComponent(t));
      } else {
        t = decodeURIComponent(h.slice(i + 6))
          .replace('Vim pelo site', 'Vim pelo Google')
          .replace('I found your website', 'I found you on Google');
        a.setAttribute('href', h.slice(0, i) + '?text=' + encodeURIComponent(t));
      }
    });
  }

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
    var place = a.closest('.sticky-cta') ? 'barra-fixa'
      : a.closest('.hdr') ? 'cabecalho'
      : a.closest('.hero, .art-hero') ? 'topo'
      : a.closest('.art-cta, .cbox, .contact') ? 'chamada'
      : a.closest('.cta-inline') ? 'meio-do-texto'
      : a.closest('.ft') ? 'rodape' : 'texto';
    window.gtag('event', 'generate_lead', {
      lead_source: via,
      link_location: place,
      link_url: h.split('?')[0]
    });
  }, true);
})();
