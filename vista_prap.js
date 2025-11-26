// vista_prap.js — PRAP por POA + AÑO, SOLO LECTURA desde BD
(function () {
  "use strict";

  const COLS      = 6;
  const MAIN_VIEW = "vista_direccion.html";

  // ===================== Parámetros de la URL =====================
  const params = new URLSearchParams(location.search);
  const YEAR   = parseInt(params.get("year") || "", 10);
  const POA_ID = parseInt(params.get("id")   || "0", 10);

  if (!Number.isFinite(YEAR) || YEAR <= 0) {
    alert("Falta o es inválido el parámetro 'year' en la URL");
    location.replace("direccion.html");
    return;
  }

  if (!POA_ID) {
    alert("Falta el parámetro 'id' del POA en la URL");
    location.replace("direccion.html");
    return;
  }

  // ===================== DOM =====================
  const table = document.getElementById("tablaPrapView");
  const tbody = table ? table.tBodies[0] : null;
  if (!tbody) return;

  let YEAR_ID = 1; // id_anio real en la BD

  const sanitizeCols = (cols = []) => {
    const a = (Array.isArray(cols) ? cols : []).slice(0, COLS);
    while (a.length < COLS) a.push("");
    return a;
  };

  // ===================== Año lógico -> id_anio =====================
  async function getYearId() {
    try {
      const resp = await fetch("php/anio_listar.php");
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.anios)) {
        throw new Error("Formato inválido de anio_listar.php");
      }

      const found = data.anios.find(
        (a) => parseInt(a.anio, 10) === YEAR
      );

      if (!found) {
        console.warn("Año", YEAR, "no está en tabla anio, uso id_anio = 1");
        return 1;
      }

      const idAnio = parseInt(found.id, 10);
      if (!Number.isFinite(idAnio) || idAnio <= 0) {
        console.warn("Fila de anio sin id válido, uso 1:", found);
        return 1;
      }

      return idAnio;
    } catch (e) {
      console.error("Error getYearId:", e);
      return 1;
    }
  }

  // ===================== Cargar PRAP desde BD =====================
  async function cargarDesdeBD() {
    try {
      const url = `php/prap_listar.php?anio=${encodeURIComponent(
        YEAR_ID
      )}&poa=${encodeURIComponent(POA_ID)}`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.rows)) {
        console.error("prap_listar.php devolvió error:", data);
        return [];
      }

      return data.rows.map((r) => ({
        id: Number(r.id) || 0,
        cols: sanitizeCols([
          r.obj || "",
          r.ind || "",
          r.cant === null ? "" : String(r.cant),
          r.acts || "",
          r.periodo || "",
          r.resp || "",
        ]),
      }));
    } catch (e) {
      console.error("Error al cargar PRAP desde BD:", e);
      return [];
    }
  }

  // ===================== Render SOLO LECTURA =====================
  function render(PRAPS) {
    tbody.innerHTML = "";

    if (!Array.isArray(PRAPS) || !PRAPS.length) {
      const tr = tbody.insertRow();
      const td = tr.insertCell(0);
      td.colSpan = COLS;
      td.textContent = "Sin registros PRAP para este ítem.";
      td.style.textAlign = "center";
      return;
    }

    PRAPS.forEach((fila) => {
      const tr = tbody.insertRow();
      tr.dataset.id = fila.id || 0;

      const valores = sanitizeCols(fila.cols);
      for (let c = 0; c < COLS; c++) {
        const td = tr.insertCell(-1);
        td.textContent = valores[c]; // ← solo texto, NO editable
      }
    });
  }

  // ===================== Botón volver (manteniendo year) =====================
  function setupBackButton() {
    const back = document.getElementById("btnBackDir");
    if (!back) return;

    const rawHref = back.getAttribute("href") || MAIN_VIEW;
    const url = new URL(rawHref, location.href);

    if (!url.searchParams.has("year")) {
      url.searchParams.set("year", String(YEAR));
    }

    const finalHref = url.pathname + "?" + url.searchParams.toString();
    back.setAttribute("href", finalHref);

    back.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        // Reemplaza sin dejar historial hacia adelante
        location.replace(finalHref);
      },
      { passive: false }
    );
  }

  // ===================== Inicializar =====================
  async function start() {
    YEAR_ID = await getYearId();
    const praps = await cargarDesdeBD();
    render(praps);
    setupBackButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
