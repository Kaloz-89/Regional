(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const readJSON  = (k, fb = null) => { try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ===== Año activo (mismo esquema que jefatura.js) =====
  const AppYear = window.AppYear || (() => {
    const KEY = "app_year_v1";
    const DEF = 2025;
    return {
      getYear: () => parseInt(localStorage.getItem(KEY) || DEF, 10) || DEF
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
            yearId = Number(item.id_anio ?? item.id); // por si tu campo se llama id_anio
            break;
          }
        }
      }
    } catch (e) {
      console.error("anio_listar.php error", e);
    }

    if (!yearId) yearId = 1; // fallback

    return { year: String(year), yearId };
  }

  // ===== Estado =====
  let YEAR    = "2025";
  let YEAR_ID = 1;

  let CATALOGS = {
    meses:        [],
    tipoVisita:   [],
    cicloEscolar: [],
    asesoria:     []
  };

  let CIRCUITOS = {
    circuito01: [],
    circuito02: [],
    circuito03: [],
    circuito04: [],
    circuito05: []
  };

  const STORAGE_KEY = "visitas_jefatura_v1";

  const DEFAULT_MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"
  ];

  const uniqSorted = (arr=[]) =>
    Array.from(new Set(arr.map(v => String(v).trim())))
      .filter(Boolean)
      .sort((a,b)=>a.localeCompare(b,"es",{numeric:true,sensitivity:"base"}));

  const norm = s => String(s||"")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();

  // Circuito "Circuito 02" / "Circuito02" -> "circuito02"
  const canonCircuitKey = (input) => {
    const n = norm(input);
    const m = n.match(/\d+/);
    if (m) {
      const num = Math.max(1, Math.min(99, parseInt(m[0],10)));
      return `circuito${String(num).padStart(2,"0")}`;
    }
    if (n.includes("circuit")) return "circuito01";
    return "";
  };

  // ===== Carga desde PHP (mismos endpoints que usa jefatura.js) =====
  async function loadCatalogsFromDB() {
    try {
      const resp = await fetch("php/marco_referencia_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.ok) {
        console.error("marco_referencia_listar.php error", data && data.error);
        CATALOGS = {
          meses:        [...DEFAULT_MESES],
          tipoVisita:   [],
          cicloEscolar: [],
          asesoria:     []
        };
        return;
      }

      CATALOGS = {
        meses:        [...DEFAULT_MESES], // meses vienen fijos
        tipoVisita:   (data.tipoVisita   || []).map(r => r.texto),
        cicloEscolar: (data.cicloEscolar || []).map(r => r.texto),
        asesoria:     (data.asesoria     || []).map(r => r.texto)
      };

      CATALOGS.meses = uniqSorted(CATALOGS.meses);
      CATALOGS.tipoVisita   = uniqSorted(CATALOGS.tipoVisita);
      CATALOGS.cicloEscolar = uniqSorted(CATALOGS.cicloEscolar);
      CATALOGS.asesoria     = uniqSorted(CATALOGS.asesoria);

    } catch (e) {
      console.error("loadCatalogsFromDB", e);
      CATALOGS = {
        meses:        [...DEFAULT_MESES],
        tipoVisita:   [],
        cicloEscolar: [],
        asesoria:     []
      };
    }
  }

  async function loadCircuitsFromDB() {
    try {
      const resp = await fetch("php/circuito_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.ok || !data.circuitos) {
        console.error("circuito_listar.php error", data && data.error);
        return;
      }

      const out = { circuito01:[], circuito02:[], circuito03:[], circuito04:[], circuito05:[] };
      for (const key of Object.keys(out)) {
        const arr = data.circuitos[key] || [];
        out[key] = uniqSorted(arr.map(r => r.texto));
      }
      CIRCUITOS = out;

    } catch (e) {
      console.error("loadCircuitsFromDB", e);
    }
  }

  // ===== UI helpers =====
  function fillSelect(el, values, placeholder) {
    if (!el) return;
    el.innerHTML = "";

    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.hidden = true;
    opt0.selected = true;
    opt0.textContent = placeholder;
    el.appendChild(opt0);

    (values || []).forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      el.appendChild(o);
    });
  }

  function updateInstitucionesPorCircuito() {
    const selC = $("#circuito");
    const selI = $("#institucion");
    if (!selC || !selI) return;

    const key = canonCircuitKey(selC.value || selC.options[selC.selectedIndex]?.text);
    const lista = CIRCUITOS[key] || [];

    if (!lista.length) {
      selI.disabled = true;
      selI.innerHTML = '<option value="" hidden selected>No hay instituciones</option>';
      return;
    }

    fillSelect(selI, lista, "Seleccionar institución…");
    selI.disabled = false;
  }

  function renderCombos() {
    fillSelect($("#asesoria"),     CATALOGS.asesoria,     "Seleccionar asesoría…");
    fillSelect($("#mes"),          CATALOGS.meses,        "Seleccionar mes…");
    fillSelect($("#tipoVisita"),   CATALOGS.tipoVisita,   "Seleccionar tipo…");
    fillSelect($("#cicloEscolar"), CATALOGS.cicloEscolar, "Seleccionar ciclo…");

    const pill = $("#yearPill");
    if (pill) pill.textContent = `Año ${YEAR}`;

    // circuito -> instituciones dependientes
    const selC = $("#circuito");
    if (selC) {
      selC.addEventListener("change", updateInstitucionesPorCircuito);
      updateInstitucionesPorCircuito(); // primera vez
    }
  }

  // ===== Envío del formulario =====
  function bindSubmit() {
    const form = $("#frmVisita");
    if (!form) return;

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const payload = {
        year:        parseInt(YEAR, 10),
        asesoria:    $("#asesoria").value || "",
        circuito:    $("#circuito").value || "",
        institucion: $("#institucion").value || "",
        mes:         $("#mes").value || "",
        fecha:       $("#fecha").value || "",
        tipoVisita:  $("#tipoVisita").value || "",
        cicloEscolar:$("#cicloEscolar").value || "",
        tematica:    $("#tematica").value || "",
        observacion: $("#observacion").value || ""
      };

      if (
        !payload.asesoria ||
        !payload.circuito ||
        !payload.institucion ||
        !payload.mes ||
        !payload.fecha ||
        !payload.tipoVisita ||
        !payload.cicloEscolar
      ) {
        alert("Faltan campos obligatorios.");
        return;
      }

      try {
        const resp = await fetch("php/jefatura_insertar.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const txt  = await resp.text();
        let data   = null;
        try { data = JSON.parse(txt); } catch { data = null; }

        if (!resp.ok || !data || !data.ok) {
          console.error("jefatura_insertar.php respuesta:", txt);
          const msg = (data && data.error) ? data.error : "Error al guardar";
          throw new Error(msg);
        }

        alert("Visita guardada correctamente.");

        // Actualizar espejo en localStorage para que resumen / reporte se refresquen
        const store = readJSON(STORAGE_KEY, {});
        const arr   = store[YEAR] || [];

        arr.push({
          id:          data.id || Date.now(),
          asesoria:    payload.asesoria,
          circuito:    payload.circuito,
          institucion: payload.institucion,
          mes:         payload.mes,
          fecha:       payload.fecha,
          tipoVisita:  payload.tipoVisita,
          cicloEscolar:payload.cicloEscolar,
          tematica:    payload.tematica,
          prioridad:   "No Aplica",
          observacion: payload.observacion,
          validacionJefatura: "Pendiente",
          estado:            "Sin revisar"
        });

        store[YEAR] = arr;
        writeJSON(STORAGE_KEY, store);
        localStorage.setItem("visitas_jefatura_last_update", String(Date.now()));

        form.reset();
        updateInstitucionesPorCircuito(); // dejar instituciones en "no hay"

      } catch (e) {
        console.error("Error al guardar visita:", e);
        alert("Error al guardar visita: " + e.message);
      }
    });

    $("#btnLimpiar")?.addEventListener("click", () => {
      form.reset();
      updateInstitucionesPorCircuito();
    });
  }

  // ===== Init =====
  async function start() {
    const info = await resolveYearInfo();
    YEAR    = info.year;
    YEAR_ID = info.yearId;

    await Promise.all([
      loadCatalogsFromDB(),
      loadCircuitsFromDB()
    ]);

    renderCombos();
    bindSubmit();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
