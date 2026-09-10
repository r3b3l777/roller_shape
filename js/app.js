/* ═══════════════════════════════════════════════════════════════
   Roller Shape Studio — behaviour layer
   Defensive by design: every enhancement degrades to plain HTML.
═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var root = document.documentElement;
root.classList.remove('no-js');

function mq(q){ return window.matchMedia ? window.matchMedia(q) : {matches:false,addEventListener:function(){}}; }
var mReduce = mq('(prefers-reduced-motion: reduce)');
var mCoarse = mq('(hover: none), (pointer: coarse)');
var reduce  = mReduce.matches;
var coarse  = mCoarse.matches;
var hasIO   = 'IntersectionObserver' in window;

/* ── LOADER — three independent ways out, so it can never trap the page ── */
(function(){
  var loader = document.getElementById('loader');
  if(!loader) return;
  var done = false;
  function hide(){ if(done) return; done = true; loader.classList.add('out');
                   setTimeout(function(){ loader.setAttribute('hidden',''); }, 900); }
  if(reduce){ hide(); return; }
  var pct = 0;
  var iv = setInterval(function(){
    pct = Math.min(pct + Math.random()*14, 99);
    if(pct >= 99){ clearInterval(iv); setTimeout(hide, 500); }
  }, 90);
  window.addEventListener('load', function(){ setTimeout(hide, 700); });
  setTimeout(function(){ clearInterval(iv); hide(); }, 4500);   // hard ceiling
})();

/* ── CUSTOM CURSOR — desktop pointers only ────────────────────── */
(function(){
  var cd = document.getElementById('cd'), cr = document.getElementById('cr');
  if(!cd || !cr) return;
  function disable(){
    if(cd.parentNode) cd.parentNode.removeChild(cd);
    if(cr.parentNode) cr.parentNode.removeChild(cr);
    document.body.classList.add('cursor-native');
  }
  if(coarse || reduce){ disable(); return; }
  // A touch on a hybrid device (Surface, touchscreen laptop) hands control back.
  window.addEventListener('touchstart', disable, {once:true, passive:true});
  var mx=0,my=0,rx=0,ry=0,seen=false;
  document.addEventListener('mousemove', function(e){
    mx = e.clientX; my = e.clientY;
    cd.style.left = mx+'px'; cd.style.top = my+'px';
    if(!seen){ seen = true; rx = mx; ry = my; }
  }, {passive:true});
  // El bucle se dormía nunca: escribía dos propiedades y forzaba un
  // recálculo de estilo en CADA frame de la vida de la página, scroll
  // incluido. Ahora para cuando el anillo alcanzó al cursor y lo
  // despierta el propio movimiento del ratón.
  var vivo = false;
  function loop(){
    var dx = mx-rx, dy = my-ry;
    rx += dx*0.16; ry += dy*0.16;
    cr.style.left = rx+'px'; cr.style.top = ry+'px';
    if(Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1){ vivo = false; return; }
    requestAnimationFrame(loop);
  }
  function despertar(){ if(!vivo){ vivo = true; requestAnimationFrame(loop); } }
  document.addEventListener('mousemove', despertar, {passive:true});
  despertar();

  // Sustituye al selector :has() que había en el CSS: delegación en el
  // documento, y la clase se pone en el anillo, no en <body>.
  function sobre(e){
    var t = e.target;
    cr.classList.toggle('is-over', !!(t && t.closest && t.closest('a,button')));
  }
  document.addEventListener('mouseover', sobre, {passive:true});
  document.addEventListener('mouseout',  sobre, {passive:true});
})();

