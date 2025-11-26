// oferta_formativa.js
// Admin: edición tipo Excel  + BD por AÑO
// Público: solo lectura (misma info) + imprimir
(() => {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);

  // Detectar modo según la tabla presente
  const tablaAdmin  = $("#tablaOferta");
  const tablaPublic = $("#tablaOfertaView");
  const IS_ADMIN    = !!tablaAdmin;

  // tbody según modo
  const tbody = IS_ADMIN ? $("#ofTbody") : $("#ofTbodyView");
  if (!tbody) return; // nada que hacer

  // -------- Año activo ----------  
  const AppYear =
    window.AppYear ||
    (() => {
      const KEY = "app_year_v1";
      const DEF = 2025;
      return {
        getYear: () => parseInt(localStorage.getItem(KEY) || DEF, 10) || DEF,
      };
    })();

  async function resolveYearInfo() {
    const year = AppYear.getYear();
    let yearId = 0;

    try {
      const resp = await fetch("php/anio_listar.php");
      const data = await resp.json().catch(() => null);
      if (resp.ok && data && data.ok && Array.isArray(data.anios)) {
        for (const item of data.anios) {
          if (Number(item.anio) === Number(year)) {
            yearId = Number(item.id_anio ?? item.id);
            break;
          }
        }
      }
    } catch (e) {
      console.error("anio_listar error", e);
    }

    if (!yearId) yearId = 1;
    return { year: String(year), yearId };
  }

  // -------- Estado global ----------  
  let YEAR    = "2025";
  let YEAR_ID = 1;
  let ROWS    = [];
  let DIRTY   = false;
  let CID_COUNT = 1;

  // Orden de campos = columnas de la tabla (sin la de borrar)
  const FIELDS = [
    "trimestre",
    "brecha",
    "objetivo",
    "nombre",
    "clase",
    "estrategia",
    "modalidad",
    "horas",
    "grupos",
    "poblacion",
    "fecha_ini",
    "fecha_fin",
    "instancia",
    "actividad_realizada", // tinyint
    "cant_hombres",        // int
    "cant_mujeres"         // int
  ];

  const val = (v) => (v == null ? "" : String(v));

  function normBool(v) {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "1" || s === "si" || s === "sí" || s === "true") return "1";
    return "0";
  }

  function newCid() {
    return "of_" + CID_COUNT++;
  }

  function normalizeRow(src) {
    const r = src || {};
    return {
      id: r.id && Number.isFinite(+r.id) ? Number(r.id) : 0,
      cid: r.cid || newCid(),
      trimestre: val(r.trimestre),
      brecha: val(r.brecha),
      objetivo: val(r.objetivo),
      nombre: val(r.nombre),
      clase: val(r.clase),
      estrategia: val(r.estrategia),
      modalidad: val(r.modalidad),
      horas: val(r.horas),
      grupos: val(r.grupos),
      poblacion: val(r.poblacion),
      fecha_ini: val(r.fecha_ini),
      fecha_fin: val(r.fecha_fin),
      instancia: val(r.instancia),
      actividad_realizada: normBool(r.actividad_realizada),
      cant_hombres: val(r.cant_hombres),
      cant_mujeres: val(r.cant_mujeres),
    };
  }

  // -------- Carga desde BD ----------  
  async function loadRowsFromDB() {
    try {
      const resp = await fetch(
        "php/oferta_formativa_listar.php?anio=" +
          encodeURIComponent(YEAR_ID)
      );
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || !data.ok || !Array.isArray(data.rows)) {
        console.error("oferta_formativa_listar error", data && data.error);
        return [];
      }
      return data.rows.map(normalizeRow);
    } catch (e) {
      console.error("loadRowsFromDB oferta", e);
      return [];
    }
  }

  // -------- Guardar en BD (solo admin) ----------  
  async function saveAllToDB(blocking) {
    if (!IS_ADMIN) return; // público no guarda
    if (!DIRTY) return;

    const payload = {
      anio: YEAR_ID,
      rows: ROWS.map((r) => ({
        id: r.id,
        trimestre: r.trimestre,
        brecha: r.brecha,
        objetivo: r.objetivo,
        nombre: r.nombre,
        clase: r.clase,
        estrategia: r.estrategia,
        modalidad: r.modalidad,
        horas: r.horas,
        grupos: r.grupos,
        poblacion: r.poblacion,
        fecha_ini: r.fecha_ini,
        fecha_fin: r.fecha_fin,
        instancia: r.instancia,
        actividad_realizada: r.actividad_realizada === "1" ? 1 : 0,
        cant_hombres:
          r.cant_hombres === "" ? null : Number(r.cant_hombres || 0),
        cant_mujeres:
          r.cant_mujeres === "" ? null : Number(r.cant_mujeres || 0),
      })),
    };

    const json = JSON.stringify(payload);

    try {
      if (!blocking && navigator.sendBeacon) {
        const blob = new Blob([json], { type: "application/json" });
        navigator.sendBeacon("php/oferta_formativa_guardar_lote.php", blob);
      } else {
        const resp = await fetch("php/oferta_formativa_guardar_lote.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        const txt = await resp.text();
        let data = null;
        try {
          data = JSON.parse(txt);
        } catch {}
        if (!resp.ok || !data || !data.ok) {
          const msg =
            (data &&
              (data.error ||
                (data.errors && data.errors.join("\n")))) ||
            "Error al guardar oferta formativa: " + txt;
          alert(msg);
          console.error(msg);
          return;
        }
      }

      DIRTY = false;
    } catch (e) {
      console.error("saveAllToDB oferta", e);
    }
  }

  // -------- Mutaciones (solo admin) ----------  
  function markDirty() {
    if (!IS_ADMIN) return;
    DIRTY = true;
  }

  function findIndexByCid(cid) {
    return ROWS.findIndex((r) => r.cid === cid);
  }

  function updateRow(cid, patch) {
    if (!IS_ADMIN) return;
    const idx = findIndexByCid(cid);
    if (idx < 0) return;
    const p = { ...patch };
    if ("actividad_realizada" in p) {
      p.actividad_realizada = normBool(p.actividad_realizada);
    }
    ROWS[idx] = { ...ROWS[idx], ...p };
    markDirty();
  }

  function deleteRow(cid) {
    if (!IS_ADMIN) return;
    const idx = findIndexByCid(cid);
    if (idx < 0) return;
    ROWS.splice(idx, 1);
    markDirty();
    render();
  }

  function addRow() {
    if (!IS_ADMIN) return;
    const r = normalizeRow({
      id: 0,
      actividad_realizada: "0",
      cant_hombres: "",
      cant_mujeres: "",
    });
    ROWS.push(r);
    markDirty();
    render();
  }

  // -------- Render ----------  
  function render() {
    if (!tbody) return;
    tbody.innerHTML = "";

    for (const row of ROWS) {
      const tr = document.createElement("tr");
      tr.dataset.cid = row.cid;

      if (IS_ADMIN) {
        // === MODO ADMIN: editable ===

        // helper para celdas texto
        function editableCell(key) {
          const td = document.createElement("td");
          td.contentEditable = "true";
          td.textContent = row[key] || "";
          td.addEventListener("input", () => {
            updateRow(row.cid, { [key]: td.textContent.trim() });
          });
          tr.appendChild(td);
        }

        // columnas texto
        editableCell("trimestre");
        editableCell("brecha");
        editableCell("objetivo");
        editableCell("nombre");
        editableCell("clase");
        editableCell("estrategia");
        editableCell("modalidad");
        editableCell("horas");
        editableCell("grupos");
        editableCell("poblacion");
        editableCell("fecha_ini");
        editableCell("fecha_fin");
        editableCell("instancia");

        // columna tinyint: checkbox Sí / No
        {
          const td = document.createElement("td");
          td.style.textAlign = "center";
          td.contentEditable = "false";

          const chk = document.createElement("input");
          chk.type = "checkbox";
          chk.checked = row.actividad_realizada === "1";
          chk.title = "Actividad realizada (Sí/No)";

          const lbl = document.createElement("span");
          lbl.style.marginLeft = "4px";
          lbl.textContent = chk.checked ? "Sí" : "No";

          chk.addEventListener("change", () => {
            updateRow(row.cid, {
              actividad_realizada: chk.checked ? "1" : "0",
            });
            lbl.textContent = chk.checked ? "Sí" : "No";
          });

          td.appendChild(chk);
          td.appendChild(lbl);
          tr.appendChild(td);
        }

        // cantidades hombres / mujeres (texto pero numérico en BD)
        editableCell("cant_hombres");
        editableCell("cant_mujeres");

        // columna eliminar
        const tdDel = document.createElement("td");
        tdDel.className = "col-del";
        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.className = "btn-trash";
        btnDel.title = "Eliminar fila";
        btnDel.textContent = "🗑️";
        btnDel.addEventListener("click", () => deleteRow(row.cid));
        tdDel.style.textAlign = "center";
        tdDel.appendChild(btnDel);
        tr.appendChild(tdDel);
      } else {
        // === MODO PÚBLICO: solo lectura, sin columna eliminar ===
        function readonlyCell(text) {
          const td = document.createElement("td");
          td.textContent = text;
          tr.appendChild(td);
        }

        readonlyCell(row.trimestre);
        readonlyCell(row.brecha);
        readonlyCell(row.objetivo);
        readonlyCell(row.nombre);
        readonlyCell(row.clase);
        readonlyCell(row.estrategia);
        readonlyCell(row.modalidad);
        readonlyCell(row.horas);
        readonlyCell(row.grupos);
        readonlyCell(row.poblacion);
        readonlyCell(row.fecha_ini);
        readonlyCell(row.fecha_fin);
        readonlyCell(row.instancia);

        // actividad_realizada → texto "Sí" / "No"
        readonlyCell(row.actividad_realizada === "1" ? "Sí" : "No");

        // cantidades
        readonlyCell(row.cant_hombres);
        readonlyCell(row.cant_mujeres);
      }

      tbody.appendChild(tr);
    }
  }

  // -------- UI y eventos globales ----------  
  function bindUI() {
    const btnAdd   = $("#ofAdd");
    const btnPrint = IS_ADMIN ? $("#ofPrint") : $("#ofPrintView");

    if (IS_ADMIN && btnAdd) {
      btnAdd.addEventListener("click", addRow);
    }
    if (btnPrint) {
      btnPrint.addEventListener("click", () => window.print());
    }

    // actualizar texto de año en el título (admin y público)
    const spanYear = document.querySelector("h1 .muted");
    if (spanYear) spanYear.textContent = `— Año ${YEAR}`;

    // guardar al cerrar / refrescar (solo admin)
    if (IS_ADMIN) {
      window.addEventListener("beforeunload", () => {
        if (!DIRTY) return;
        saveAllToDB(false);
      });
    }

    // botón Volver: en admin guardamos antes de salir
    const volver = document.querySelector(".nav-volver a");
    if (volver && IS_ADMIN) {
      volver.addEventListener("click", async (ev) => {
        ev.preventDefault();
        await saveAllToDB(true);
        location.href = volver.href;
      });
    }

    // cambio de año global
    window.addEventListener("yearchange", async () => {
      if (IS_ADMIN) {
        await saveAllToDB(false);
      }
      location.reload();
    });
  }

  // -------- Arranque ----------  
  async function start() {
    const info = await resolveYearInfo();
    YEAR    = info.year;
    YEAR_ID = info.yearId;

    ROWS  = await loadRowsFromDB();
    DIRTY = false;
    render();
    bindUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
