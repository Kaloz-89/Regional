/* ===== Resumen Jefatura — Pizarrón global por Asesoría (por AÑO) ===== */
(() => {
  "use strict";

  // ---------- Helpers ----------
  const readJSON = (k, fb = null) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  };
  const uniq = (arr = []) =>
    Array.from(new Set(arr.map(v => String(v).trim()).filter(Boolean)));
  const norm = s => String(s || "")
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

  // Año activo (humano)
  const AppYearLS = (() => {
    const KEY = "app_year_v1", DEF = 2025;
    return {
      get: () => parseInt(localStorage.getItem(KEY) || DEF, 10) || DEF
    };
  })();

  // Clave del espejo de visitas
  const STORE_KEY = "visitas_jefatura_v1";

  // Prefijo MR (no lo tocamos, se sigue leyendo de LS)
  const MR_PREFIX = "marco_referencia_catalogos_v1";
  const mrKeyFor  = (y) => `${MR_PREFIX}_${y}`;

  // Canon circuito -> circuito0X
  const canonCircuitKey = (input) => {
    const m = norm(input).match(/\d+/);
    if (m) {
      const n = Math.max(1, Math.min(99, parseInt(m[0], 10)));
      return `circuito${String(n).padStart(2, '0')}`;
    }
    if (norm(input).includes('circuit')) return 'circuito01';
    return '';
  };

  // Meses y alias
  const MONTHS_CANON = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"
  ];
  const MONTHS_ALIASES = new Map([
    ["ene","Enero"],["enero","Enero"],["feb","Febrero"],["febrero","Febrero"],
    ["mar","Marzo"],["marzo","Marzo"],["abr","Abril"],["abril","Abril"],
    ["may","Mayo"],["mayo","Mayo"],["jun","Junio"],["junio","Junio"],
    ["jul","Julio"],["julio","Julio"],["ago","Agosto"],["agosto","Agosto"],
    ["set","Setiembre"],["sep","Setiembre"],["sept","Setiembre"],
    ["setiembre","Setiembre"],["septiembre","Setiembre"],
    ["oct","Octubre"],["octubre","Octubre"],["nov","Noviembre"],
    ["noviembre","Noviembre"],["dic","Diciembre"],["diciembre","Diciembre"]
  ]);
  const canonMonth = m =>
    MONTHS_ALIASES.get(norm(m)) ||
    MONTHS_CANON.find(x => norm(x) === norm(m)) || "";
  const canonPrio  = p => {
    const n = norm(p);
    if (n.includes("alta"))  return "Alta";
    if (n.includes("media")) return "Media";
    return "No Aplica";
  };

  // Normaliza una fila a las claves canónicas
  function normalizeRow(r) {
    const row = r || {};
    return {
      asesoria:  String(row.asesoria || row.Asesoría || "").trim(),
      circuito:  canonCircuitKey(row.circuito || row.Circuito || ""),
      mes:       canonMonth(row.mes || row.Mes || ""),
      prioridad: canonPrio(row.prioridad || row.Prioridad || "")
    };
  }

  // Marco de referencia (asesorías) — se sigue leyendo de LS
  function readMR(year) {
    const raw = readJSON(mrKeyFor(year), {}) || {};
    const ases = Array.isArray(raw.asesoria) ? raw.asesoria.map(String) : [];
    return uniq(ases);
  }

  // Visitas por año desde el espejo de LS
  function readRowsByYear(year) {
    const all = readJSON(STORE_KEY, {});
    const arr = (all && Array.isArray(all[year])) ? all[year]
              : (all && all[year] && Array.isArray(all[year].rows)) ? all[year].rows
              : [];
    return (Array.isArray(arr) ? arr : []).map(normalizeRow);
  }

  // Contadores
  function emptyCounters() {
    const obj = {
      total: 0,
      circuits: {
        circuito01: 0, circuito02: 0, circuito03: 0, circuito04: 0, circuito05: 0
      },
      months:   Object.fromEntries(MONTHS_CANON.map(m => [m, 0])),
      prio:     { "Alta": 0, "Media": 0, "No Aplica": 0 }
    };
    return JSON.parse(JSON.stringify(obj));
  }
  function accumulate(bucket, row) {
    bucket.total += 1;
    const ck  = row.circuito;
    if (ck && bucket.circuits[ck] != null) bucket.circuits[ck]++;
    const mes = row.mes;
    if (mes && bucket.months[mes] != null) bucket.months[mes]++;
    const pr  = row.prioridad;
    bucket.prio[pr] = (bucket.prio[pr] || 0) + 1;
  }

  // ========== NUEVO: resolver id_anio y refrescar espejo desde el servidor ==========
  async function resolveYearInfo() {
    const yearHuman = (window.AppYear && typeof window.AppYear.getYear === "function")
      ? window.AppYear.getYear()
      : AppYearLS.get();

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

    if (!yearId) yearId = 1; // fallback seguro

    return { year: String(yearHuman), yearId };
  }

  async function refreshMirrorFromServer() {
    try {
      const { year, yearId } = await resolveYearInfo();
      const resp = await fetch(
        "php/jefatura_listar.php?anio=" + encodeURIComponent(yearId)
      );
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.ok || !Array.isArray(data.rows)) {
        console.error("jefatura_listar.php (mirror) error", data && data.error);
        return;
      }

      const store = readJSON(STORE_KEY, {});
      store[year] = data.rows; // mismo formato que usa jefatura.js
      writeJSON(STORE_KEY, store);
      try { localStorage.setItem("visitas_jefatura_last_update", String(Date.now())); } catch {}

    } catch (e) {
      console.error("refreshMirrorFromServer resumen_jefatura", e);
    }
  }

  // ----- Tabla -----
  function renderTable(headers, rowsData, totals) {
    const thead = document.getElementById("theadPizarron");
    const tbody = document.getElementById("tbodyPizarron");
    if (!thead || !tbody) return;

    const [circuitColsVis, monthColsVis, prioColsVis] = headers.groups;

    // Mapas VISUAL -> KEY para circuitos y meses
    const circuitVisualToKey = {
      "Cir 01": "circuito01","Cir 02": "circuito02","Cir 03": "circuito03",
      "Cir 04": "circuito04","Cir 05": "circuito05"
    };
    const monthVisualToKey = {
      "Ene":"Enero","Feb":"Febrero","Mar":"Marzo","Abr":"Abril","May":"Mayo","Jun":"Junio",
      "Jul":"Julio","Ago":"Agosto","Set":"Setiembre","Oct":"Octubre","Nov":"Noviembre","Dic":"Diciembre"
    };

    const trG = document.createElement("tr");
    trG.innerHTML = `
      <th class="group" rowspan="2">Asesoría</th>
      <th class="group" rowspan="2" title="Cantidad de visitas">Cant. Visitas</th>
      <th class="group" colspan="${circuitColsVis.length}">Cantidad de Visitas por Circuito Escolar</th>
      <th class="group" colspan="${monthColsVis.length}">Cantidad de Visitas por Mes</th>
      <th class="group" colspan="${prioColsVis.length}">Visitas por Prioridad</th>
    `;
    const trN = document.createElement("tr");
    const mk = (label) => `<th>${label}</th>`;
    trN.innerHTML =
      circuitColsVis.map(mk).join("") +
      monthColsVis.map(mk).join("") +
      prioColsVis.map(mk).join("");

    thead.innerHTML = "";
    thead.appendChild(trG);
    thead.appendChild(trN);

    const rowHtml = (r) => {
      const cellsCir = circuitColsVis
        .map(vis => {
          const key = circuitVisualToKey[vis];
          return `<td class="num">${r.circuits[key] || 0}</td>`;
        }).join("");

      const cellsMon = monthColsVis
        .map(vis => {
          const key = monthVisualToKey[vis];
          return `<td class="num">${r.months[key] || 0}</td>`;
        }).join("");

      const cellsPr  = prioColsVis
        .map(p => `<td class="num">${r.prio[p] || 0}</td>`).join("");

      return `
        <tr>
          <td class="col-asesoria">${r.asesoria}</td>
          <td class="num"><strong>${r.total}</strong></td>
          ${cellsCir}${cellsMon}${cellsPr}
        </tr>
      `;
    };

    let html = rowsData.map(rowHtml).join("");

    const totCir = circuitColsVis
      .map(vis => {
        const key = circuitVisualToKey[vis];
        return `<th class="num">${totals.circuits[key] || 0}</th>`;
      }).join("");

    const totMon = monthColsVis
      .map(vis => {
        const key = monthVisualToKey[vis];
        return `<th class="num">${totals.months[key] || 0}</th>`;
      }).join("");

    const totPr  = prioColsVis
      .map(p => `<th class="num">${totals.prio[p] || 0}</th>`).join("");

    html += `
      <tr class="row-total">
        <th>Total General</th>
        <th class="num">${totals.total}</th>
        ${totCir}${totMon}${totPr}
      </tr>
    `;

    tbody.innerHTML = html;
  }

  // ----- Gráfico -----
  function renderChart(labels, values) {
    const canvas = document.getElementById('chartVisitasAsesoria');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const valueLabels = {
      id: 'valueLabels',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.font = 'bold 11px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.fillStyle = '#eaeaea';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar, i) => {
          const { x, y } = bar.tooltipPosition();
          ctx.fillText(String(chart.data.datasets[0].data[i] ?? 0), x, y - 6);
        });
        ctx.restore();
      }
    };

    function grad(chart) {
      const ca = chart.chartArea; if (!ca) return '#1e90d6';
      const g = chart.ctx.createLinearGradient(0, ca.top, 0, ca.bottom);
      g.addColorStop(0, '#1e90d6'); g.addColorStop(1, '#0b3e5c');
      return g;
    }

    if (canvas._chartInstance) canvas._chartInstance.destroy();
    canvas._chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visitas',
          data: values,
          backgroundColor: (c) => grad(c),
          borderColor: 'rgba(0,0,0,.25)',
          borderWidth: 1,
          maxBarThickness: 34,
          categoryPercentage: 0.72,
          barPercentage: 0.92
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              autoSkip: false,
              maxRotation: 50,
              minRotation: 50,
              color: '#1e293b',
              font: { size: 11, weight: '600' }
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#1e293b', precision: 0 },
            grid: { color: 'rgba(0,0,0,.08)' }
          }
        },
        plugins: { legend: { display: false } }
      },
      plugins: [valueLabels]
    });

    window.addEventListener('beforeprint', () => {
      try { canvas._chartInstance?.resize(); } catch {}
    });
  }

  // ----- Construcción + render completo -----
  function buildAndRender() {
    const YEAR = String(AppYearLS.get());
    const rows = readRowsByYear(YEAR);

    const asesFromMR   = readMR(YEAR);
    const asesFromData = uniq(rows.map(r => String(r.asesoria || "").trim()).filter(Boolean));
    const ASESORIAS    = asesFromMR.length ? asesFromMR : asesFromData;

    const headers = {
      groups: [
        ["Cir 01","Cir 02","Cir 03","Cir 04","Cir 05"],
        ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"],
        ["Alta","Media","N/A"]
      ]
    };

    const perAses = new Map();
    for (const a of ASESORIAS) perAses.set(a, { asesoria: a, ...emptyCounters() });
    const totals = emptyCounters();

    for (const r of rows) {
      const a = String(r.asesoria || "").trim();
      if (!a) continue;
      if (!perAses.has(a)) perAses.set(a, { asesoria: a, ...emptyCounters() });
      const bucket = perAses.get(a);
      accumulate(bucket, r);
      accumulate(totals, r);
    }

    const rowsData = Array.from(perAses.values()).map(v => {
      const prioVisual = {
        "Alta": v.prio["Alta"] || 0,
        "Media": v.prio["Media"] || 0,
        "N/A": v.prio["No Aplica"] || 0
      };
      return {
        asesoria: v.asesoria,
        total: v.total,
        circuits: v.circuits,
        months: v.months,
        prio: prioVisual
      };
    });

    const totalsVis = {
      total: totals.total,
      circuits: totals.circuits,
      months: totals.months,
      prio: {
        "Alta": totals.prio["Alta"] || 0,
        "Media": totals.prio["Media"] || 0,
        "N/A": totals.prio["No Aplica"] || 0
      }
    };

    renderTable(headers, rowsData, totalsVis);

    const labelsChart = Array.from(perAses.keys());
    const valuesChart = labelsChart.map(a => (perAses.get(a)?.total || 0));
    renderChart(labelsChart, valuesChart);
  }

  // ----- Auto-refresh (solo re-lee el espejo de LS) -----
  let rebuildTimer = null;
  const scheduleRebuild = () => {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(buildAndRender, 40);
  };

  function wireAutoRefresh() {
    window.addEventListener('storage', (e) => {
      if (!e || !e.key) return;
      const y = String(AppYearLS.get());
      if (
        e.key === STORE_KEY ||
        e.key === 'visitas_jefatura_last_update' ||
        e.key === 'app_year_v1' ||
        e.key === mrKeyFor(y) ||
        e.key.startsWith(MR_PREFIX)
      ) {
        scheduleRebuild();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleRebuild();
    });
    window.addEventListener('focus', scheduleRebuild);
    window.addEventListener('pageshow', scheduleRebuild);
  }

  // ----- Botones -----
  function wireActions() {
    const goBtn    = document.getElementById('btnIrJefatura');
    const printBtn = document.getElementById('btnImprimir');
    if (goBtn)    goBtn.addEventListener('click', () => { window.location.href = 'jefatura.html'; });
    if (printBtn) printBtn.addEventListener('click', () => setTimeout(() => window.print(), 60));
  }

  // Arranque
  async function start() {
    // 1) Traer siempre datos frescos de BD para el año actual
    await refreshMirrorFromServer();
    // 2) Construir tablero con lo que haya en el espejo
    buildAndRender();
    // 3) Enlaces de auto-refresco y botones
    wireAutoRefresh();
    wireActions();
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else
    start();
})();
// Redibujar cuando el sincronizador termine de actualizar el espejo
window.addEventListener("visitas_jefatura_sync", () => {
  try {
    buildAndRender();
  } catch (e) {
    console.error("Error al reconstruir resumen_jefatura tras sync:", e);
  }
});