/* ── NAV: compacta, se retira al bajar y vuelve al subir ───────── */
(function(){
  var nav = document.getElementById('nav');
  if(!nav) return;
  var ticking = false, last = window.pageYOffset;
  function update(){
    ticking = false;
    var y = window.pageYOffset;
    nav.classList.toggle('scrolled', y > 60);

    var delta = y - last;
    if(Math.abs(delta) < 6) return;   // ignora el temblor del trackpad
    last = y;
    if(reduce) return;
    // Con el menú abierto o cerca del inicio, la barra siempre a la vista.
    if(y < 120 || document.body.classList.contains('menu-open')){
      nav.classList.remove('hidden'); return;
    }
    nav.classList.toggle('hidden', delta > 0);
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  // Al enfocar por teclado dentro de la barra, nunca escondida.
  nav.addEventListener('focusin', function(){ nav.classList.remove('hidden'); });
  update();
})();

/* ── NAV: sección en pantalla ("¿dónde estoy?") ────────────────── */
(function(){
  var links = document.querySelectorAll('.nav-center a[href^="#"], .nav-mobile a[href^="#"]');
  if(!links.length || !hasIO) return;
  var byId = {}, order = [];
  Array.prototype.forEach.call(links, function(a){
    var id = a.getAttribute('href').slice(1);
    if(!byId[id]){ byId[id] = []; order.push(id); }
    byId[id].push(a);
  });
  var visible = [];
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(x){
      var i = visible.indexOf(x.target.id);
      if(x.isIntersecting){ if(i < 0) visible.push(x.target.id); }
      else if(i >= 0){ visible.splice(i, 1); }
    });
    // Por orden del documento, no de llegada: al subir rápido las entradas
    // llegan desordenadas y la marca parpadearía entre secciones.
    visible.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
    Array.prototype.forEach.call(links, function(a){ a.removeAttribute('data-current'); });
    var now = visible[0];
    if(now && byId[now]) byId[now].forEach(function(a){ a.setAttribute('data-current',''); });
  }, {rootMargin:'-72px 0px -55% 0px'});
  order.forEach(function(id){
    var sec = document.getElementById(id);
    if(sec) io.observe(sec);
  });
})();

