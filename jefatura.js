(() => {
  "use strict";

  /* =========================================================
     JEFATURA — Admin (BD + copia en localStorage)
  ========================================================= */

  const $  = (s, ctx=document) => ctx.querySelector(s);
  const readJSON  = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)      => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uniqSorted = (arr) =>
    Array.from(new Set((arr||[]).map(v=>String(v).trim())))
      .filter(Boolean)
      .sort((a,b)=>a.localeCompare(b,'es',{numeric:true,sensitivity:'base'}));

  const normText = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();
  const val = (v) => (v==null ? "" : String(v));

  const DEFAULT_MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  function canonCircuitKey(input){
    const raw = String(input||"").trim();
    if (!raw) return "";
    const nrm = normText(raw);
    const m = nrm.match(/\d+/);
    if (m) {
      const num = Math.max(1, Math.min(99, parseInt(m[0],10)));
      return `circuito${String(num).padStart(2,'0')}`;
    }
    if (nrm.includes('circuit')) return 'circuito01';
    return "";
  }

  // ---------- Año actual + id_anio ----------
  const AppYear = window.AppYear || (() => {
    const KEY="app_year_v1", DEF=2025;
    return { getYear: () => parseInt(localStorage.getItem(KEY)||DEF,10)||DEF };
  })();

  async function resolveYearInfo(){
    const year = AppYear.getYear();
    let yearId = 0;

    try {
      const resp = await fetch("php/anio_listar.php");
      const data = await resp.json().catch(()=>null);
      if (resp.ok && data && data.ok && Array.isArray(data.anios)) {
        for (const item of data.anios) {
          if (Number(item.anio) === Number(year)) {
            yearId = Number(item.id);
            break;
          }
        }
      }
    } catch (e) {
      console.error("anio_listar error", e);
    }

    if (!yearId) yearId = 1; // fallback

    return { year: String(year), yearId };
  }

  // ---------- Estado global ----------
  let YEAR      = "2025";
  let YEAR_ID   = 1;
  let CATALOGS  = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };
  let CIRCUITS  = { circuito01:[], circuito02:[], circuito03:[], circuito04:[], circuito05:[] };
  let ROWS      = [];
  let DIRTY     = false;
  let CID_COUNT = 1;

  const tbody = document.querySelector('.tabla-visitas tbody');
  const STORE_KEY = "visitas_jefatura_v1";

  const newCid = () => `row_${CID_COUNT++}`;

  function normalizeRow(src){
    const r = src || {};
    return {
      id:     (r.id && Number.isFinite(+r.id)) ? Number(r.id) : 0,
      cid:    r.cid || newCid(),
      asesoria:     val(r.asesoria),
      circuito:     canonCircuitKey(r.circuito) || val(r.circuito),
      institucion:  val(r.institucion),
      mes:          val(r.mes),
      fecha:        val(r.fecha),
      tipoVisita:   val(r.tipoVisita),
      cicloEscolar: val(r.cicloEscolar),
      tematica:     val(r.tematica),
      prioridad:    val(r.prioridad),
      observacion:  val(r.observacion),
      validacionJefatura: val(r.validacionJefatura) || "Pendiente",
      estado:             val(r.estado)             || "Sin revisar"
    };
  }

  function syncRowsToLS(){
    const all = readJSON(STORE_KEY, {});
    const plain = ROWS.map(r => ({
      id: r.id,
      asesoria: r.asesoria,
      circuito: r.circuito,
      institucion: r.institucion,
      mes: r.mes,
      fecha: r.fecha,
      tipoVisita: r.tipoVisita,
      cicloEscolar: r.cicloEscolar,
      tematica: r.tematica,
      prioridad: r.prioridad,
      observacion: r.observacion,
      validacionJefatura: r.validacionJefatura,
      estado: r.estado
    }));
    all[YEAR] = plain;
    writeJSON(STORE_KEY, all);
    try { localStorage.setItem('visitas_jefatura_last_update', String(Date.now())); } catch {}
  }

  function clearLS(){
    try {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem('visitas_jefatura_last_update');
    } catch {}
  }

  // ---------- Carga desde BD ----------
  async function loadCatalogsFromDB(){
    try {
      const resp = await fetch("php/marco_referencia_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(()=>null);
      if (!resp.ok || !data || !data.ok) {
        console.error("marco_referencia_listar error", data && data.error);
        CATALOGS = {
          meses: [...DEFAULT_MESES],
          tipoVisita: [],
          cicloEscolar: [],
          asesoria: []
        };
        return;
      }
      CATALOGS = {
        meses: [...DEFAULT_MESES],
        tipoVisita: (data.tipoVisita || []).map(r => r.texto),
        cicloEscolar: (data.cicloEscolar || []).map(r => r.texto),
        asesoria: (data.asesoria || []).map(r => r.texto)
      };
    } catch (e) {
      console.error("loadCatalogsFromDB", e);
      CATALOGS = {
        meses: [...DEFAULT_MESES],
        tipoVisita: [],
        cicloEscolar: [],
        asesoria: []
      };
    }
  }

  async function loadCircuitsFromDB(){
    try {
      const resp = await fetch("php/circuito_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(()=>null);
      if (!resp.ok || !data || !data.ok || !data.circuitos) {
        console.error("circuito_listar error", data && data.error);
        return;
      }
      const out = { circuito01:[], circuito02:[], circuito03:[], circuito04:[], circuito05:[] };
      for (const k of Object.keys(out)) {
        const arr = data.circuitos[k] || [];
        out[k] = uniqSorted(arr.map(r => r.texto));
      }
      CIRCUITS = out;
    } catch (e) {
      console.error("loadCircuitsFromDB", e);
    }
  }

  async function loadRowsFromDB(){
    try {
      const resp = await fetch("php/jefatura_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(()=>null);
      if (!resp.ok || !data || !data.ok || !Array.isArray(data.rows)) {
        console.error("jefatura_listar error", data && data.error);
        return [];
      }
      return data.rows.map(normalizeRow);
    } catch (e) {
      console.error("loadRowsFromDB", e);
      return [];
    }
  }

  // ---------- UI helpers ----------
  function tdCell(){ const td=document.createElement('td'); td.className='cell'; return td; }

  function optSel(values, current, placeholder="Seleccionar…"){
    const sel = document.createElement('select');
    const o0  = document.createElement('option');
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{
      const o=document.createElement('option');
      o.value=v; o.textContent=v;
      sel.appendChild(o);
    });
    sel.value = (values||[]).includes(current) ? current : "";
    return sel;
  }

  function inputText(v="", type="text"){ const i=document.createElement('input'); i.type=type; i.value=v||""; return i; }
  function textarea(v=""){ const t=document.createElement('textarea'); t.value=v||""; return t; }

  function delButton(){
    const b=document.createElement('button');
    b.type='button';
    b.className='btn--danger';
    b.setAttribute('aria-label','Eliminar fila');
    b.textContent = 'Eliminar'; // texto, nada de emojis raros
    return b;
  }

  function fillSelectDOM(sel, values, placeholder="Seleccionar…"){
    const prev = sel.value;
    sel.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value=""; o0.textContent=placeholder; o0.hidden=true;
    sel.appendChild(o0);
    (values||[]).forEach(v=>{
      const o=document.createElement("option");
      o.value=v; o.textContent=v;
      sel.appendChild(o);
    });
    sel.value = (values||[]).includes(prev) ? prev : "";
    sel.disabled = (values||[]).length===0;
  }

  function buildCircuitSelect(currentCanon){
    const sel = document.createElement('select');
    const o0  = document.createElement('option');
    o0.value=""; o0.textContent="Circuito…"; o0.hidden=true;
    sel.appendChild(o0);
    for (let i=1;i<=5;i++){
      const canon = `circuito${String(i).padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = canon;
      opt.textContent = `Circuito ${String(i).padStart(2,'0')}`;
      sel.appendChild(opt);
    }
    sel.value = currentCanon || "";
    return sel;
  }

  // ---------- Mutaciones en memoria ----------
  function markDirty(){ DIRTY = true; }

  function findIndexByCid(cid){
    return ROWS.findIndex(r => r.cid === cid);
  }

  function updateRowLocal(cid, patch){
    const idx = findIndexByCid(cid);
    if (idx < 0) return;
    const p = { ...patch };
    if (typeof p.circuito === 'string') {
      p.circuito = canonCircuitKey(p.circuito) || p.circuito;
    }
    if (typeof p.prioridad === 'string' && /no\s*aplica/i.test(p.prioridad)) {
      p.prioridad = 'No Aplica';
    }
    ROWS[idx] = { ...ROWS[idx], ...p };
    markDirty();
  }

  function deleteRow(cid){
    const idx = findIndexByCid(cid);
    if (idx < 0) return;
    ROWS.splice(idx, 1);
    markDirty();
    render();
  }

  function addRow(){
    const r = normalizeRow({
      id: 0,
      prioridad: "No Aplica",
      validacionJefatura: "Pendiente",
      estado: "Sin revisar"
    });
    ROWS.unshift(r);
    markDirty();
    render();
  }

  // ---------- Guardar en BD ----------
  async function saveAllToDB(blocking){
    if (!DIRTY) return;
    const payload = {
      anio: YEAR_ID,
      rows: ROWS.map(r => ({
        id: r.id,
        asesoria: r.asesoria,
        circuito: r.circuito,
        institucion: r.institucion,
        mes: r.mes,
        fecha: r.fecha,
        tipoVisita: r.tipoVisita,
        cicloEscolar: r.cicloEscolar,
        tematica: r.tematica,
        prioridad: r.prioridad,
        observacion: r.observacion,
        validacionJefatura: r.validacionJefatura,
        estado: r.estado
      }))
    };

    const json = JSON.stringify(payload);

    try {
      let resp, data;
      if (!blocking && navigator.sendBeacon) {
        const blob = new Blob([json], { type: "application/json" });
        navigator.sendBeacon("php/jefatura_guardar_lote.php", blob);
        // no podemos leer respuesta, pero mejor que nada
      } else {
        resp = await fetch("php/jefatura_guardar_lote.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: json
        });
        const txt = await resp.text();
        try { data = JSON.parse(txt); } catch { data = null; }

        if (!resp.ok || !data || !data.ok) {
          const msg = (data && (data.error || (data.errors && data.errors.join("\n"))))
                    || ("Error al guardar jefatura: " + txt);
          alert(msg);
          console.error("jefatura_guardar_lote.php", msg);
          return;
        }
      }

      DIRTY = false;
      syncRowsToLS();
    } catch (e) {
      console.error("saveAllToDB", e);
    }
  }

  // ---------- Render ----------
  function render(){
    if (!tbody) return;
    tbody.innerHTML = "";

    const asesList = CATALOGS.asesoria;
    const mesList  = CATALOGS.meses;
    const tvList   = CATALOGS.tipoVisita;
    const ceList   = CATALOGS.cicloEscolar;

    for (const row of ROWS){
      const tr = document.createElement('tr');
      tr.dataset.cid = row.cid;

      // Asesoría
      {
        const td = tdCell();
        const sel = optSel(asesList, row.asesoria, "Asesoría…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { asesoria: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Circuito
      let instSelRef = null;
      {
        const td = tdCell();
        const currentCanon = canonCircuitKey(row.circuito);
        const sel = buildCircuitSelect(currentCanon);
        sel.addEventListener('change', ()=>{
          const canon = sel.value;
          updateRowLocal(row.cid, { circuito: canon, institucion: "" });
          if (instSelRef){
            const list = uniqSorted((CIRCUITS[canon]||[]));
            fillSelectDOM(instSelRef, list, list.length ? "Institución…" : "No hay instituciones");
          }
        });
        td.appendChild(sel); tr.appendChild(td);
      }

      // Institución
      {
        const td = tdCell();
        const canon = canonCircuitKey(row.circuito);
        const instList = uniqSorted((canon && Array.isArray(CIRCUITS[canon])) ? CIRCUITS[canon] : []);
        const sel = optSel(instList, row.institucion, instList.length ? "Institución…" : "No hay instituciones");
        sel.disabled = instList.length===0;
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { institucion: sel.value }));
        instSelRef = sel;
        td.appendChild(sel); tr.appendChild(td);
      }

      // Mes
      {
        const td = tdCell();
        const sel = optSel(mesList, row.mes, "Mes…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { mes: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Fecha
      {
        const td = tdCell();
        const i = inputText(row.fecha, "date");
        i.addEventListener('change', ()=> updateRowLocal(row.cid, { fecha: i.value }));
        td.appendChild(i); tr.appendChild(td);
      }

      // Tipo de visita
      {
        const td = tdCell();
        const sel = optSel(tvList, row.tipoVisita, "Tipo…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { tipoVisita: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Ciclo escolar
      {
        const td = tdCell();
        const sel = optSel(ceList, row.cicloEscolar, "Ciclo…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { cicloEscolar: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Temática
      {
        const td = tdCell();
        const i = inputText(row.tematica, "text");
        i.addEventListener('input', ()=> updateRowLocal(row.cid, { tematica: i.value }));
        td.appendChild(i); tr.appendChild(td);
      }

      // Prioridad
      {
        const td = tdCell();
        const sel = optSel(["Alta","Media","No Aplica"], row.prioridad, "Prioridad…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { prioridad: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Observación
      {
        const td = tdCell();
        const t = textarea(row.observacion);
        t.addEventListener('input', ()=> updateRowLocal(row.cid, { observacion: t.value }));
        td.appendChild(t); tr.appendChild(td);
      }

      // Validación jefatura
      {
        const td = tdCell();
        const sel = optSel(["Pendiente","Validada"], row.validacionJefatura, "Validación…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { validacionJefatura: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Estado
      {
        const td = tdCell();
        const sel = optSel(["Sin revisar","Revisada"], row.estado, "Estado…");
        sel.addEventListener('change', ()=> updateRowLocal(row.cid, { estado: sel.value }));
        td.appendChild(sel); tr.appendChild(td);
      }

      // Acciones
      {
        const td = tdCell();
        td.classList.add('col-actions');
        const btnDel = delButton();
        btnDel.addEventListener('click', ()=> deleteRow(row.cid));
        td.appendChild(btnDel); tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  }

  // ---------- Carga inicial / eventos ----------
  async function refreshAll(){
    const info = await resolveYearInfo();
    YEAR    = info.year;
    YEAR_ID = info.yearId;

    await loadCatalogsFromDB();
    await loadCircuitsFromDB();
    ROWS = await loadRowsFromDB();
    DIRTY = false;
    syncRowsToLS();   // copia inicial para otras páginas
    render();
  }

  function bindUI(){
    const btnAdd = $('#btnAddRow') || $('#btnAddFila') || document.querySelector('.btn-add');
    if (btnAdd) btnAdd.addEventListener('click', addRow);

    // Cambio de año global
    window.addEventListener('yearchange', () => {
      saveAllToDB(false);
      clearLS();
      location.reload();
    });

    // Guardar al salir (best-effort)
    window.addEventListener('beforeunload', () => {
      saveAllToDB(false);
      clearLS();
    });

    // Botón Volver: guarda y luego navega
    const volver = document.querySelector('.nav-volver a');
    if (volver) {
      volver.addEventListener('click', async (ev) => {
        ev.preventDefault();
        await saveAllToDB(true);  // espera respuesta
        clearLS();
        location.href = volver.href;
      });
    }
  }

  async function start(){
    await refreshAll();
    bindUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
