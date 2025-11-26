// prap.js — PRAP por POA + AÑO, guardado solo en BD
(function () {
  "use strict";

  const COLS = 6;

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

  const tbody  = document.querySelector("#tablaPrap tbody");
  const btnAdd = document.getElementById("agregarFila");

  let YEAR_ID = 1;      // id_anio real en la BD
  let PRAPS   = [];     // { id, cols[6] }
  let DIRTY   = false;

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
      const url  = `php/prap_listar.php?anio=${encodeURIComponent(
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

  // ===================== Guardar PRAP en BD =====================
  async function guardarEnBD(blocking) {
    if (!DIRTY) return;

    const payload = {
      anio: YEAR_ID,  // id_anio
      poa:  POA_ID,   // id_poa
      rows: PRAPS.map((p) => ({
        id:   p.id || 0,
        obj:  p.cols[0] || "",
        ind:  p.cols[1] || "",
        cant: p.cols[2] === "" ? null : p.cols[2],
        acts: p.cols[3] || "",
        periodo: p.cols[4] || "",
        resp:    p.cols[5] || "",
      })),
    };

    const json = JSON.stringify(payload);

    try {
      // best-effort al cerrar pestaña
      if (!blocking && navigator.sendBeacon) {
        const blob = new Blob([json], { type: "application/json" });
        navigator.sendBeacon("php/prap_guardar_lote.php", blob);
        DIRTY = false;
        return;
      }

      const resp = await fetch("php/prap_guardar_lote.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });

      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const data = await resp.json().catch(() => null);
      if (!data || !data.ok) {
        console.error("Error prap_guardar_lote.php:", data);
        alert(data && data.error ? data.error : "Error al guardar PRAP.");
        return;
      }

      DIRTY = false;
    } catch (e) {
      console.error("guardarEnBD error:", e);
      alert("Error al guardar PRAP. Revisa la consola.");
    }
  }

  // ===================== Render tabla =====================
  function render() {
    if (!tbody) return;
    tbody.innerHTML = "";

    PRAPS.forEach((fila) => {
      const tr = tbody.insertRow();
      tr.dataset.id = fila.id || 0;

      const valores = sanitizeCols(fila.cols);

      for (let c = 0; c < COLS; c++) {
        const td = tr.insertCell(-1);
        td.contentEditable = "true";
        td.textContent = valores[c];
        td.addEventListener("input", () => {
          fila.cols[c] = td.textContent.trim();
          DIRTY = true;
        });
      }

      const tdAcc = tr.insertCell(-1);
      const btn = document.createElement("button");
      btn.textContent = "🗑️";
      btn.className = "eliminar-fila";
      btn.addEventListener("click", () => {
        PRAPS = PRAPS.filter((p) => p !== fila);
        DIRTY = true;
        render();
      });
      tdAcc.appendChild(btn);
    });
  }

  // ===================== Eventos =====================
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      PRAPS.push({ id: 0, cols: ["", "", "", "", "", ""] });
      DIRTY = true;
      render();
    });
  }

  window.addEventListener("beforeunload", () => {
    guardarEnBD(false); // best-effort
  });

  const btnVolver = document.getElementById("btnVolver");
  if (btnVolver) {
    btnVolver.addEventListener("click", async (ev) => {
      ev.preventDefault();
      await guardarEnBD(true);   // espera a guardar
      location.href = btnVolver.href;
    });
  }

  // ===================== Inicializar =====================
  async function start() {
    YEAR_ID = await getYearId();
    PRAPS   = await cargarDesdeBD();   // PRAP asociados a ese año + poa
    DIRTY   = false;
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
