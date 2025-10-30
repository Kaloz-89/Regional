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
  const PRIMARY_KEY  = "justificacion_v1";
  const FALLBACK_KEY = "informacion_paneles_v1";
  function readJSON(key){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  function leer() {
    const obj = readJSON(PRIMARY_KEY);
    if (obj) return obj;
    const arr = readJSON(FALLBACK_KEY);
    if (Array.isArray(arr)) {
      return { title: "JUSTIFICACION", cards: [
        { title: String(arr[0]?.title ?? ""), body: String(arr[0]?.body ?? "") },
        { title: String(arr[1]?.title ?? ""), body: String(arr[1]?.body ?? "") },
        { title: String(arr[2]?.title ?? ""), body: String(arr[2]?.body ?? "") },
      ]};
    }
    return null;
  }
  function normalizar(data) {
    const out = {
      title: "JUSTIFICACION",
      cards: [{title:"",body:""},{title:"",body:""},{title:"",body:""}]
    };
    if (!data) return out;
    if (data && typeof data === "object" && Array.isArray(data.cards)) {
      out.title = String(data.title || out.title);
      for (let i=0;i<3;i++){
        out.cards[i].title = String(data.cards[i]?.title ?? "");
        out.cards[i].body  = String(data.cards[i]?.body  ?? "");
      }
      return out;
    }
    if (Array.isArray(data)) {
      for (let i=0;i<3;i++){
        out.cards[i].title = String(data[i]?.title ?? "");
        out.cards[i].body  = String(data[i]?.body  ?? "");
      }
      return out;
    }
    for (let i=0;i<3;i++){
      out.cards[i].title = String(data["t"+i] ?? "");
      out.cards[i].body  = String(data["b"+i] ?? "");
    }
    out.title = String(data.title || data.titulo || data.pageTitle || out.title);
    return out;
  }
  function render() {
    const norm = normalizar(leer());
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = norm.title || "JUSTIFICACION";
    for (let i=0;i<3;i++){
      const t = document.getElementById(`t${i}`);
      const b = document.getElementById(`b${i}`);
      if (t) t.textContent = norm.cards[i].title || "";
      if (b) b.textContent = norm.cards[i].body  || "";
    }
  }
  window.addEventListener("storage", (e) => {
    if ([PRIMARY_KEY, FALLBACK_KEY].includes(e.key)) render();
  });
  render();
})();