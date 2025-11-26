// Bloquear botón atrás en esta vista
(function () {
  try {
    history.replaceState({ noForward: true }, "", location.href);
    window.addEventListener("popstate", function (e) {
      try {
        if (e.state && e.state.noForward) {
          history.pushState({ noForward: true }, "", location.href);
        }
      } catch {}
    });
  } catch {}
})();

// Lógica Ideas Rectoras (ADMIN)
(function () {
  const STORAGE_KEY = "mvv_paneles_v1";
  const API_URL     = "php/mvv_api.php";
  const YEAR_KEY    = "app_year_v1";

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

  const ANIO_LOGICO = getLogicalYear();
  const grid = document.querySelector("[data-mvv-grid]");
  const estadoMsg = document.getElementById("estadoMsg");
  if (!grid) return;

  function setEstado(msg) {
    if (estadoMsg) estadoMsg.textContent = msg || "";
  }

  function readKey(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function normalizar(data) {
    const out = {
      title: "IDEAS RECTORAS",
      cards: [
        { title: "MISIÓN",  body: "Escribe la misión…" },
        { title: "VISIÓN",  body: "Escribe la visión…" },
        { title: "VALORES", body: "Lista de valores…" }
      ]
    };

    if (!data) return out;
    if (Array.isArray(data.cards)) {
      for (let i = 0; i < Math.min(3, data.cards.length); i++) {
        out.cards[i].title = String(data.cards[i]?.title || out.cards[i].title);
        out.cards[i].body  = String(data.cards[i]?.body  || out.cards[i].body);
      }
    }
    return out;
  }

  function leerLocal() {
    const raw = readKey(STORAGE_KEY);
    return normalizar(raw);
  }

  function escribirLocal(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  function leerDesdeDOM() {
    const cards = [];
    grid.querySelectorAll("[data-mvv-card]").forEach(cardEl => {
      const titleEl = cardEl.querySelector(".editable-title");
      const bodyEl  = cardEl.querySelector(".editable-body");
      cards.push({
        title: titleEl ? titleEl.textContent.trim() : "",
        body:  bodyEl  ? bodyEl.textContent.trim()  : ""
      });
    });
    return normalizar({ cards });
  }

  function aplicar(data) {
    const norm = normalizar(data);
    grid.querySelectorAll("[data-mvv-card]").forEach((cardEl, index) => {
      const titleEl = cardEl.querySelector(".editable-title");
      const bodyEl  = cardEl.querySelector(".editable-body");
      if (titleEl) titleEl.textContent = norm.cards[index].title;
      if (bodyEl)  bodyEl.textContent  = norm.cards[index].body;
    });
  }

  async function cargarDesdeServidor() {
    setEstado("Cargando desde la base de datos…");
    try {
      const resp = await fetch(`${API_URL}?anio=${encodeURIComponent(ANIO_LOGICO)}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const json = await resp.json();
      if (json.ok && Array.isArray(json.data) && json.data.length) {
        const cards = json.data.map(row => ({
          title: row.titulo    || "",
          body:  row.contenido || ""
        }));
        const obj = normalizar({ cards });
        escribirLocal(obj);
        aplicar(obj);
        setEstado("Datos cargados desde la base de datos.");
        return;
      }

      aplicar(leerLocal());
      setEstado("Sin datos en BD. Usando plantilla local.");
    } catch (err) {
      console.error("Error al cargar MVV desde la BD", err);
      aplicar(leerLocal());
      setEstado("No se pudo conectar a la BD. Usando datos locales.");
    }
  }

  let timeoutGuardar = null;
  function programarGuardadoServidor() {
    if (timeoutGuardar) clearTimeout(timeoutGuardar);
    setEstado("Guardando…");

    timeoutGuardar = setTimeout(async () => {
      const data = leerLocal();
      try {
        const resp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anio: ANIO_LOGICO, cards: data.cards })
        });
        const json = await resp.json();
        if (!json.ok) {
          console.error("Error al guardar en BD", json);
          setEstado("Error al guardar en la BD.");
        } else {
          setEstado("");
        }
      } catch (err) {
        console.error("Error de conexión al guardar MVV", err);
        setEstado("No se pudo guardar en la BD (conexión).");
      }
    }, 800);
  }

  grid.addEventListener("input", e => {
    if (!e.target.closest(".editable")) return;
    const data = leerDesdeDOM();
    escribirLocal(data);
    programarGuardadoServidor();
  });

  grid.addEventListener("keydown", e => {
    if (e.target.matches(".editable-title") && e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  });

  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY) aplicar(leerLocal());
  });

  cargarDesdeServidor();
})();

// Dropdown del header
(function () {
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.nav-dropdown > .has-caret');
    const dd  = e.target.closest('.nav-dropdown');

    if (!btn || !dd) return;

    const isOpen = dd.classList.contains('open');
    document.querySelectorAll('.nav-dropdown.open')
            .forEach(el => el.classList.remove('open'));

    if (!isOpen) dd.classList.add('open');
  });
})();
