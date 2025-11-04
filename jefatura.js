/* =========================================================
   JEFATURA — Catálogo de Visitas (Admin)
   - Guarda filas en localStorage por AÑO
   - Carga catálogos desde Marco de Referencia por AÑO
   - Dependencia: Circuito -> Institución
   ========================================================= */
(() => {
  "use strict";

  // ===== Año (usa el existente si está presente) =====
  const AppYear = window.AppYear || (() => {
    const KEY="app_year_v1", DEF=2025;
    return {
      getYear: () => parseInt(localStorage.getItem(KEY)||DEF,10)||DEF,
      setYear: (y) => (localStorage.setItem(KEY,String(y)), y),
      MIN_YEAR: 2025, MAX_YEAR: 2028
    };
  })();
  let YEAR = AppYear.getYear();

  // ===== Claves de almacenamiento =====
  const MR_KEY  = (y) => `marco_referencia_catalogos_v1_${y}`;   // ya existe
  const ROW_KEY = (y) => `jefatura_visitas_rows_v1_${y}`;         // nuevo

  // ===== Carga catálogos (MR) =====
  const emptyMR = () => ({
    meses: [], tipoVisita: [], cicloEscolar: [], asesoria: [],
    circuito01: [], circuito02: [], circuito03: [], circuito04: [], circuito05: []
  });
  function loadMR(){
    try{
      const raw = localStorage.getItem(MR_KEY(YEAR));
      if (!raw) return emptyMR();
      const d = JSON.parse(raw);
      return { ...emptyMR(), ...d };
    }catch{ return emptyMR(); }
  }
  let MR = loadMR();

  // ===== Filas =====
  function loadRows(){
    try{
      const raw = localStorage.getItem(ROW_KEY(YEAR));
      return raw ? JSON.parse(raw) : [];
    }catch{ return []; }
  }
  function saveRows(){
    try{ localStorage.setItem(ROW_KEY(YEAR), JSON.stringify(ROWS)); }catch{}
  }
  let ROWS = loadRows();

  // ===== DOM =====
  const TBody = document.getElementById("jefTbody");
  const btnAdd = document.getElementById("btnAddRow");

  // ===== Utilidades =====
  const ensure = (a)=>Array.isArray(a)?a:[];
  const escapeHtml = (s)=>String(s).replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const CIRCUIT_OPTS = [
    { key:"circuito01", label:"Circuito01" },
    { key:"circuito02", label:"Circuito02" },
    { key:"circuito03", label:"Circuito03" },
    { key:"circuito04", label:"Circuito04" },
    { key:"circuito05", label:"Circuito05" },
  ];
  const labelForCircuit = (key)=> (CIRCUIT_OPTS.find(o=>o.key===key)?.label || "");
  const keyForLabel    = (lbl)=> (CIRCUIT_OPTS.find(o=>o.label===lbl)?.key || "circuito01");
  const institutionsFor = (cKey)=> ensure(MR[cKey]);

  const PRIORITY_OPTS   = ["Alta","Media","No aplica"];
  const VALIDACION_OPTS = ["Validada","No validada"];
  const ESTADO_OPTS     = ["Sin revisar","Revisada"];

  // ===== Render =====
  function render(){
    if (!TBody) return;
    TBody.innerHTML = "";
    ROWS.forEach((row, i) => TBody.appendChild(renderRow(row, i)));
  }

  function tdWrap(inner){
    const td = document.createElement("td");
    const box = document.createElement("div");
    box.className = "cell";
    if (inner instanceof HTMLElement) box.appendChild(inner); else box.innerHTML = inner;
    td.appendChild(box);
    return td;
  }

  function selectEl(options, value, onChange, allowEmpty=true){
    const sel = document.createElement("select");
    if (allowEmpty){
      const o = document.createElement("option"); o.value = ""; o.textContent = "—";
      sel.appendChild(o);
    }
    options.forEach(v=>{
      const opt = document.createElement("option");
      opt.value = v; opt.textContent = v;
      if (String(v) === String(value)) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", (e)=> onChange(e.target.value));
    return sel;
  }

  function inputTextEl(value, onInput){
    const inp = document.createElement("input");
    inp.type = "text"; inp.value = value || "";
    inp.addEventListener("input", ()=> onInput(inp.value));
    return inp;
  }

  function textareaEl(value, onInput){
    const ta = document.createElement("textarea");
    ta.value = value || "";
    ta.addEventListener("input", ()=> onInput(ta.value));
    return ta;
  }

  function dateEl(value, onChange){
    const inp = document.createElement("input");
    inp.type = "date";
    if (value) inp.value = value;
    inp.addEventListener("change", ()=> onChange(inp.value));
    return inp;
  }

  function set(idx, field, val){
    ROWS[idx][field] = val;
    saveRows();
  }

  function renderRow(row, idx){
    const tr = document.createElement("tr");

    // 1 Asesoría (desde MR)
    tr.appendChild( tdWrap( selectEl(ensure(MR.asesoria), row.asesoria, v=>set(idx,"asesoria",v)) ) );

    // 2 Circuito (labels fijos)
    tr.appendChild( tdWrap( selectEl(CIRCUIT_OPTS.map(o=>o.label), labelForCircuit(row.circuito), v=>{
      set(idx,"circuito", keyForLabel(v));
      set(idx,"institucion", "");
      render(); // re-render para refrescar instituciones dependientes
    }) ) );

    // 3 Institución (dependiente del circuito)
    tr.appendChild( tdWrap( selectEl(institutionsFor(row.circuito), row.institucion, v=>set(idx,"institucion",v)) ) );

    // 4 Mes (desde MR)
    tr.appendChild( tdWrap( selectEl(ensure(MR.meses), row.mes, v=>set(idx,"mes",v)) ) );

    // 5 Fecha (calendario)
    tr.appendChild( tdWrap( dateEl(row.fecha, v=>set(idx,"fecha",v)) ) );

    // 6 Tipo de visita (desde MR)
    tr.appendChild( tdWrap( selectEl(ensure(MR.tipoVisita), row.tipoVisita, v=>set(idx,"tipoVisita",v)) ) );

    // 7 Ciclo escolar (desde MR)
    tr.appendChild( tdWrap( selectEl(ensure(MR.cicloEscolar), row.cicloEscolar, v=>set(idx,"cicloEscolar",v)) ) );

    // 8 Temática (texto)
    tr.appendChild( tdWrap( inputTextEl(row.tematica, v=>set(idx,"tematica",v)) ) );

    // 9 Prioridad (3 opciones)
    tr.appendChild( tdWrap( selectEl(PRIORITY_OPTS, row.prioridad, v=>set(idx,"prioridad",v)) ) );

    // 10 Observación (texto/textarea corto)
    tr.appendChild( tdWrap( textareaEl(row.observacion, v=>set(idx,"observacion",v)) ) );

    // 11 Validación jefatura (2 opciones)
    tr.appendChild( tdWrap( selectEl(VALIDACION_OPTS, row.validacion, v=>set(idx,"validacion",v)) ) );

    // 12 Estado (2 opciones)
    tr.appendChild( tdWrap( selectEl(ESTADO_OPTS, row.estado, v=>set(idx,"estado",v)) ) );

    // 13 Acciones
    const acc = document.createElement("td");
    acc.className = "col-actions";
    const wrap = document.createElement("div");
    wrap.className = "row-actions";
    const del = document.createElement("button");
    del.type = "button"; del.className = "btn btn--danger"; del.textContent = "Eliminar";
    del.addEventListener("click", ()=>{
      ROWS.splice(idx,1);
      saveRows(); render();
    });
    wrap.appendChild(del);
    acc.appendChild(wrap);
    tr.appendChild(acc);

    return tr;
  }

  // ===== Nueva fila =====
  function newRow(){
    return {
      asesoría: "", // (notar: en filas guardamos 'asesoria' sin tilde para consistencia)
      asesoria: "",
      circuito: "circuito01",
      institucion: "",
      mes: "",
      fecha: "",
      tipoVisita: "",
      cicloEscolar: "",
      tematica: "",
      prioridad: "Media",
      observacion: "",
      validacion: "No validada",
      estado: "Sin revisar"
    };
  }

  btnAdd?.addEventListener("click", ()=>{
    ROWS.push(newRow());
    saveRows(); render();
  });

  // ===== Cambio de año (si se usa YearTab en la app) =====
  window.addEventListener("yearchange", ()=>{
    YEAR = AppYear.getYear();
    MR   = loadMR();
    ROWS = loadRows();
    render();
  });

  // ===== Inicio =====
  function start(){ render(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else { start(); }

})();
