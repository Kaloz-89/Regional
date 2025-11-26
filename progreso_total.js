(function () {
  "use strict";

  const YEAR_STORE_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();

  function getActiveYear() {
    const p = new URLSearchParams(location.search);
    const fromUrl = parseInt(p.get("year") || "", 10);
    if (Number.isFinite(fromUrl)) {
      localStorage.setItem(YEAR_STORE_KEY, String(fromUrl));
      return fromUrl;
    }
    const fromLs = parseInt(localStorage.getItem(YEAR_STORE_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW;
  }

  const YEAR = getActiveYear();
  let YEAR_ID = 1;

  const table = document.getElementById("tablaTotal");
  const tbody = table ? table.tBodies[0] : null;
  if (!tbody) return;

  const parseNum = (v) => {
    const n = Number(String(v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  };

  const pct = (n, d) => {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return "—";
    const x = Math.max(0, Math.min(100, (n / d) * 100));
    return x.toFixed(1) + "%";
  };

  async function resolveYearId() {
    try {
      const resp = await fetch("php/anio_listar.php");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.anios)) throw new Error("Formato inválido");

      const found = data.anios.find((a) => parseInt(a.anio, 10) === YEAR);
      if (!found) {
        YEAR_ID = data.anios.length ? parseInt(data.anios[0].id, 10) || 1 : 1;
        return YEAR_ID;
      }
      const idAnio = parseInt(found.id, 10);
      YEAR_ID = Number.isFinite(idAnio) && idAnio > 0 ? idAnio : 1;
      return YEAR_ID;
    } catch (e) {
      console.error("Error resolveYearId:", e);
      YEAR_ID = 1;
      return YEAR_ID;
    }
  }

  function renderPlaceholder(msg) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const tr = tbody.insertRow();
    const td = tr.insertCell(0);
    td.colSpan = 11;
    td.className = "placeholder";
    td.textContent = msg || "Sin datos todavía.";
  }

  async function cargarDatos() {
    renderPlaceholder("Cargando…");
    try {
      await resolveYearId();
      const url = `php/progreso_total_api.php?anio=${encodeURIComponent(YEAR_ID)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();

      if (!data.ok || !Array.isArray(data.rows) || data.rows.length === 0) {
        renderPlaceholder("Sin datos todavía.");
        return;
      }

      const rows = data.rows.map((r) => {
        const cant = parseNum(r.cant);
        const iAbs = parseNum(r.iAbs);
        const iiAbs = parseNum(r.iiAbs);
        const total = iAbs + iiAbs;
        return {
          obj: r.obj || "(sin objetivo)",
          ind: r.ind || "",
          cant,
          acts: r.acts || "",
          periodo: r.periodo || "",
          resp: r.resp || "",
          iAbs,
          iPct: pct(iAbs, cant),
          iiAbs,
          iiPct: pct(iiAbs, cant),
          totPct: pct(total, cant),
        };
      }).sort((a, b) => {
        const ax = parseFloat(a.totPct) || 0;
        const bx = parseFloat(b.totPct) || 0;
        return bx - ax || a.obj.localeCompare(b.obj);
      });

      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

      rows.forEach((r) => {
        const tr = tbody.insertRow();
        const cell = (val, cls) => {
          const td = tr.insertCell(-1);
          td.textContent = val;
          if (cls) td.className = cls;
          return td;
        };
        cell(r.obj);
        cell(r.ind);
        cell(String(r.cant), "num");
        cell(r.acts);
        cell(r.periodo);
        cell(r.resp);
        cell(String(r.iAbs), "num");
        cell(r.iPct, "num");
        cell(String(r.iiAbs), "num");
        cell(r.iiPct, "num");
        cell(r.totPct, "num");
      });
    } catch (e) {
      console.error("Error al cargar progreso total:", e);
      renderPlaceholder("Error al cargar datos.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cargarDatos);
  } else {
    cargarDatos();
  }
})();

document.getElementById("btnPdf")?.addEventListener("click", () => {
  window.print();
});