/* ── MOBILE MENU: aria state, Esc, outside tap, scroll lock ───── */
var closeMobile;
(function(){
  var ham = document.getElementById('nav-ham');
  var mob = document.getElementById('nav-mobile');
  if(!ham || !mob){ closeMobile = function(){}; return; }

  function setOpen(open){
    mob.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('menu-open', open);
  }
  closeMobile = function(){ setOpen(false); };

  ham.setAttribute('aria-expanded','false');
  ham.setAttribute('aria-controls','nav-mobile');
  ham.addEventListener('click', function(e){
    e.stopPropagation();
    setOpen(!mob.classList.contains('open'));
  });
  mob.addEventListener('click', function(e){
    if(e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('click', function(e){
    if(mob.classList.contains('open') && !mob.contains(e.target) && !ham.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && mob.classList.contains('open')){ setOpen(false); ham.focus(); }
  });
  // Rotating a phone or resizing a window must not strand an open overlay.
  window.addEventListener('resize', function(){
    if(window.innerWidth > 1100) setOpen(false);
  });
  window.addEventListener('orientationchange', function(){ setOpen(false); });
})();
window.closeMobile = closeMobile;

/* ── SCROLL REVEALS ───────────────────────────────────────────── */
(function(){
  var els = document.querySelectorAll('.rv, .sc');
  function showAll(){ Array.prototype.forEach.call(els, function(el){ el.classList.add('in'); }); }
  if(reduce || !hasIO){ showAll(); return; }   // no IO (old WebView) → just show it
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(x){
      if(x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); }
    });
  }, {threshold:0.12, rootMargin:'0px 0px -5% 0px'});
  Array.prototype.forEach.call(els, function(el){ io.observe(el); });
  // Anything still hidden after first paint (short viewports, print) gets revealed.
  window.addEventListener('load', function(){
    setTimeout(function(){
      Array.prototype.forEach.call(els, function(el){
        var r = el.getBoundingClientRect();
        if(r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 300);
  });
})();

/* ── STAT COUNTERS ────────────────────────────────────────────── */
(function(){
  var nums = document.querySelectorAll('.sc-n');
  if(!nums.length) return;
  function fill(el){
    var m = el.textContent.match(/[\d,]+/); if(!m) return;
    var target = parseFloat(m[0].replace(/,/g,''));
    var sup = el.querySelector('sup');
    var supHTML = sup ? sup.outerHTML : '';
    if(reduce){ el.innerHTML = target.toLocaleString('es-MX') + supHTML; return; }
    var start = null, dur = 1400;
    function step(ts){
      if(start === null) start = ts;
      var p = Math.min((ts-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      el.innerHTML = Math.round(target*eased).toLocaleString('es-MX') + supHTML;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if(!hasIO){ Array.prototype.forEach.call(nums, fill); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(x){ if(x.isIntersecting){ fill(x.target); io.unobserve(x.target); } });
  }, {threshold:0.5});
  Array.prototype.forEach.call(nums, function(n){ io.observe(n); });
})();

/* ── EQUIPOS RAIL: drag on desktop, native swipe on touch, keys ─ */
(function(){
  var track = document.getElementById('eq-track');
  if(!track) return;

  track.setAttribute('tabindex','0');
  track.setAttribute('role','region');
  track.setAttribute('aria-label','Equipos — desliza horizontalmente');

  // Keyboard access (macOS/Windows) for a control that was mouse-drag only.
  track.addEventListener('keydown', function(e){
    var card = track.querySelector('.ec');
    var stepPx = card ? card.getBoundingClientRect().width + 1 : 320;
    if(e.key === 'ArrowRight'){ e.preventDefault(); track.scrollBy({left: stepPx, behavior: reduce?'auto':'smooth'}); }
    if(e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({left:-stepPx, behavior: reduce?'auto':'smooth'}); }
  });

  // Alternativa de un solo puntero al arrastre, que WCAG 2.2 AA exige.
  // La crea el JS: sin JS no aparecen botones que no harían nada.
  (function(){
    var head = track.parentNode;
    var flecha = function(d){
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M' +
             (d < 0 ? '15 5l-7 7 7 7' : '9 5l7 7-7 7') + '"/></svg>';
    };
    var nav = document.createElement('div');
    nav.className = 'eq-nav';
    function boton(d, etiqueta){
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'eq-nav-btn';
      b.setAttribute('aria-label', etiqueta);
      b.setAttribute('aria-controls', 'eq-track');
      b.innerHTML = flecha(d);
      b.addEventListener('click', function(){
        var card = track.querySelector('.ec');
        var step = card ? card.getBoundingClientRect().width + 1 : 320;
        track.scrollBy({left: d * step, behavior: reduce ? 'auto' : 'smooth'});
      });
      return b;
    }
    var prev = boton(-1, 'Equipos anteriores'), next = boton(1, 'Equipos siguientes');
    nav.appendChild(prev); nav.appendChild(next);
    head.insertBefore(nav, track.nextSibling);
    function limites(){
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    }
    track.addEventListener('scroll', limites, {passive:true});
    window.addEventListener('resize', limites);
    limites();
  })();

  if(coarse) return;   // en táctil el scroll nativo ya trae su propia inercia

  /* Arrastre con inercia.
     Sin esto el carril se paraba en seco al soltar: el gesto traía impulso
     y la animación lo tiraba a la basura. Se guarda la velocidad de los
     últimos milisegundos, se proyecta dónde acabaría el desplazamiento y
     se anima hasta ahí. La función de proyección es la de Apple
     (Designing Fluid Interfaces), no la de v²/2a de los libros. */
  var down = false, startX = 0, startLeft = 0, moved = 0;
  var lastX = 0, lastT = 0, vel = 0, raf = 0;

  function proyectar(v, decel){        // v en px/s
    decel = decel || 0.996;            // 0.998 = scroll normal; aquí algo más corto
    return (v / 1000) * decel / (1 - decel);
  }

  function inercia(v0){
    cancelAnimationFrame(raf);
    var max = track.scrollWidth - track.clientWidth;
    var destino = Math.max(0, Math.min(max, track.scrollLeft - proyectar(v0)));
    var desde = track.scrollLeft, dist = destino - desde;
    if(Math.abs(dist) < 1) return;
    // Muelle críticamente amortiguado: sin rebote, y arranca a la velocidad
    // exacta del dedo para que no se note la costura entre arrastre y animación.
    var t0 = null, dur = Math.min(900, 260 + Math.abs(dist) * 0.55);
    function paso(ts){
      if(t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);   // salida cúbica: llega y se asienta
      track.scrollLeft = desde + dist * e;
      if(p < 1) raf = requestAnimationFrame(paso);
    }
    raf = requestAnimationFrame(paso);
  }

  track.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'touch') return;
    cancelAnimationFrame(raf);          // §3: se puede agarrar en pleno vuelo
    down = true; moved = 0; vel = 0;
    startX = lastX = e.clientX; startLeft = track.scrollLeft;
    lastT = performance.now();
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', function(e){
    if(!down) return;
    var dx = e.clientX - startX;
    moved = Math.abs(dx);
    if(moved > 4) track.classList.add('dragging');
    track.scrollLeft = startLeft - dx;   // 1:1 con el puntero, todo el recorrido
    var now = performance.now(), dt = now - lastT;
    if(dt > 0){
      // Media móvil: una sola muestra da saltos y la inercia sale errática.
      vel = 0.7 * ((e.clientX - lastX) / dt * 1000) + 0.3 * vel;
      lastX = e.clientX; lastT = now;
    }
  });
  function end(e){
    if(!down) return;
    down = false;
    try{ track.releasePointerCapture(e.pointerId); }catch(_){}
    setTimeout(function(){ track.classList.remove('dragging'); }, 0);
    // Si el dedo se quedó quieto antes de soltar, no hay impulso que continuar.
    if(!reduce && Math.abs(vel) > 60 && performance.now() - lastT < 90) inercia(vel);
  }
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('dragstart', function(e){ e.preventDefault(); });
})();

/* ── TICKER: duplicate once, and only when motion is welcome ──── */
(function(){
  var t = document.querySelector('.ticker-track');
  if(!t || t.dataset.doubled) return;
  if(reduce){ t.style.animation = 'none'; return; }
  t.dataset.doubled = '1';
  t.innerHTML += t.innerHTML;
  t.setAttribute('aria-hidden','true');   // decorative; screen readers skip it
})();

/* ── Motion preference can change while the page is open ──────── */
if(mReduce.addEventListener){
  mReduce.addEventListener('change', function(){ location.reload(); });
}

})();

