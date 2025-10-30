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
(function () {
  const STORAGE_KEY     = "informacion_paneles_v1";
  const PUBLIC_KEY      = "justificacion_v1";
  const grid = document.getElementById("cardsGrid");
  const msg  = document.getElementById("estadoMsg");
  const pageTitleEl = document.getElementById("pageTitle");
  const plantilla = () => ([
    { title: "", body: "" },
    { title: "", body: "" },
    { title: "", body: "" },
  ]);
  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (Array.isArray(data) && data.length === 3) return data;
      // Si viniera con otro tamaño, lo normalizamos a 3
      const base = plantilla();
      if (Array.isArray(data)) {
        for (let i=0; i<Math.min(3, data.length); i++) {
          base[i].title = String(data[i]?.title ?? "");
          base[i].body  = String(data[i]?.body  ?? "");
        }
      }
      return base;
    } catch {
      return plantilla();
    }
  }
  function escribirArray(arr3) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr3));
      const title = (pageTitleEl?.textContent || "JUSTIFICACION").trim();
      const payload = { title, cards: arr3 };
      localStorage.setItem(PUBLIC_KEY, JSON.stringify(payload));
      feedback("✔ Guardado");
    } catch (e) {
      feedback("No se pudo guardar (storage lleno o bloqueado)");
      console.warn(e);
    }
  }
  function feedback(t) {
    if (!msg) return;
    msg.textContent = t;
    clearTimeout(feedback._t);
    feedback._t = setTimeout(()=> msg.textContent = "", 1200);
  }
  // ==== Pintar desde datos al DOM
  function aplicar(data) {
    const safe = Array.isArray(data) ? data : plantilla();
    const cards = grid.querySelectorAll(".info-card");
    cards.forEach((card, i) => {
      const t = card.querySelector(".editable-title");
      const b = card.querySelector(".editable-body");
      if (t) t.textContent = String(safe[i]?.title ?? "");
      if (b) b.textContent = String(safe[i]?.body  ?? "");
    });
  }
  // ==== Leer DOM → datos
  function leerDesdeDOM() {
    const cards = [...grid.querySelectorAll(".info-card")];
    return cards.map(card => {
      const t = card.querySelector(".editable-title");
      const b = card.querySelector(".editable-body");
      return {
        title: (t?.textContent || "").trim(),
        body:  (b?.textContent || "").trim(),
      };
    });
  }
  // ==== Guardado en cada cambio (debounced ligero)
  let t;
  grid.addEventListener("input", (e) => {
    if (!e.target.closest(".editable")) return;
    clearTimeout(t);
    t = setTimeout(() => {
      const data = leerDesdeDOM();
      escribirArray(data);
    }, 100);
  });
  grid.addEventListener("keydown", (e) => {
    if (e.target.matches(".editable-title") && e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  });
  // Sincronizar si otra pestaña/ventana edita
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === PUBLIC_KEY) aplicar(leer());
  });
  aplicar(leer());
})();