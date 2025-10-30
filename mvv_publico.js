(function () {
  try { history.replaceState({ noForward: true }, "", location.href); } catch {}
  window.addEventListener("popstate", function (e) {
    try {
      if (e.state && e.state.noForward) {
        history.pushState({ noForward: true }, "", location.href);
      }
    } catch {}
  });
})();
(function (){
  const PRIMARY_KEY  = "mvv_paneles_v1";
  const FALLBACK_KEY = "mvv_v1";
  function readKey(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function leer() {
    return readKey(PRIMARY_KEY) ?? readKey(FALLBACK_KEY) ?? null;
  }
  function normalizar(data) {
    const out = {
      title: "IDEAS RECTORAS",
      cards: [{title:"",body:""},{title:"",body:""},{title:"",body:""}]
    };
    if (!data) return out;
    if (Array.isArray(data)) {
      for (let i = 0; i < Math.min(3, data.length); i++) {
        out.cards[i].title = String(data[i]?.title || "");
        out.cards[i].body  = String(data[i]?.body  || "");
      }
      return out;
    }
    if (Array.isArray(data.cards)) {
      out.title = String(data.title || data.titulo || data.pageTitle || out.title);
      for (let i = 0; i < Math.min(3, data.cards.length); i++) {
        out.cards[i].title = String(data.cards[i]?.title || data.cards[i]?.h || "");
        out.cards[i].body  = String(data.cards[i]?.body  || data.cards[i]?.p || "");
      }
      return out;
    }
    if (Array.isArray(data.sections)) {
      out.title = String(data.title || data.titulo || data.pageTitle || out.title);
      for (let i = 0; i < Math.min(3, data.sections.length); i++) {
        out.cards[i].title = String(data.sections[i]?.h || "");
        out.cards[i].body  = String(data.sections[i]?.p || "");
      }
      return out;
    }
    out.title = String(data.title || data.titulo || data.pageTitle || out.title);
    for (let i = 0; i < 3; i++) {
      out.cards[i].title = String(data["t"+i] || "");
      out.cards[i].body  = String(data["b"+i] || "");
    }
    return out;
  }
  function render(){
    const norm = normalizar(leer());
    const pageTitle = document.querySelector(".sheet-title, #pageTitle");
    if (pageTitle) pageTitle.textContent = norm.title;
    for (let i = 0; i < 3; i++) {
      const t = document.getElementById(`t${i}`);
      const b = document.getElementById(`b${i}`);
      if (t) t.textContent = norm.cards[i].title || "";
      if (b) b.textContent = norm.cards[i].body  || "";
    }
  }
  window.addEventListener("storage", (e) => {
    if (e.key === PRIMARY_KEY || e.key === FALLBACK_KEY) render();
  });
  render();
})();