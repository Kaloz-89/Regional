// Bloquear botón atrás (igual que en MVV)
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

// Panel administrativo de Justificación — edición y guardado en BD
(function () {
  "use strict";

  const API_URL = "php/justificacion_api.php";
  const YEAR_KEY = "app_year_v1";

  const grid = document.getElementById("cardsGrid");
  const msg = document.getElementById("estadoMsg");
  if (!grid) return;

  // ===== Año activo =====
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

  // ===== Utilidades =====
  function setEstado(t) {
    if (!msg) return;
    msg.textContent = t || "";
    if (t) {
      clearTimeout(setEstado._t);
      setEstado._t = setTimeout(() => (msg.textContent = ""), 1200);
    }
  }

  function normalizar(data) {
    const out = {
      cards: [
        { title: "Título…", body: "Contenido…" },
        { title: "Título…", body: "Contenido…" },
        { title: "Título…", body: "Contenido…" },
      ],
    };
    if (!data || !Array.isArray(data.cards)) return out;

    for (let i = 0; i < Math.min(3, data.cards.length); i++) {
      out.cards[i].title = String(data.cards[i]?.title || out.cards[i].title);
      out.cards[i].body = String(data.cards[i]?.body || out.cards[i].body);
    }
    return out;
  }

  function leerDesdeDOM() {
    const cards = [];
    grid.querySelectorAll(".info-card").forEach((card) => {
      const t = card.querySelector(".editable-title");
      const b = card.querySelector(".editable-body");
      cards.push({
        title: t ? t.textContent.trim() : "",
        body: b ? b.textContent.trim() : "",
      });
    });
    return normalizar({ cards });
  }

  function aplicar(data) {
    const norm = normalizar(data);
    grid.querySelectorAll(".info-card").forEach((card, i) => {
      const t = card.querySelector(".editable-title");
      const b = card.querySelector(".editable-body");
      if (t) t.textContent = norm.cards[i].title;
      if (b) b.textContent = norm.cards[i].body;
    });
  }

  // ===== Cargar desde BD =====
  async function cargarDesdeServidor() {
    try {
      const resp = await fetch(`${API_URL}?anio=${encodeURIComponent(ANIO)}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const json = await resp.json();
      if (json.ok && Array.isArray(json.data)) {
        const cards = json.data.map((r) => ({
          title: r.titulo || "",
          body: r.contenido || "",
        }));
        aplicar({ cards });
        return;
      }
    } catch (err) {
      console.warn("No se pudo cargar Justificación desde la BD", err);
    }
  }

  // ===== Guardado en BD =====
  let timeoutGuardar = null;
  function programarGuardadoServidor() {
    if (timeoutGuardar) clearTimeout(timeoutGuardar);

    timeoutGuardar = setTimeout(async () => {
      const data = leerDesdeDOM();
      try {
        const resp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anio: ANIO, cards: data.cards }),
        });

        const json = await resp.json();
        if (!json.ok) {
          console.error("Error al guardar Justificación en BD", json);
          setEstado("Error al guardar");
        } else {
          setEstado("Guardado");
        }
      } catch (err) {
        console.error("Error de conexión al guardar Justificación", err);
        setEstado("Error de conexión");
      }
    }, 800);
  }

  // Detectar cambios y guardar automáticamente
  grid.addEventListener("input", (e) => {
    if (!e.target.closest(".editable")) return;
    programarGuardadoServidor();
  });

  cargarDesdeServidor();
})();