/* ═══════════════════════════════════════════════════════════════
   HOJA MODAL — pieza compartida
   Hoja inferior en móvil (se arrastra para cerrar), tarjeta centrada
   en escritorio. La usan la hoja de pago y la de reserva; escribirla
   dos veces sería mantener dos veces la trampa de foco y el arrastre.
═══════════════════════════════════════════════════════════════ */
var RSHoja = (function(){
  'use strict';
  var reduce = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // textContent siempre: nunca innerHTML, ni siquiera con datos propios.
  function el(tag, cls, texto){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(texto != null) e.textContent = texto;
    return e;
  }

  // Un solo helper de SVG: nada de innerHTML para pintar iconos.
  function svgTrazo(d){
    var ns='http://www.w3.org/2000/svg';
    var s=document.createElementNS(ns,'svg');
    s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true');
    var p=document.createElementNS(ns,'path'); p.setAttribute('d',d);
    s.appendChild(p); return s;
  }

  function crear(opts){
    var capa = el('div', 'rs-sheet-layer');
    capa.id = opts.id;
    capa.setAttribute('role','dialog');
    capa.setAttribute('aria-modal','true');
    capa.setAttribute('aria-labelledby', opts.id + '-title');
    if(opts.ancho) capa.setAttribute('data-ancho', opts.ancho);

    var scrim = el('div','pay-scrim');
    var hoja  = el('div','pay-sheet');
    var grip  = el('div','pay-grip');
    grip.setAttribute('aria-hidden','true');
    var cuerpo = el('div','pay-body');

    // Cerrar con teclado sin depender del arrastre ni del scrim.
    var cerrarBtn = el('button','pay-x');
    cerrarBtn.type = 'button';
    cerrarBtn.setAttribute('aria-label','Cerrar');
    cerrarBtn.appendChild(svgTrazo('M6 6l12 12M18 6L6 18'));

    hoja.appendChild(grip); hoja.appendChild(cerrarBtn); hoja.appendChild(cuerpo);
    capa.appendChild(scrim); capa.appendChild(hoja);
    document.body.appendChild(capa);

    var focoPrevio = null, cerrando = false;

    function abrir(origen){
      if(capa.hasAttribute('data-open')) return;
      focoPrevio = origen || document.activeElement;
      capa.setAttribute('data-open','');
      document.body.classList.add('menu-open');     // congela el fondo
      // Un reflow forzado fija el estado inicial antes de cambiarlo, que
      // es lo que hace arrancar la transición. Con requestAnimationFrame
      // esto se quedaba a medias si la pestaña no tenía el foco.
      void hoja.offsetHeight;
      capa.setAttribute('data-in','');
      var f = (opts.focoInicial && opts.focoInicial()) || cerrarBtn;
      if(f && f.focus) f.focus({preventScroll:true});
      if(opts.alAbrir) opts.alAbrir();
    }

    function cerrar(){
      if(cerrando || !capa.hasAttribute('data-open')) return;
      cerrando = true;
      hoja.classList.remove('dragging');
      hoja.style.transform = '';        // devuelve el mando al CSS
      capa.removeAttribute('data-in');
      document.body.classList.remove('menu-open');
      var fin = function(){
        capa.removeAttribute('data-open');
        cerrando = false;
        if(opts.alCerrar) opts.alCerrar();
        if(focoPrevio && focoPrevio.focus) focoPrevio.focus({preventScroll:true});
      };
      reduce ? fin() : setTimeout(fin, 420);
    }

    scrim.addEventListener('click', cerrar);
    cerrarBtn.addEventListener('click', cerrar);

    document.addEventListener('keydown', function(e){
      if(!capa.hasAttribute('data-open')) return;
      if(e.key === 'Escape'){ e.preventDefault(); cerrar(); return; }
      if(e.key !== 'Tab') return;
      // Un diálogo modal no suelta el tabulador a la página de atrás.
      var f = hoja.querySelectorAll('button:not([disabled]),a[href],iframe,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if(!f.length) return;
      var pri = f[0], ult = f[f.length-1];
      if(e.shiftKey && document.activeElement === pri){ e.preventDefault(); ult.focus(); }
      else if(!e.shiftKey && document.activeElement === ult){ e.preventDefault(); pri.focus(); }
    });

    /* Arrastre para cerrar.
       Sigue al dedo 1:1 y al soltar decide por la VELOCIDAD proyectada,
       no por dónde quedó: un tirón corto y rápido cierra; bajarla despacio
       hasta media pantalla y frenar la devuelve a su sitio. Eso es lo que
       la hace sentir un objeto en vez de un menú que aparece. */
    if(!reduce) (function(){
      var y0=0, y=0, vel=0, ultY=0, ultT=0, activo=false, alto=0;
      // Más allá del tope, menos sigue: lo real frena antes de parar.
      function goma(over, dim){ return (over*dim*0.55)/(dim + 0.55*Math.abs(over)); }
      // Proyección de Apple (Designing Fluid Interfaces), no v²/2a.
      function proyectar(v){ return (v/1000)*0.996/(1-0.996); }

      grip.addEventListener('pointerdown', function(e){
        if(!capa.hasAttribute('data-open') || cerrando) return;
        activo=true; y0=e.clientY; y=0; vel=0;
        ultY=e.clientY; ultT=performance.now();
        alto=hoja.offsetHeight||1;
        hoja.classList.add('dragging');
        grip.setPointerCapture(e.pointerId);
      });
      grip.addEventListener('pointermove', function(e){
        if(!activo) return;
        var d = e.clientY - y0;
        y = d >= 0 ? d : -goma(-d, alto);   // hacia arriba: resistencia
        hoja.style.transform = 'translateY(' + y + 'px)';
        var t=performance.now(), dt=t-ultT;
        if(dt>0){ vel = 0.7*((e.clientY-ultY)/dt*1000) + 0.3*vel; ultY=e.clientY; ultT=t; }
      });
      function soltar(e){
        if(!activo) return;
        activo=false;
        try{ grip.releasePointerCapture(e.pointerId); }catch(_){}
        hoja.classList.remove('dragging');
        var destino = y + proyectar(vel);
        hoja.style.transform = '';
        if(vel > 350 || destino > alto*0.42) cerrar();
      }
      grip.addEventListener('pointerup', soltar);
      grip.addEventListener('pointercancel', soltar);
    })();

    return {capa:capa, hoja:hoja, cuerpo:cuerpo, abrir:abrir, cerrar:cerrar,
            tituloId: opts.id + '-title', el:el, reduce:reduce};
  }

  return {crear:crear, el:el, svgTrazo:svgTrazo, reduce:reduce};
})();

/* ═══════════════════════════════════════════════════════════════
   HOJA DE PAGO
   El cobro ocurre en Stripe, no aquí. Esta hoja solo elige paquete y
   redirige. Ni un campo de tarjeta vive en este sitio: los datos van
   del navegador a Stripe sin pasar por aquí, así que no hay nada que
   filtrar, nada que almacenar y nada que cumplir de PCI más allá del
   nivel más bajo. Sin JS o sin enlaces, los botones siguen a Setmore.
═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var CFG = window.RS_PAGOS;
  if(!CFG || !CFG.planes) return;
  var disparadores = document.querySelectorAll('[data-plan]');
  if(!disparadores.length) return;

  var el = RSHoja.el;
  var precio = function(n){ return '$' + Number(n).toLocaleString('es-MX'); };

  var H = RSHoja.crear({id:'pay', ancho:'chica',
    focoInicial: function(){ return lista.querySelector('.pay-opt[aria-checked="true"]'); }});
  var c = H.cuerpo;

  var head    = el('div','pay-head');
  var eyebrow = el('span','pay-eyebrow');
  var titulo  = el('h2','pay-title'); titulo.id = H.tituloId;
  head.appendChild(eyebrow); head.appendChild(titulo);

  var lista  = el('ul','pay-opts');
  lista.setAttribute('role','radiogroup');
  lista.setAttribute('aria-label','Elige tu paquete');

  var total  = el('div','pay-total');
  var totalV = el('span','pay-total-v','—');
  total.appendChild(el('span','pay-total-l','Total'));
  total.appendChild(totalV);

  var cta = el('button','pay-cta','Continuar al pago seguro'); cta.type='button';
  var alt = el('button','pay-alt','Prefiero reservar y pagar en el studio'); alt.type='button';

  // Los métodos se anuncian ANTES del clic: nadie debería descubrir en
  // la pasarela que su forma de pago no estaba.
  var metodos = el('div','pay-methods');
  ['Apple Pay','Google Pay','Visa','Mastercard','AMEX'].forEach(function(m){
    metodos.appendChild(el('span','pay-badge', m));
  });

  var safe = el('div','pay-safe');
  var esc = document.createElementNS('http://www.w3.org/2000/svg','svg');
  esc.setAttribute('viewBox','0 0 24 24'); esc.setAttribute('aria-hidden','true');
  var pp = document.createElementNS('http://www.w3.org/2000/svg','path');
  pp.setAttribute('d','M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z');
  pp.setAttribute('stroke-linejoin','round');
  esc.appendChild(pp); safe.appendChild(esc);
  safe.appendChild(el('span','','Pago procesado por Stripe. Roller Shape Studio nunca ve ni ' +
    'almacena los datos de tu tarjeta: viajan cifrados de tu navegador a Stripe.'));

  [head, lista, total, cta, alt, metodos, safe].forEach(function(n){ c.appendChild(n); });

  var elegida = null, plan = null;

  function pintar(clave){
    plan = CFG.planes[clave];
    if(!plan) return false;
    eyebrow.textContent = plan.nota || '';
    titulo.textContent  = plan.titulo || '';
    lista.textContent   = '';
    elegida = null; totalV.textContent = '—'; cta.disabled = true;

    plan.opciones.forEach(function(op, i){
      var b = el('button','pay-opt'); b.type='button';
      b.setAttribute('role','radio'); b.setAttribute('aria-checked','false');
      if(!op.link) b.setAttribute('data-sinlinea','');
      var izq = el('div','pay-opt-l');
      izq.appendChild(el('span','pay-opt-n', op.nombre));
      var tag = op.link ? op.destacar : 'Se paga en el studio';
      if(tag) izq.appendChild(el('span','pay-opt-tag', tag));
      var der = el('span','pay-opt-p', precio(op.precio));
      if(op.periodo) der.appendChild(el('small','', op.periodo));
      b.appendChild(izq); b.appendChild(der);
      b.addEventListener('click', function(){ elegir(i); });
      var li = el('li'); li.appendChild(b); lista.appendChild(li);
    });

    var pre = -1;
    plan.opciones.forEach(function(o,i){ if(pre<0 && o.destacar && o.link) pre=i; });
    if(pre<0) plan.opciones.forEach(function(o,i){ if(pre<0 && o.link) pre=i; });
    if(pre>=0) elegir(pre);
    return true;
  }

  function elegir(i){
    var op = plan.opciones[i];
    var bs = lista.querySelectorAll('.pay-opt');
    Array.prototype.forEach.call(bs, function(b,j){ b.setAttribute('aria-checked', String(j===i)); });
    elegida = op;
    totalV.textContent = precio(op.precio) + (op.periodo || '');
    cta.disabled = false;
    cta.textContent = op.link ? 'Continuar al pago seguro' : 'Reservar y pagar en el studio';
  }

  cta.addEventListener('click', function(){
    if(!elegida) return;
    // Solo se navega a un https de Stripe salido de la config. Ni la URL
    // ni el DOM deciden el destino: eso cierra la puerta a que alguien
    // inyecte un enlace y se lleve el pago a otro lado.
    if(elegida.link && /^https:\/\/(buy|checkout)\.stripe\.com\//.test(elegida.link)){
      window.location.href = elegida.link;
    } else { window.RS_reservar(); H.cerrar(); }
  });
  alt.addEventListener('click', function(){ window.RS_reservar(); H.cerrar(); });

  Array.prototype.forEach.call(disparadores, function(a){
    var clave = a.getAttribute('data-plan');
    var p = CFG.planes[clave];
    if(!p) return;
    // Sin ningún enlace de Stripe, el botón se queda como estaba. Mejor
    // eso que una hoja bonita que no puede cobrar.
    var hayLinea = false;
    p.opciones.forEach(function(o){ if(o.link) hayLinea = true; });
    if(!hayLinea) return;
    a.addEventListener('click', function(e){ e.preventDefault(); if(pintar(clave)) H.abrir(a); });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   HOJA DE RESERVA
   Antes, cualquier "Reservar" tiraba al usuario a setmore.com: otra
   marca, otra tipografía, y de vuelta con el botón atrás si se
   arrepentía. Ahora la agenda se abre dentro del sitio, con el marco
   de Roller Shape alrededor.

   Lo que NO puedo hacer: cambiar el diseño de la agenda en sí. Vive
   en el dominio de Setmore y ningún sitio puede meter estilos dentro
   del iframe de otro — esa frontera es justamente la que impide que
   una página ajena lea lo que escribes aquí. Por eso el marco es lo
   que se cuida, y por eso queda siempre a mano el enlace para abrirla
   en pestaña propia si algo del pago se porta raro dentro del marco.
═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var CFG = window.RS_PAGOS || {};
  var URL_RESERVA = CFG.reservaUrl;
  var OK = typeof URL_RESERVA === 'string' &&
           /^https:\/\/[a-z0-9-]+\.setmore\.com\//.test(URL_RESERVA);

  // Salida de emergencia global: si algo falla, siempre queda la pestaña.
  window.RS_reservar = function(){
    if(OK) window.open(URL_RESERVA, '_blank', 'noopener,noreferrer');
  };
  if(!OK) return;

  var el = RSHoja.el;
  var enlaces = document.querySelectorAll('a[href*="setmore.com"]');
  if(!enlaces.length) return;

  var H = RSHoja.crear({id:'book', ancho:'ancha', alCerrar: function(){
    // Descarga el iframe al cerrar: ni una petición ni una cookie de
    // Setmore siguen vivas mientras la hoja no está en uso.
    marco.removeAttribute('src');
    cargando.removeAttribute('hidden');
  }});
  var c = H.cuerpo;

  var head = el('div','book-head');
  head.appendChild(el('span','pay-eyebrow','Agenda en línea'));
  var t = el('h2','book-title','Reserva tu sesión'); t.id = H.tituloId;
  head.appendChild(t);

  // Feedback de carga: un marco en blanco varios segundos se lee como roto.
  var cargando = el('div','book-load');
  cargando.setAttribute('role','status');
  cargando.appendChild(el('div','book-spin'));
  cargando.appendChild(el('span','','Cargando la agenda…'));

  var marco = document.createElement('iframe');
  marco.className = 'book-frame';
  marco.title = 'Agenda de Roller Shape Studio';
  marco.setAttribute('loading','lazy');
  marco.setAttribute('referrerpolicy','no-referrer');
  // allow="payment": sin esto Apple Pay y Google Pay no arrancan dentro
  // de un marco de otro dominio. El permiso se da solo a Setmore.
  marco.setAttribute('allow','payment ' + new URL(URL_RESERVA).origin);
  // El sandbox recorta lo que la agenda puede hacer con ESTA página:
  // sin allow-top-navigation no puede sacarte del sitio a donde quiera.
  marco.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms ' +
    'allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation');
  marco.addEventListener('load', function(){ cargando.setAttribute('hidden',''); });

  // El marco va envuelto: el borde y la sombra interior son de la hoja,
  // no del iframe, que no acepta radios ni sombras propias.
  var wrap = el('div','book-wrap');
  wrap.appendChild(marco);

  var pie  = el('div','book-foot');
  var nota = el('div','book-note');
  nota.appendChild(RSHoja.svgTrazo('M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z'));
  nota.appendChild(el('span','','La agenda y el cobro los opera Setmore, con conexión cifrada. ' +
    'Roller Shape Studio no recibe los datos de tu tarjeta.'));
  pie.appendChild(nota);

  [head, cargando, wrap, pie].forEach(function(n){ c.appendChild(n); });

  Array.prototype.forEach.call(enlaces, function(a){
    a.addEventListener('click', function(e){
      // Clic con modificador o rueda: que el navegador haga lo suyo.
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if(!marco.getAttribute('src')) marco.setAttribute('src', URL_RESERVA);
      H.abrir(a);
    });
  });
})();
