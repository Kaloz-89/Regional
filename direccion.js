// direccion.js — Dirección — Administradores (POA)
(function () {
  "use strict";

  const YEAR_KEY = "app_year_v1";
  const STORAGE_KEY = "tablaPoa_direccion_v1";
  const COLS = 4;
  const DETAIL_PAGE = "prap.html";

  const tabla = document.querySelector("#tablaPoa tbody");
  const botonAgregar = document.getElementById("agregarFila");

  const getYear = () =>
    parseInt(localStorage.getItem(YEAR_KEY) || new Date().getFullYear(), 10);

  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const sanitizeCols = (cols = []) => {
    const a = (Array.isArray(cols) ? cols : []).slice(0, COLS);
    while (a.length < COLS) a.push("");
    return a;
  };

  let YEAR = getYear();
  let YEAR_ID = 1;
  let DIRECCIONES = [];
  let DIRTY = false;

  // ================= AÑO ACTIVO (id_anio) =================
  async function getYearId() {
    try {
      const resp = await fetch("php/anio_listar.php");
      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.anios)) throw new Error("sin anios");
      const found = data.anios.find(
        (a) => parseInt(a.anio, 10) === parseInt(YEAR, 10)
      );
      return found ? parseInt(found.id, 10) : 1;
    } catch (e) {
      console.warn("anio_listar error", e);
      return 1;
    }
  }

  // ================== BD: CARGAR ==================
  async function cargarDesdeBD() {
    try {
      const resp = await fetch(`php/poa_listar.php?anio=${YEAR_ID}`);
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || !data.ok || !Array.isArray(data.rows)) {
        console.warn("poa_listar error", data && data.error);
        return [];
      }

      return data.rows.map((row) => ({
        id: parseInt(row.id, 10) || 0,
        // Orden: área, objetivo, meta (num), indicador
        cols: sanitizeCols([
          row.area || "",
          row.objetivo || "",
          row.meta === null ? "" : String(row.meta),
          row.indicador || "",
        ]),
      }));
    } catch (e) {
      console.warn("cargarDesdeBD error", e);
      return [];
    }
  }

  // ================== BD: GUARDAR ==================
  async function guardarEnBD(blocking) {
    if (!DIRTY) return;

    const payload = {
      anio: YEAR_ID, // id_anio
      rows: DIRECCIONES.map((d) => ({
        id: d.id || 0,
        area: d.cols[0] || "",
        objetivo: d.cols[1] || "",
        meta: d.cols[2] === "" ? null : d.cols[2],
        indicador: d.cols[3] || "",
      })),
    };

    const json = JSON.stringify(payload);

    try {
      if (!blocking && navigator.sendBeacon) {
        const blob = new Blob([json], { type: "application/json" });
        navigator.sendBeacon("php/poa_guardar_lote.php", blob);
        DIRTY = false;
        return;
      }

      const resp = await fetch("php/poa_guardar_lote.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.ok) {
        const msg =
          (data && (data.error || (data.errors && data.errors.join("\n")))) ||
          "Error al guardar POA";
        alert(msg);
        console.error("poa_guardar_lote.php", msg);
        return;
      }

      DIRTY = false;
    } catch (e) {
      console.error("guardarEnBD error", e);
    }
  }

  // ================== LOCALSTORAGE (espejo por año) ==================
  const ykey = (k) => `${YEAR}_${k}`;
  const yGet = (k) => localStorage.getItem(ykey(k));
  const ySet = (k, v) => localStorage.setItem(ykey(k), v);

  function escribirDirecciones(arr) {
    try {
      ySet(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn("No se pudo guardar en LS", e);
    }
  }

  function leerDirecciones() {
    try {
      const raw = yGet(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map((d) => ({
        id: d.id || 0,
        cols: sanitizeCols(d.cols),
      }));
    } catch {
      return [];
    }
  }

  // ================== UI helpers ==================
  function crearCeldaNumeroEnlace(tr, idx, id) {
    const td = tr.insertCell(0);
    td.innerHTML = `<a href="${DETAIL_PAGE}?id=${encodeURIComponent(
      id
    )}&year=${YEAR}" title="Abrir PRAP relacionado">${idx + 1}</a>`;
    td.style.textAlign = "center";
  }

  function crearCeldasEditables(tr, fila) {
    const valores = sanitizeCols(fila.cols);
    for (let i = 0; i < COLS; i++) {
      const td = tr.insertCell(-1);
      td.contentEditable = "true";
      td.textContent = valores[i];
      td.addEventListener("input", () => {
        fila.cols[i] = td.textContent.trim();
        DIRTY = true;
        escribirDirecciones(DIRECCIONES);
      });
    }
  }

  function crearCeldaAccion(tr, fila) {
    const td = tr.insertCell(-1);
    const btn = document.createElement("button");
    btn.textContent = "🗑️";
    btn.className = "eliminar-fila";
    btn.addEventListener("click", () => {
      DIRECCIONES = DIRECCIONES.filter((f) => f !== fila);
      DIRTY = true;
      escribirDirecciones(DIRECCIONES);
      render();
    });
    td.appendChild(btn);
  }

  function render() {
    tabla.innerHTML = "";
    DIRECCIONES.forEach((fila, i) => {
      const tr = tabla.insertRow();
      tr.dataset.id = fila.id || 0;
      crearCeldaNumeroEnlace(tr, i, fila.id || 0);
      crearCeldasEditables(tr, fila);
      crearCeldaAccion(tr, fila);
    });
  }

  // ================== EVENTOS ==================
  botonAgregar.addEventListener("click", () => {
    const nuevo = { id: 0, cols: ["", "", "", ""] };
    DIRECCIONES.push(nuevo);
    DIRTY = true;
    escribirDirecciones(DIRECCIONES);
    render();
  });

  // guardar best-effort al cerrar
  window.addEventListener("beforeunload", () => {
    guardarEnBD(false);
  });

  // guardar al ir a Inicio
  const volver = document.querySelector(".nav-volver a");
  if (volver) {
    volver.addEventListener("click", async (ev) => {
      ev.preventDefault();
      await guardarEnBD(true);
      location.href = volver.href;
    });
  }

  // ================== ARRANQUE ==================
  async function start() {
    YEAR = getYear();
    YEAR_ID = await getYearId();

    const rowsBD = await cargarDesdeBD();
    if (rowsBD.length) {
      DIRECCIONES = rowsBD;
    } else {
      DIRECCIONES = leerDirecciones();
    }

    escribirDirecciones(DIRECCIONES);
    DIRTY = false;
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
