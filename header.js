(function () {
  if (window.__HEADER_SESSION_INIT__) return;
  window.__HEADER_SESSION_INIT__ = true;
  const LOGIN_CANDIDATES = [
    "index.html",
    "inicio_regional.html",
    "inicio.html",
    "inicio_regional.hmtl"
  ];
  const SESSION_KEY     = "session_user";
  const LAST_LOGOUT_KEY = "last_logout";
  const low = (s) => (s || "").toLowerCase();
  function isLoginPage() {
    const path = low(location.pathname || "");
    return LOGIN_CANDIDATES.some(name =>
      path.endsWith("/" + low(name)) || path.endsWith(low(name))
    );
  }
  function isLoggedIn() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const o = JSON.parse(raw);
      return !!o && typeof o === "object" && !!o.username;
    } catch { return false; }
  }
  function resolveLoginUrl(preferredHref) {
    const base = location.href;
    if (preferredHref) {
      try { return new URL(preferredHref, base).toString(); } catch {}
    }
    for (const name of LOGIN_CANDIDATES) {
      try { return new URL(name, base).toString(); } catch {}
    }
    try {
      const folder = base.replace(/[^/]*$/, "");
      return new URL(folder + "index.html").toString();
    } catch {
      return "index.html";
    }
  }
  function goToLoginReplace(preferredHref) {
    try { localStorage.setItem(LAST_LOGOUT_KEY, String(Date.now())); } catch {}
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    const urlStr = resolveLoginUrl(preferredHref);
    const url = new URL(urlStr);
    url.searchParams.set("ts", Date.now().toString());
    location.replace(url.toString());
  }
  function isLogoutAnchor(a) {
    if (!a) return false;
    const href = low(a.getAttribute("href") || "");
    const inLogoutContainer = !!a.closest(".boton_salida, .logout, [data-logout]");
    const looksLikeLogin = LOGIN_CANDIDATES.some(n => href.endsWith(low(n)));
    const labelish = low(a.textContent || a.getAttribute("aria-label") || "");
    const labelMatches = /cerrar|salir|logout|sign\s*out/.test(labelish);
    return inLogoutContainer || looksLikeLogin || labelMatches;
  }
  // Intercepta "Cerrar sesión" en captura
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (!a) return;
    if (!isLogoutAnchor(a)) return;
    e.preventDefault();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
    e.stopPropagation();
    goToLoginReplace(a.getAttribute("href"));
  }, true);

  if (!isLoginPage() && !isLoggedIn()) {
    goToLoginReplace();
    return;
  }
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && !isLoginPage() && !isLoggedIn()) goToLoginReplace();
  });
  window.addEventListener("storage", (ev) => {
    if (ev.key === LAST_LOGOUT_KEY && !isLoginPage()) goToLoginReplace();
  });
})();
/* -------------------- Dropdown robusto -------------------- */
(function () {
  if (window.__HEADER_DD_INIT__) return;
  window.__HEADER_DD_INIT__ = true;
  const DD_SELECTOR      = '.nav-dropdown';
  const TRIGGER_SELECTOR = '.nav-dropdown > .has-caret, .nav-dropdown .dropdown-trigger';
  let lastToggleStamp = 0;
  function openDD(dd) {
    if (!dd) return;
    document.querySelectorAll(`${DD_SELECTOR}.open, ${DD_SELECTOR}.abierto`)
      .forEach(d => { if (d !== dd) closeDD(d); });
    dd.classList.add('open', 'abierto');
    dd.setAttribute('aria-expanded', 'true');
    const t = dd.querySelector('.has-caret, .dropdown-trigger');
    if (t) t.setAttribute('aria-expanded', 'true');
  }
  function closeDD(dd) {
    if (!dd) return;
    dd.classList.remove('open', 'abierto');
    dd.setAttribute('aria-expanded', 'false');
    const t = dd.querySelector('.has-caret, .dropdown-trigger');
    if (t) t.setAttribute('aria-expanded', 'false');
  }
  function toggleDD(dd) {
    if (!dd) return;
    const isOpen = dd.classList.contains('open') || dd.classList.contains('abierto');
    isOpen ? closeDD(dd) : openDD(dd);
  }
  document.addEventListener('click', (ev) => {
    const trigger = ev.target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;
    const dd = trigger.closest(DD_SELECTOR);
    toggleDD(dd);
    lastToggleStamp = ev.timeStamp || Date.now();
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
  document.addEventListener('click', (ev) => {
    const ts = ev.timeStamp || 0;
    if (ts && ts === lastToggleStamp) return;
    document.querySelectorAll(`${DD_SELECTOR}.open, ${DD_SELECTOR}.abierto`).forEach(dd => {
      if (!dd.contains(ev.target)) closeDD(dd);
    });
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const trigger = ev.target.closest && ev.target.closest(TRIGGER_SELECTOR);
    if (!trigger) return;
    const dd = trigger.closest(DD_SELECTOR);
    toggleDD(dd);
    lastToggleStamp = Date.now();
    ev.preventDefault();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    document.querySelectorAll(`${DD_SELECTOR}.open, ${DD_SELECTOR}.abierto`).forEach(closeDD);
  });
})();