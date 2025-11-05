/* ===== Resumen Jefatura — Pizarrón global por Asesoría (por AÑO) ===== */
(() => {
  "use strict";

  // ---------- Helpers ----------
  const readJSON = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const uniq     = (arr=[]) => Array.from(new Set(arr.map(v=>String(v).trim()).filter(Boolean)));
  const norm     = s => String(s||"").normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

  // Año activo
  const AppYear = (() => {
    const KEY="app_year_v1", DEF=2025;
    return { get: () => parseInt(localStorage.getItem(KEY)||DEF,10)||DEF };
  })();

  // Claves de almacenamiento
  const STORE_KEY = "visitas_jefatura_v1";
  const MR_PREFIX = "marco_referencia_catalogos_v1";
  const mrKeyFor  = (y) => `${MR_PREFIX}_${y}`;

  // Canon circuito -> circuito0X
  const canonCircuitKey = (input) => {
    const m = norm(input).match(/\d+/);
    if (m) return `circuito${String(Math.max(1, Math.min(99, parseInt(m[0],10))).toString().padStart(2,'0'))}`;
    if (norm(input).includes('circuit')) return 'circuito01';
    return '';
  };

  // Meses y alias
  const MONTHS_CANON = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"];
  const MONTHS_ALIASES = new Map([
    ["ene","Enero"],["enero","Enero"],["feb","Febrero"],["febrero","Febrero"],["mar","Marzo"],["marzo","Marzo"],
    ["abr","Abril"],["abril","Abril"],["may","Mayo"],["mayo","Mayo"],["jun","Junio"],["junio","Junio"],
    ["jul","Julio"],["julio","Julio"],["ago","Agosto"],["agosto","Agosto"],
    ["set","Setiembre"],["sep","Setiembre"],["sept","Setiembre"],["setiembre","Setiembre"],["septiembre","Setiembre"],
    ["oct","Octubre"],["octubre","Octubre"],["nov","Noviembre"],["noviembre","Noviembre"],
    ["dic","Diciembre"],["diciembre","Diciembre"]
  ]);
  const canonMonth = m => MONTHS_ALIASES.get(norm(m)) || MONTHS_CANON.find(x => norm(x)===norm(m)) || "";
  const canonPrio  = p => { const n=norm(p); if(n.includes("alta"))return"Alta"; if(n.includes("media"))return"Media"; return"No Aplica"; };

  // Marco de referencia (asesorías)
  function readMR(year){
    const raw = readJSON(mrKeyFor(year), {}) || {};
    const ases = Array.isArray(raw.asesoria) ? raw.asesoria.map(String) : [];
    return uniq(ases);
  }

  // Visitas por año
  function readRowsByYear(year){
    const all = readJSON(STORE_KEY, {});
    const arr = (all && Array.isArray(all[year])) ? all[year]
              : (all && all[year] && Array.isArray(all[year].rows)) ? all[year].rows
              : [];
    return Array.isArray(arr) ? arr : [];
  }

  // Contadores
  function emptyCounters(){
    const obj = {
      total: 0,
      circuits: { circuito01:0, circuito02:0, circuito03:0, circuito04:0, circuito05:0 },
      months:   Object.fromEntries(MONTHS_CANON.map(m => [m, 0])),
      prio:     { "Alta":0, "Media":0, "No Aplica":0 }
    };
    return JSON.parse(JSON.stringify(obj));
  }
  function accumulate(bucket, row){
    bucket.total += 1;
    const ck  = canonCircuitKey(row.circuito || row.Circuito || "");
    if (ck && bucket.circuits[ck] != null) bucket.circuits[ck]++;
    const mes = canonMonth(row.mes || row.Mes || "");
    if (mes && bucket.months[mes] != null) bucket.months[mes]++;
    const pr  = canonPrio(row.prioridad || row.Prioridad || "");
    bucket.prio[pr] = (bucket.prio[pr] || 0) + 1;
  }

  // ----- Tabla -----
  function renderTable(headers, rowsData, totals){
    const thead = document.getElementById("theadPizarron");
    const tbody = document.getElementById("tbodyPizarron");
    if (!thead || !tbody) return;

    const [circuitCols, monthCols, prioCols] = headers.groups;

    const trG = document.createElement("tr");
    trG.innerHTML = `
      <th class="group" rowspan="2">Asesoría</th>
      <th class="group" rowspan="2" title="Cantidad de visitas">Cant. Visitas</th>
      <th class="group" colspan="${circuitCols.length}">Cantidad de Visitas por Circuito Escolar</th>
      <th class="group" colspan="${monthCols.length}">Cantidad de Visitas por Mes</th>
      <th class="group" colspan="${prioCols.length}">Visitas por Prioridad</th>
    `;
    const trN = document.createElement("tr");
    const mk = (label) => `<th>${label}</th>`;
    trN.innerHTML =
      circuitCols.map(mk).join("") +
      monthCols.map(mk).join("") +
      prioCols.map(mk).join("");

    thead.innerHTML = "";
    thead.appendChild(trG);
    thead.appendChild(trN);

    const rowHtml = (r) => {
      const cellsCir = circuitCols.map(k => `<td class="num">${r.circuits[k]||0}</td>`).join("");
      const cellsMon = monthCols.map(m => `<td class="num">${r.months[m]||0}</td>`).join("");
      const cellsPr  = prioCols.map(p => `<td class="num">${r.prio[p]||0}</td>`).join("");
      return `
        <tr>
          <td class="col-asesoria">${r.asesoria}</td>
          <td class="num"><strong>${r.total}</strong></td>
          ${cellsCir}${cellsMon}${cellsPr}
        </tr>
      `;
    };

    let html = rowsData.map(rowHtml).join("");

    const totCir = circuitCols.map(k => `<th class="num">${totals.circuits[k]||0}</th>`).join("");
    const totMon = monthCols.map(m => `<th class="num">${totals.months[m]||0}</th>`).join("");
    const totPr  = prioCols.map(p => `<th class="num">${totals.prio[p]||0}</th>`).join("");

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
  function renderChart(labels, values){
    const canvas = document.getElementById('chartVisitasAsesoria');
    if (!canvas || typeof Chart === 'undefined') return;
    const ctx = canvas.getContext('2d');

    const valueLabels = {
      id: 'valueLabels',
      afterDatasetsDraw(chart){
        const {ctx} = chart;
        ctx.save();
        ctx.font = 'bold 11px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
        ctx.fillStyle = '#eaeaea';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const meta = chart.getDatasetMeta(0);
        meta.data.forEach((bar, i) => {
          const {x, y} = bar.tooltipPosition();
          ctx.fillText(String(chart.data.datasets[0].data[i] ?? 0), x, y - 6);
        });
        ctx.restore();
      }
    };

    function grad(chart){
      const ca = chart.chartArea; if (!ca) return '#1e90d6';
      const g = chart.ctx.createLinearGradient(0, ca.top, 0, ca.bottom);
      g.addColorStop(0,'#1e90d6'); g.addColorStop(1,'#0b3e5c');
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
          backgroundColor: (c)=>grad(c),
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
          x: { ticks: { autoSkip:false, maxRotation:50, minRotation:50, color:'#1e293b', font:{size:11, weight:'600'} }, grid: { display:false } },
          y: { beginAtZero:true, ticks: { color:'#1e293b', precision:0 }, grid: { color:'rgba(0,0,0,.08)' } }
        },
        plugins: { legend:{display:false} }
      },
      plugins:[valueLabels]
    });

    // Asegura tamaño correcto al imprimir
    window.addEventListener('beforeprint', () => {
      try { canvas._chartInstance?.resize(); } catch {}
    });
  }

  // ----- Construcción + render completo -----
  function buildAndRender(){
    const YEAR = String(AppYear.get());
    const rows = readRowsByYear(YEAR);

    const asesFromMR   = readMR(YEAR);
    const asesFromData = uniq(rows.map(r => String(r.asesoria||r.Asesoría||"").trim()).filter(Boolean));
    const ASESORIAS    = asesFromMR.length ? asesFromMR : asesFromData;

    const headers = {
      groups: [
        ["Cir 01","Cir 02","Cir 03","Cir 04","Cir 05"],
        ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Set","Oct","Nov","Dic"],
        ["Alta","Media","N/A"]
      ]
    };
    const monthVisualToKey = {
      "Ene":"Enero","Feb":"Febrero","Mar":"Marzo","Abr":"Abril","May":"Mayo","Jun":"Junio",
      "Jul":"Julio","Ago":"Agosto","Set":"Setiembre","Oct":"Octubre","Nov":"Noviembre","Dic":"Diciembre"
    };

    const perAses = new Map();
    for (const a of ASESORIAS) perAses.set(a, { asesoria:a, ...emptyCounters() });
    const totals = emptyCounters();

    for (const r of rows){
      const a = String(r.asesoria||r.Asesoria||"").trim();
      if (!a) continue;
      if (!perAses.has(a)) perAses.set(a, { asesoria:a, ...emptyCounters() });
      const bucket = perAses.get(a);
      accumulate(bucket, r);
      accumulate(totals, r);
    }

    const rowsData = Array.from(perAses.values()).map(v => {
      const monthsVisual = Object.fromEntries(
        Object.entries(v.months).map(([key,count]) => {
          const vis = Object.entries(monthVisualToKey).find(([,k]) => k===key)?.[0] || key;
          return [vis, count];
        })
      );
      const prioVisual = { "Alta": v.prio["Alta"]||0, "Media": v.prio["Media"]||0, "N/A": v.prio["No Aplica"]||0 };
      return { asesoria:v.asesoria, total:v.total, circuits:v.circuits, months:monthsVisual, prio:prioVisual };
    });

    const totalsVis = {
      total: totals.total,
      circuits: totals.circuits,
      months: Object.fromEntries(Object.entries(monthVisualToKey).map(([vis,key]) => [vis, totals.months[key]||0])),
      prio: { "Alta": totals.prio["Alta"]||0, "Media": totals.prio["Media"]||0, "N/A": totals.prio["No Aplica"]||0 }
    };

    renderTable(headers, rowsData, totalsVis);

    const labelsChart = Array.from(perAses.keys());
    const valuesChart = labelsChart.map(a => (perAses.get(a)?.total || 0));
    renderChart(labelsChart, valuesChart);
  }

  // ----- Auto-refresh (MR / visitas / año) -----
  function wireAutoRefresh(){
    window.addEventListener('storage', (e) => {
      const y = String(AppYear.get());
      if (!e || !e.key) return;
      if (e.key === STORE_KEY || e.key === 'app_year_v1' || e.key === mrKeyFor(y)) {
        buildAndRender();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) buildAndRender();
    });
  }

  // ----- Botones -----
  function wireActions(){
    const goBtn    = document.getElementById('btnIrJefatura');
    const printBtn = document.getElementById('btnImprimir');
    if (goBtn)    goBtn.addEventListener('click', () => { window.location.href = 'jefatura.html'; });
    if (printBtn) printBtn.addEventListener('click', () => {
      // Pequeño delay para asegurar layout/Chart listo antes de imprimir
      setTimeout(() => window.print(), 60);
    });
  }

  // Arranque
  function start(){
    buildAndRender();
    wireAutoRefresh();
    wireActions();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
