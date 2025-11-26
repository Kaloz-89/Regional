// Vista pública de Ideas Rectoras
(function () {
  const STORAGE_KEY = "mvv_paneles_v1";
  const API_URL     = "mvv_api.php";
  const ANIO_ACTUAL = 1; // mismo id_anio que en mvv_api.php

  function normalizar(data) {
    const out = {
      title: "IDEAS RECTORAS",
      cards: [
        { title: "MISIÓN",  body: "" },
        { title: "VISIÓN",  body: "" },
        { title: "VALORES", body: "" }
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
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizar(raw ? JSON.parse(raw) : null);
    } catch {
      return normalizar(null);
    }
  }

  function aplicar(data) {
    const norm = normalizar(data);
    const idsTitulo = ["t0", "t1", "t2"];
    const idsBody   = ["b0", "b1", "b2"];

    idsTitulo.forEach((id, index) => {
      const el = document.getElementById(id);
      if (el) el.textContent = norm.cards[index].title;
    });

    idsBody.forEach((id, index) => {
      const el = document.getElementById(id);
      if (el) el.textContent = norm.cards[index].body;
    });
  }

  async function cargar() {
    try {
      const resp = await fetch(`${API_URL}?anio=${ANIO_ACTUAL}`);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const json = await resp.json();

      if (json.ok && Array.isArray(json.data) && json.data.length) {
        const cards = json.data.map(row => ({
          title: row.titulo || "",
          body:  row.contenido || ""
        }));
        const obj = normalizar({ cards });
        aplicar(obj);

        // opcional: también guardar en localStorage
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
        return;
      }
    } catch (err) {
      console.log("MVV público: no se pudo leer BD, uso localStorage", err);
    }

    // si falla la BD, al menos muestra lo que haya en localStorage
    aplicar(leerLocal());
  }

  cargar();
})();
