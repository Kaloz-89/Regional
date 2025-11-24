(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const readJSON  = (k, fb = null) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  };
  const uniqSorted = (arr = []) =>
    Array.from(new Set(arr.map(v => String(v).trim())))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));
  const norm = (s) => String(s || "")
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();

  const MR_PREFIX   = "marco_referencia_catalogos_v1";
  const MR_KEY      = (y) => `${MR_PREFIX}_${String(y)}`;
  const SINK_KEY    = "visitas_jefatura_v1";

  // Año activo (humano)
  const AppYearShim = (() => {
    if (window.AppYear && typeof window.AppYear.getYear === "function") {
      return { get: () => window.AppYear.getYear() };
    }
    const KEY = "app_year_v1", DEF = 2025;
    return {
      get: () => parseInt(localStorage.getItem(KEY) || DEF, 10) || DEF
    };
  })();
  const getYear = () => String(AppYearShim.get());

  // Circuito canónico
  const canonCircuitKey = (input) => {
    const n = norm(input);
    const m = n.match(/\d+/);
    if (m) {
      const num = Math.max(1, Math.min(99, parseInt(m[0], 10)));
      return `circuito${String(num).padStart(2, "0")}`;
    }
    if (n.includes('circuit')) return 'circuito01';
    return '';
  };
  const displayCircuit = (raw) => {
    const k = canonCircuitKey(raw);
    if (!k) return "";
    return `Circuito ${k.replace('circuito', '')}`;
  };

  // Meses (orden fijo español)
  const MES_ORDER = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Setiembre","Septiembre",
    "Octubre","Noviembre","Diciembre"
  ];
  const MES_CANON = (m) => {
    const s = norm(m);
    if (s.startsWith("setiem"))  return "Setiembre";
    if (s.startsWith("septiem")) return "Septiembre";
    const cap = String(m || "").toLowerCase();
    return cap.charAt(0).toUpperCase() + cap.slice(1);
  };

  // ---------- Estado ----------
  let YEAR     = getYear();
  let MR       = {};
  let VISITAS  = [];

  // ========== NUEVO: resolver id_anio y refrescar espejo desde el servidor ==========
  async function resolveYearInfo() {
    const yearHuman = Number(getYear());
    let yearId = 0;

    try {
      const resp = await fetch("php/anio_listar.php");
      const data = await resp.json().catch(() => null);
      if (resp.ok && data && data.ok && Array.isArray(data.anios)) {
        for (const item of data.anios) {
          if (Number(item.anio) === Number(yearHuman)) {
            yearId = Number(item.id_anio ?? item.id);
            break;
          }
        }
      }
    } catch (e) {
      console.error("anio_listar.php error", e);
    }

    if (!yearId) yearId = 1;
    return { year: String(yearHuman), yearId };
  }

  async function refreshMirrorFromServer() {
    try {
      const info = await resolveYearInfo();
      YEAR = info.year;

      const resp = await fetch("php/jefatura_listar.php?anio=" + encodeURIComponent(info.yearId));
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.ok || !Array.isArray(data.rows)) {
        console.error("jefatura_listar.php (mirror) error", data && data.error);
        return;
      }

      const store = readJSON(SINK_KEY, {});
      store[YEAR] = data.rows;
      writeJSON(SINK_KEY, store);
      try { localStorage.setItem("visitas_jefatura_last_update", String(Date.now())); } catch {}

    } catch (e) {
      console.error("refreshMirrorFromServer reporte_asesoria", e);
    }
  }

  // ---------- Carga ----------
  function loadMR() {
    const obj = readJSON(MR_KEY(YEAR), {}) || {};
    const meses        = uniqSorted(obj.meses        || []);
    const tipoVisita   = uniqSorted(obj.tipoVisita   || []);
    const cicloEscolar = uniqSorted(obj.cicloEscolar || []);
    const asesoria     = uniqSorted(obj.asesoria     || []);

    const circuits = {};
    for (let i = 1; i <= 5; i++) {
      const k = `circuito${String(i).padStart(2, '0')}`;
      circuits[k] = uniqSorted((obj[k] || []).filter(v => {
        const t = String(v || '').trim();
        if (t.length < 2) return false;
        if (/^[\p{N}]+$/u.test(t)) return false;
        if (!/[\p{L}]/u.test(t)) return false;
        return true;
      }));
    }
    MR = { meses, tipoVisita, cicloEscolar, asesoria, ...circuits };
  }

  function loadVisitas() {
    const all = readJSON(SINK_KEY, {}) || {};
    const arr = Array.isArray(all[YEAR]) ? all[YEAR]
              : (all[YEAR] && Array.isArray(all[YEAR].rows)) ? all[YEAR].rows
              : [];
    VISITAS = arr.map(v => ({
      asesoria:     String(v.asesoria     || ""),
      circuito:     String(v.circuito     || ""),
      institucion:  String(v.institucion  || ""),
      mes:          String(v.mes          || ""),
      fecha:        String(v.fecha        || ""),
      tipoVisita:   String(v.tipoVisita   || ""),
      cicloEscolar: String(v.cicloEscolar || ""),
      tematica:     String(v.tematica     || ""),
      prioridad:    String(v.prioridad    || ""),
      observacion:  String(v.observacion  || "")
    }));
  }

  // ---------- Render UI ----------
  function fillAsesoriaSelect() {
    const sel = $("#selAsesoria");
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option hidden selected value="">Seleccionar asesoría…</option>';
    MR.asesoria.forEach(a => {
      const o = document.createElement('option');
      o.value = a; o.textContent = a;
      sel.appendChild(o);
    });
    if (prev && MR.asesoria.includes(prev)) sel.value = prev;
  }

  function renderTable(filtered) {
    const tbody = $("#tbodyAsesoria");
    tbody.innerHTML = "";
    for (const r of filtered) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell">${r.asesoria}</td>
        <td class="cell">${displayCircuit(r.circuito)}</td>
        <td class="cell">${r.institucion}</td>
        <td class="cell">${MES_CANON(r.mes)}</td>
        <td class="cell">${r.fecha}</td>
        <td class="cell">${r.tipoVisita}</td>
        <td class="cell">${r.cicloEscolar}</td>
        <td class="cell">${r.tematica}</td>
        <td class="cell">${r.prioridad}</td>
        <td class="cell">${r.observacion}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function renderKpis(filtered) {
    // --- Tipo de visita
    const byTipo = new Map(MR.tipoVisita.map(t => [t, 0]));
    for (const r of filtered) {
      const key = MR.tipoVisita.find(t => norm(t) === norm(r.tipoVisita));
      if (key) byTipo.set(key, byTipo.get(key) + 1);
      else if (r.tipoVisita) {
        const k = r.tipoVisita;
        byTipo.set(k, (byTipo.get(k) || 0) + 1);
      }
    }
    const tbodyTipo = $("#kpiTipoVisita tbody");
    tbodyTipo.innerHTML = "";
    let totalTipo = 0;
    for (const [k, v] of byTipo) {
      totalTipo += v;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${k}</td><td class="num">${v}</td>`;
      tbodyTipo.appendChild(tr);
    }
    $("#kpiTipoTotal").textContent = String(totalTipo);

    // --- Circuito
    const circuitRows = [];
    for (let i = 1; i <= 5; i++) {
      const disp = `Circuito ${String(i).padStart(2, '0')}`;
      circuitRows.push([disp, 0]);
    }
    for (const r of filtered) {
      const disp = displayCircuit(r.circuito);
      const row = circuitRows.find(x => x[0] === disp);
      if (row) row[1] += 1;
    }
    const tbodyC = $("#kpiCircuito tbody");
    tbodyC.innerHTML = "";
    circuitRows.forEach(([k, v]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${k}</td><td class="num">${v}</td>`;
      tbodyC.appendChild(tr);
    });

    // --- Mes
    const mesesCanon = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"
    ];
    const byMes = new Map(mesesCanon.map(m => [m, 0]));
    for (const r of filtered) {
      const mcanon = MES_CANON(r.mes);
      const fixed = byMes.has(mcanon) ? mcanon
                   : (mcanon === "Septiembre" ? "Setiembre" : mcanon);
      if (byMes.has(fixed)) byMes.set(fixed, byMes.get(fixed) + 1);
    }
    const tbodyMes = $("#kpiMes tbody");
    tbodyMes.innerHTML = "";
    for (const m of mesesCanon) {
      const v = byMes.get(m) || 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m}</td><td class="num">${v}</td>`;
      tbodyMes.appendChild(tr);
    }

    // --- Prioridad
    const PKEYS = ["Alta","Media","No aplica"];
    const byPri = new Map(PKEYS.map(p => [p, 0]));
    for (const r of filtered) {
      const n = norm(r.prioridad);
      let k = "No aplica";
      if (n.startsWith("alt")) k = "Alta";
      else if (n.startsWith("med")) k = "Media";
      else if (n.includes("no aplica") || n === "") k = "No aplica";
      byPri.set(k, byPri.get(k) + 1);
    }
    const tbodyP = $("#kpiPrioridad tbody");
    tbodyP.innerHTML = "";
    for (const k of PKEYS) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${k}</td><td class="num">${byPri.get(k) || 0}</td>`;
      tbodyP.appendChild(tr);
    }
  }

  function applyFilter() {
    const sel = $("#selAsesoria");
    const as = sel?.value || "";
    const pill = $("#yearPill");
    if (pill) pill.textContent = `Año ${YEAR}`;

    const filtered = as
      ? VISITAS.filter(v => norm(v.asesoria) === norm(as))
      : [];

    renderTable(filtered);
    renderKpis(filtered);
  }

  // ---------- Eventos ----------
  function bindUI() {
    $("#selAsesoria")?.addEventListener("change", applyFilter);

    // Cambio de año global
    window.addEventListener("yearchange", async (ev) => {
      YEAR = String(ev?.detail?.year ?? getYear());
      await refreshMirrorFromServer();
      loadMR();
      loadVisitas();
      fillAsesoriaSelect();
      applyFilter();
    });

    // Reaccionar a aportes desde jefatura/formulario (sin ir a BD)
    window.addEventListener("storage", (ev) => {
      if (
        ev.key === SINK_KEY ||
        ev.key === MR_KEY(YEAR) ||
        ev.key === 'visitas_jefatura_last_update'
      ) {
        loadMR();
        loadVisitas();
        fillAsesoriaSelect();
        applyFilter();
      }
    });
  }

  // ---------- Init ----------
  async function start() {
    YEAR = getYear();
    // Traer siempre datos frescos de BD para el año activo
    await refreshMirrorFromServer();
    // Luego cargar MR + visitas desde el espejo
    loadMR();
    loadVisitas();
    fillAsesoriaSelect();
    applyFilter();
    bindUI();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();

})();
