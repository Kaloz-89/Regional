// Toggle claro/oscuro (home)
(function initThemeToggle() {
  var KEY  = 'theme_v1';
  var html = document.documentElement;
  if (!document.getElementById('themeToggle')) {
    document.addEventListener('DOMContentLoaded', initThemeToggle, { once:true });
    return;
  }
  var btn  = document.getElementById('themeToggle');
  var knob = btn.querySelector('.knob');
  if (!btn) return;
  var clickLock = false;
  var DUR = 720;
  (function injectCSS(){
    if (document.getElementById('theme-fade-style')) return;
    var css = `
/* Respeta reduce-motion */
@media (prefers-reduced-motion: reduce){
  html.theme-fade::before{ transition: none !important; }
}
/* Capa única para el crossfade (no animamos nada más) */
html.theme-fade{
  /* evita reflujo: solo opacidad en pseudo-elemento */
}
html.theme-fade::before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  z-index:2147483647;
  background: var(--fade-bg, rgba(0,0,0,.14));
  opacity:0;
  will-change: opacity;
  transition: opacity ${DUR}ms ease;
}
html.theme-fade.is-on::before{ opacity:1; }
`;
    var style = document.createElement('style');
    style.id = 'theme-fade-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  })();
  function current(){ return html.getAttribute('data-theme') || 'dark'; }
  function resolveURL(s){ try{ return new URL(s, location.href).href; }catch(_){ return s; } }
  function setKnobIcon(isLight){
    if (!knob) return;
    var icon = isLight ? btn.dataset.sun : btn.dataset.moon;
    if (icon) knob.style.setProperty('background-image', 'url("' + resolveURL(icon) + '")', 'important');
  }
  function setBtnState(isLight){
    btn.classList.toggle('is-light', isLight);
    btn.setAttribute('aria-pressed', String(isLight));
    btn.title = isLight ? 'Cambiar a oscuro' : 'Cambiar a claro';
    setKnobIcon(isLight);
  }
  (function preload(){
    [btn?.dataset?.sun, btn?.dataset?.moon].filter(Boolean).forEach(function(u){ var i=new Image(); i.src=resolveURL(u); });
  })();
  function apply(theme, persist){
    var prev = current();
    if (theme === prev) return;
    var goingLight = theme === 'light';
    html.style.setProperty('--fade-bg', goingLight ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.16)');
    html.classList.add('theme-fade');
    requestAnimationFrame(function(){
      html.classList.add('is-on');
      requestAnimationFrame(function(){
        html.setAttribute('data-theme', theme);
        setBtnState(goingLight);
        requestAnimationFrame(function(){
          html.classList.remove('is-on');
          setTimeout(function(){
            html.classList.remove('theme-fade');
            html.style.removeProperty('--fade-bg');
          }, DUR + 40);
        });
      });
    });
    if (persist) { try{ localStorage.setItem(KEY, theme); }catch(e){} }
  }
  // ---------- Estado inicial (sin animación) ----------
  var initIsLight = current() === 'light';
  setKnobIcon(initIsLight);
  setBtnState(initIsLight);
  // ---------- Click con “candado” para no spamear ----------
  btn.addEventListener('click', function(){
    if (clickLock) return;
    clickLock = true;
    apply(current() === 'light' ? 'dark' : 'light', true);
    setTimeout(function(){ clickLock = false; }, DUR + 80);
  });
  // ---------- Sync entre pestañas ----------
  window.addEventListener('storage', function(e){
    if (e.key === KEY && e.newValue && e.newValue !== current()){
      apply(e.newValue, false);
    }
  });
})();