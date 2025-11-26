// Bloquear botón atrás
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

// Vista pública de Justificación (solo lectura desde BD)
(function () {
  "use strict";

  const API_URL = "php/justificacion_api.php";
  const YEAR_KEY = "app_year_v1";

  function getLogicalYear() {
    const params = new URLSearchParams(location.search);
    const yUrl = parseInt(params.get("year") || "", 10);
    if (Number.isFinite(yUrl)) {
      localStorage.setItem(YEAR_KEY, String(yUrl));
      return yUrl;
    }
    const yLs = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    if (Number.isFinite(yLs)) return yLs;
    return new Date().getFullYear();
  }

  const ANIO = getLogicalYear();

  function normalizar(data) {
    const out = {
      title: "Justificación",
      cards: [
        { title: "", body: "" },
        { title: "", body: "" },
        { title: "", body: "" },
      ],
    };
    if (!data || !Array.isArray(data)) return out;

    for (let i = 0; i < Math.min(3, data.length); i++) {
      out.cards[i].title = String(data[i]?.titulo ?? "");
      out.cards[i].body = String(data[i]?.contenido ?? "");
    }
    return out;
  }

  async function render() {
    let norm;
    try {
      const resp = await fetch(`${API_URL}?anio=${ANIO}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const json = await resp.json();
      if (json.ok && Array.isArray(json.data)) {
        norm = normalizar(json.data);
      }
    } catch (e) {
      console.warn("No se pudo cargar Justificación pública desde BD", e);
    }

    if (!norm) norm = normalizar([]);

    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = norm.title;

    for (let i = 0; i < 3; i++) {
      const t = document.getElementById(`t${i}`);
      const b = document.getElementById(`b${i}`);
      if (t) t.textContent = norm.cards[i].title || "";
      if (b) b.textContent = norm.cards[i].body || "";
    }
  }

  render();
})();
