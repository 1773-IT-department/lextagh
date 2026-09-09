/* Lexta Ghana — mobile top bar + hamburger drawer. Injected once, outside the React tree. */
(function () {
  if (window.__lxMobileNav) return;
  window.__lxMobileNav = true;

  var LINKS = [
    ['Home', './Lexta%20Ghana%20Home.dc.html'],
    ['About Us', './About%20Us.dc.html'],
    ['Our Brands', './Our%20Brands.dc.html'],
    ['People & Culture', './People%20&%20Culture.dc.html'],
    ['CSR', './Corporate%20Social%20Responsibility.dc.html'],
    ['News', './News.dc.html'],
    ['Careers', './Careers.dc.html'],
    ['FAQs', './FAQs.dc.html']
  ];

  var here = '';
  try { here = decodeURIComponent(location.pathname.split('/').pop() || ''); } catch (e) {}

  function el(tag, style, html) {
    var n = document.createElement(tag);
    if (style) n.setAttribute('style', style);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    if (document.querySelector('[data-lxm-bar]')) return;

    var bar = el('div', 'display:none;position:fixed;top:0;left:0;right:0;height:58px;z-index:200;background:#fff;box-shadow:0 1px 0 rgba(10,55,70,.1);align-items:center;justify-content:space-between;padding:0 16px');
    bar.setAttribute('data-lxm-bar', '1');

    var home = el('a', 'display:flex;align-items:center');
    home.href = './Lexta%20Ghana%20Home.dc.html';
    var logo = el('img', 'height:36px;width:auto;display:block');
    logo.src = './assets/lexta-logo.png';
    logo.alt = 'Lexta';
    home.appendChild(logo);

    var burger = el('button', 'width:44px;height:44px;display:flex;flex-direction:column;justify-content:center;gap:5px;padding:0 10px;border:0;background:transparent;cursor:pointer');
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Open menu');
    burger.setAttribute('aria-expanded', 'false');
    for (var b = 0; b < 3; b++) burger.appendChild(el('span', 'display:block;height:2px;width:100%;background:#12313d;border-radius:2px;transition:transform .25s ease,opacity .2s ease'));

    bar.appendChild(home);
    bar.appendChild(burger);

    var scrim = el('div', 'position:fixed;inset:0;z-index:210;background:rgba(6,32,42,.55);opacity:0;pointer-events:none;transition:opacity .28s ease');
    scrim.setAttribute('data-lxm-scrim', '1');

    var panel = el('div', 'position:fixed;top:0;right:0;bottom:0;width:min(330px,86vw);z-index:220;background:#fff;box-shadow:-14px 0 40px rgba(6,32,42,.28);transform:translateX(104%);transition:transform .32s cubic-bezier(.3,.7,.2,1);display:flex;flex-direction:column;overflow-y:auto');
    panel.setAttribute('data-lxm-panel', '1');

    var head = el('div', 'display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e6f1f5');
    var hlogo = el('img', 'height:34px;width:auto;display:block');
    hlogo.src = './assets/lexta-logo.png';
    hlogo.alt = 'Lexta';
    head.appendChild(hlogo);
    var close = el('button', 'width:38px;height:38px;border:0;border-radius:9px;background:#f2f9fb;color:#12313d;font-size:18px;line-height:1;cursor:pointer', '&times;');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close menu');
    head.appendChild(close);
    panel.appendChild(head);

    var list = el('nav', 'display:flex;flex-direction:column;padding:8px 18px 4px');
    LINKS.forEach(function (l) {
      var current = here && decodeURIComponent(l[1].replace('./', '')) === here;
      var a = el('a', 'font-size:15px;font-weight:' + (current ? '700' : '500') + ';color:' + (current ? '#12a3c4' : '#1d3c48') + ';padding:15px 2px;border-bottom:1px solid #eef5f8;min-height:48px;display:flex;align-items:center', l[0]);
      a.href = l[1];
      list.appendChild(a);
    });
    panel.appendChild(list);

    var ctas = el('div', 'display:flex;flex-direction:column;gap:10px;padding:20px 18px 26px');
    var c1 = el('a', 'display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:9px;background:#12a3c4;color:#fff;font-size:14px;font-weight:700', 'Contact Us');
    c1.href = './Contact%20Us.dc.html';
    var c2 = el('a', 'display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:9px;border:1px solid rgba(18,163,196,.45);color:#12a3c4;font-size:14px;font-weight:600', 'Partner With Us');
    c2.href = './Partner%20With%20Us.dc.html';
    ctas.appendChild(c1);
    ctas.appendChild(c2);

    var contact = el('div', 'margin-top:auto;padding:18px;border-top:1px solid #eef5f8;font-size:12px;line-height:1.7;color:#5d7883', 'Lexta Square, Dzorwulu, Accra<br>+233 (0) 501 619 588<br>support@lextagh.com');
    panel.appendChild(ctas);
    panel.appendChild(contact);

    document.body.appendChild(bar);
    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    var open = false;
    function set(v) {
      open = v;
      panel.style.transform = v ? 'translateX(0)' : 'translateX(104%)';
      scrim.style.opacity = v ? '1' : '0';
      scrim.style.pointerEvents = v ? 'auto' : 'none';
      document.documentElement.style.overflow = v ? 'hidden' : '';
      burger.setAttribute('aria-expanded', v ? 'true' : 'false');
      var s = burger.children;
      s[0].style.transform = v ? 'translateY(7px) rotate(45deg)' : 'none';
      s[1].style.opacity = v ? '0' : '1';
      s[2].style.transform = v ? 'translateY(-7px) rotate(-45deg)' : 'none';
    }
    set(false);

    burger.addEventListener('click', function () { set(!open); });
    close.addEventListener('click', function () { set(false); });
    scrim.addEventListener('click', function () { set(false); });
    panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900 && open) set(false); });
  }

  if (document.body) build();
  else document.addEventListener('DOMContentLoaded', build);
})();
