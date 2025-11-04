(() => {
  "use strict";

  /* =========================================================
     FORMULARIO — Catálogos y Circuitos dependientes por AÑO
     Arregla dependencia Circuito → Institución con normalización
     de claves: todo se mapea a "circuito01", "circuito02", ... 
  ========================================================= */

  // ---------- Helpers básicos ----------
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const readJSON  = (k, fb=null) => { try{ return JSON.parse(localStorage.getItem(k)||'null') ?? fb; }catch{ return fb; } };
  const writeJSON = (k, v)      => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} };
  const uniqSorted = (arr) => Array.from(new Set((arr||[]).map(v=>String(v).trim())))
                                   .filter(Boolean)
                                   .sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));

  const normText = (s) => String(s||"")
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();

  // Convierte cualquier variante a "circuito01".."circuito05"
  function canonCircuitKey(input){
    const raw = String(input||"").trim();
    if (!raw) return "";
    const nrm = normText(raw);                 // ej: "circuito 1" -> "circuito 1"
    const m = nrm.match(/\d+/);                // captura "1", "01", "3", etc.
    if (m) {
      const num = Math.max(1, Math.min(99, parseInt(m[0],10))); // por seguridad
      const p2  = String(num).padStart(2,'0');
      return `circuito${p2}`;                  // clave canónica
    }
    // Si no hay dígitos pero incluye "circuit", fuerza 01
    if (nrm.includes('circuit')) return 'circuito01';
    return "";
  }

  // Lee texto visible del option si hiciera falta
  function selectedText(sel){
    const el = typeof sel==="string" ? $(sel) : sel;
    if (!el) return "";
    const opt = el.options[el.selectedIndex];
    return opt ? opt.text : "";
  }

  // ---------- Año activo ----------
  const AppYearShim = (() => {
    const FALLBACK = 2025;
    const fromLS = parseInt(localStorage.getItem("app_year_v1")||"", 10);
    const val = (window.AppYear && typeof window.AppYear.getYear==="function")
      ? window.AppYear.getYear()
      : (Number.isFinite(fromLS) ? fromLS : FALLBACK);
    return { get: () => val };
  })();
  const YEAR = String(AppYearShim.get());

  // ---------- Claves esperadas ----------
  const KEYS = {
    catalogsBase: [
      "marco_ref_catalogos_v1",
      "mr_catalogos_v1",
      "marcoRef_catalogos_v1",
      "marco_referencia_catalogos_v1"
    ],
    circuitsBase: [
      "marco_ref_circuitos_v1",
      "mr_circuitos_v1",
      "circuitos_v1"
    ],
    visitsSink: "visitas_jefatura_v1"
  };

  const withYearCandidates = (baseKeys, year) => {
    const out = [];
    for (const k of baseKeys) out.push(k, `${k}_${year}`, `${year}_${k}`);
    return out;
  };
  const takeYearSlice = (val, year) => {
    if (!val) return null;
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') {
      const y = String(year);
      if (val[y]) return val[y];
      if (val.data && val.data[y]) return val.data[y];
      return val;
    }
    return null;
  };
  const readCandidates = (cands) => {
    for (const k of cands) {
      const v = readJSON(k, null);
      if (v != null) return v;
    }
    return null;
  };

  // ---------- Catálogos (Mes, Tipo, Ciclo, Asesoría) ----------
  function loadCatalogsByYear(year){
    const cand = withYearCandidates(KEYS.catalogsBase, year);
    let raw = readCandidates(cand);
    raw = takeYearSlice(raw, year);

    let meses=[], tipoVisita=[], cicloEscolar=[], asesoria=[];
    if (raw && typeof raw==='object' && !Array.isArray(raw)){
      meses        = uniqSorted(raw.meses || raw.Meses || raw.mes || []);
      tipoVisita   = uniqSorted(raw.tipoVisita || raw['Tipo de visita'] || raw.tipo || []);
      cicloEscolar = uniqSorted(raw.cicloEscolar || raw['Ciclo escolar'] || raw.ciclo || []);
      asesoria     = uniqSorted(raw.asesoria || raw['Asesoría'] || raw['Asesoria'] || raw.asesorias || []);
    } else if (Array.isArray(raw)){
      for (const row of raw){
        if (!row || typeof row!=='object') continue;
        const m  = row.mes ?? row.Mes ?? row['Mes'];
        const tv = row.tipoVisita ?? row['Tipo de visita'] ?? row.tipo ?? row['Tipo'];
        const ce = row.cicloEscolar ?? row['Ciclo escolar'] ?? row.ciclo ?? row['Ciclo'];
        const as = row.asesoria ?? row.Asesoría ?? row['Asesoría'] ?? row.Asesoria ?? row['Asesoria'];
        if (m)  meses.push(String(m));
        if (tv) tipoVisita.push(String(tv));
        if (ce) cicloEscolar.push(String(ce));
        if (as) asesoria.push(String(as));
      }
      meses=uniqSorted(meses); tipoVisita=uniqSorted(tipoVisita);
      cicloEscolar=uniqSorted(cicloEscolar); asesoria=uniqSorted(asesoria);
    } else {
      // escaneo de respaldo
      const all = Object.keys(localStorage);
      for (const key of all){
        const v = readJSON(key, null);
        const slice = takeYearSlice(v, year);
        if (!slice) continue;
        if (Array.isArray(slice)){
          for (const row of slice){
            if (!row || typeof row!=='object') continue;
            const m  = row.mes ?? row.Mes ?? row['Mes'];
            const tv = row.tipoVisita ?? row['Tipo de visita'] ?? row.tipo ?? row['Tipo'];
            const ce = row.cicloEscolar ?? row['Ciclo escolar'] ?? row.ciclo ?? row['Ciclo'];
            const as = row.asesoria ?? row.Asesoría ?? row['Asesoría'] ?? row.Asesoria ?? row['Asesoria'];
            if (m)  meses.push(String(m));
            if (tv) tipoVisita.push(String(tv));
            if (ce) cicloEscolar.push(String(ce));
            if (as) asesoria.push(String(as));
          }
        } else if (typeof slice==='object'){
          meses        = meses.concat(slice.meses || slice.Meses || []);
          tipoVisita   = tipoVisita.concat(slice.tipoVisita || slice['Tipo de visita'] || []);
          cicloEscolar = cicloEscolar.concat(slice.cicloEscolar || slice['Ciclo escolar'] || []);
          asesoria     = asesoria.concat(slice.asesoria || slice['Asesoría'] || slice['Asesoria'] || []);
        }
      }
      meses=uniqSorted(meses); tipoVisita=uniqSorted(tipoVisita);
      cicloEscolar=uniqSorted(cicloEscolar); asesoria=uniqSorted(asesoria);
    }
    return { meses, tipoVisita, cicloEscolar, asesoria };
  }

  // ---------- Parse robusto de circuitos ----------
  function parseCircuits(raw){
    // Devuelve { circuito01:[...], circuito02:[...], ... } con claves canónicas
    const out = {};

    const pushTo = (ckey, val) => {
      const key = canonCircuitKey(ckey);
      if (!key) return;
      out[key] = out[key] || [];
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v && typeof v!=='object') out[key].push(String(v));
          else if (v && typeof v==='object' && v.nombre) out[key].push(String(v.nombre));
        }
      } else if (val && typeof val==='object') {
        // intenta arrays conocidos dentro del objeto
        const arrays = [];
        for (const cand of ['instituciones','centros','escuelas','colegios','lista','items']) {
          if (Array.isArray(val[cand])) arrays.push(...val[cand]);
        }
        if (arrays.length) {
          arrays.forEach(v=> out[key].push(String(v)));
        }
      } else if (val) {
        out[key].push(String(val));
      }
    };

    if (!raw) return out;

    if (Array.isArray(raw)){
      // ¿arreglo de pares {circuito, institucion}?
      for (const row of raw){
        if (!row || typeof row!=='object') continue;
        const c = row.circuito ?? row.Circuito ?? row['Circuito'] ?? row['circuit'];
        const i = row.institucion ?? row.Institucion ?? row['Institución'] ?? row['institucion'] ?? row['centro'] ?? row['Centro'];
        if (c && i) pushTo(c, [String(i)]);
      }
      return out;
    }

    if (typeof raw==='object'){
      // Si viene como {map:{circuito01:[...]}} usa .map
      const root = (raw.map && typeof raw.map==='object') ? raw.map : raw;
      for (const k of Object.keys(root)){
        const val = root[k];
        if (Array.isArray(val) || (val && typeof val==='object')) {
          pushTo(k, val);
        }
      }
    }
    return out;
  }

  function loadCircuitsMapByYear(year){
    const cand = withYearCandidates(KEYS.circuitsBase, year);
    let raw = readCandidates(cand);
    raw = takeYearSlice(raw, year);

    let map = parseCircuits(raw);

    // Si quedó vacío, intenta buscar en todo localStorage
    if (!Object.keys(map).length){
      const all = Object.keys(localStorage);
      for (const key of all){
        const v = readJSON(key, null);
        const slice = takeYearSlice(v, year);
        const partial = parseCircuits(slice);
        for (const k of Object.keys(partial)){
          map[k] = uniqSorted([...(map[k]||[]), ...partial[k]]);
        }
      }
    }

    // Asegura 5 circuitos canónicos aunque estén vacíos
    for (let i=1;i<=5;i++){
      const k = `circuito${String(i).padStart(2,'0')}`;
      map[k] = uniqSorted(map[k] || []);
    }
    return map;
  }

  // ---------- Pintado de selects ----------
  function fillSelect(sel, values, placeholder="Seleccionar…") {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) return;
    const prev = el.value;
    el.innerHTML = "";

    const o0 = document.createElement("option");
    o0.value = ""; o0.textContent = placeholder; o0.hidden = true; o0.selected = true;
    el.appendChild(o0);

    (values||[]).forEach(v=>{
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      el.appendChild(opt);
    });

    if (prev && (values||[]).includes(prev)) el.value = prev;
  }

  // ---------- Estado por año ----------
  let CIRCUITS_MAP = {};
  let CATALOGS = { meses:[], tipoVisita:[], cicloEscolar:[], asesoria:[] };

  function renderForYear(year){
    CATALOGS    = loadCatalogsByYear(year);
    CIRCUITS_MAP= loadCircuitsMapByYear(year);

    fillSelect($("#asesoria"),     CATALOGS.asesoria,     "Seleccionar asesoría…");
    fillSelect($("#mes"),          CATALOGS.meses,        "Seleccionar mes…");
    fillSelect($("#tipoVisita"),   CATALOGS.tipoVisita,   "Seleccionar tipo…");
    fillSelect($("#cicloEscolar"), CATALOGS.cicloEscolar, "Seleccionar ciclo…");

    // Dependencia Circuito → Institución (USANDO CLAVE CANÓNICA)
    const selCircuito = $("#circuito");
    const selInst     = $("#institucion");

    const refreshInst = () => {
      // intenta con value y si no, con el texto visible del option
      const val = selCircuito.value || "";
      const txt = selectedText(selCircuito) || "";
      const cKey = canonCircuitKey(val) || canonCircuitKey(txt);

      const list = cKey && Array.isArray(CIRCUITS_MAP[cKey]) ? CIRCUITS_MAP[cKey] : [];
      fillSelect(selInst, uniqSorted(list), list.length ? "Seleccionar…" : "No hay instituciones");
      selInst.disabled = list.length === 0;
    };

    selCircuito.removeEventListener("_dep_change", selCircuito._depHandler || (()=>{}));
    selCircuito._depHandler = () => refreshInst();
    selCircuito.addEventListener("change", selCircuito._depHandler);
    selCircuito.addEventListener("_dep_change", selCircuito._depHandler);

    // primer render
    refreshInst();

    const pill = $("#yearPill");
    if (pill) pill.textContent = `Año ${year}`;
  }

  // ---------- Submit (opcional, guarda por año) ----------
  function bindFormSubmit(){
    const form = $("#frmVisita");
    if (!form) return;

    form.addEventListener("submit", (ev)=>{
      ev.preventDefault();
      const data = {
        year: AppYearShim.get(),
        asesoria:     $("#asesoria").value || "",
        circuito:     $("#circuito").value || "",
        institucion:  $("#institucion").value || "",
        mes:          $("#mes").value || "",
        fecha:        $("#fecha").value || "",
        tipoVisita:   $("#tipoVisita").value || "",
        cicloEscolar: $("#cicloEscolar").value || "",
        tematica:     $("#tematica").value || "",
        observacion:  $("#observacion").value || ""
      };
      if (!data.asesoria || !data.circuito || !data.institucion ||
          !data.mes || !data.tipoVisita || !data.cicloEscolar || !data.fecha) {
        alert("Faltan campos obligatorios.");
        return;
      }
      const sink = readJSON(KEYS.visitsSink, {});
      const y = String(data.year || "sinYear");
      sink[y] = Array.isArray(sink[y]) ? sink[y] : [];
      sink[y].push(data);
      writeJSON(KEYS.visitsSink, sink);
      alert("Guardado localmente.");
      form.reset();
      const selInst = $("#institucion");
      if (selInst) { selInst.disabled = true; selInst.innerHTML = '<option hidden selected value="">Elija circuito primero…</option>'; }
    });

    const btnLimpiar = $("#btnLimpiar");
    if (btnLimpiar) {
      btnLimpiar.addEventListener("click", ()=>{
        form.reset();
        const selInst = $("#institucion");
        if (selInst) { selInst.disabled = true; selInst.innerHTML = '<option hidden selected value="">Elija circuito primero…</option>'; }
      });
    }
  }

  // ---------- Año dinámico ----------
  function bindYearChange(){
    window.addEventListener("yearchange", (ev)=>{
      const y = (ev && ev.detail && ev.detail.year) ? ev.detail.year : AppYearShim.get();
      renderForYear(String(y));
      const selCircuito = $("#circuito");
      if (selCircuito) selCircuito.dispatchEvent(new Event("_dep_change"));
    });
  }

  // ---------- Init ----------
  function start(){
    renderForYear(YEAR);
    bindFormSubmit();
    bindYearChange();
  }
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
