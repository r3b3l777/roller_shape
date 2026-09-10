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
  (function loop(){
    rx += (mx-rx)*0.16; ry += (my-ry)*0.16;
    cr.style.left = rx+'px'; cr.style.top = ry+'px';
    requestAnimationFrame(loop);
  })();
})();

/* ── NAV: scrolled state (rAF-throttled, passive) ─────────────── */
(function(){
  var nav = document.getElementById('nav');
  if(!nav) return;
  var ticking = false;
  function update(){ nav.classList.toggle('scrolled', window.pageYOffset > 60); ticking = false; }
  window.addEventListener('scroll', function(){
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, {passive:true});
  update();
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

  if(coarse) return;   // touch devices already scroll natively; don't fight them

  var down = false, startX = 0, startLeft = 0, moved = 0;
  track.addEventListener('pointerdown', function(e){
    if(e.pointerType === 'touch') return;
    down = true; moved = 0;
    startX = e.clientX; startLeft = track.scrollLeft;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', function(e){
    if(!down) return;
    var dx = e.clientX - startX;
    moved = Math.abs(dx);
    if(moved > 4) track.classList.add('dragging');
    track.scrollLeft = startLeft - dx;
  });
  function end(e){
    if(!down) return;
    down = false;
    try{ track.releasePointerCapture(e.pointerId); }catch(_){}
    setTimeout(function(){ track.classList.remove('dragging'); }, 0);
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
