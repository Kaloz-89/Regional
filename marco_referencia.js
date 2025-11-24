(() => {
  "use strict";

  const readJSON  = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||"null") ?? fb; } catch { return fb; } };
  const writeJSON = (k, v)      => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uniqSorted = (arr) => Array.from(new Set((arr||[]).map(v=>String(v).trim()))).filter(Boolean)
                                   .sort((a,b)=>a.localeCompare(b,"es",{numeric:true,sensitivity:"base"}));

  const DEFAULT_MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  const LS_KEY_PREFIX = "marco_referencia_catalogos_v1";
  const keyForYearLabel = (label) => `${LS_KEY_PREFIX}_${label}`;

  const defaultData = () => ({
    meses: [...DEFAULT_MESES],
    tipoVisita: [],
    cicloEscolar: [],
    asesoria: []
  });

  function normalizeStateKeys(objRaw){
    const base = defaultData();
    const copyArr = (key, ...aliases) => {
      const src = [key, ...aliases].map(k => objRaw?.[k]).find(v => Array.isArray(v));
      if (src && src.length) base[key] = uniqSorted(src);
    };
    copyArr("meses", "Meses", "mes");
    if (!base.meses.length) base.meses = [...DEFAULT_MESES];
    copyArr("tipoVisita", "Tipo de visita", "tipo", "Tipo");
    copyArr("cicloEscolar", "Ciclo escolar", "ciclo", "Ciclo");
    copyArr("asesoria", "Asesoría", "Asesoria", "asesorias");
    return base;
  }

  const readYearData = (yearLabel) => {
    const raw = readJSON(keyForYearLabel(yearLabel), null);
    if (!raw) return defaultData();
    const norm = normalizeStateKeys(raw);
    if (JSON.stringify(norm) !== JSON.stringify(raw)) writeYearData(yearLabel, norm);
    return norm;
  };
  const writeYearData = (yearLabel, data) => writeJSON(keyForYearLabel(yearLabel), data);

  // ===== Año actual: LABEL (2025, 2026...) e ID (id_anio de BD) =====
  let YEAR_LABEL = 2025;  // número del año (para mostrar/LS)
  let YEAR_ID    = 1;     // id_anio (FK en las tablas hijas)

  async function resolveYearFromConfig() {
    // 1) Intentar leer el año desde localStorage (lo pone la página principal)
    let storedYear = null;
    try {
      const raw = localStorage.getItem("app_year_v1");
      const n = parseInt(raw || "", 10);
      if (Number.isFinite(n)) storedYear = n;
    } catch {
      storedYear = null;
    }

    try {
      const resp = await fetch("php/anio_listar.php");
      const text = await resp.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) {
        console.error("anio_listar.php no devolvió JSON válido:", text);
      }

      if (!resp.ok || !data || !data.ok || !Array.isArray(data.anios) || !data.anios.length) {
        console.error("anio_listar.php sin datos válidos, uso fallback 2025/id=1", data);
        YEAR_LABEL = 2025;
        YEAR_ID    = 1;
        return;
      }

      const list = data.anios
        .map(r => ({
          id:   Number.parseInt(r.id,   10),
          anio: Number.parseInt(r.anio, 10)
        }))
        .filter(r => Number.isFinite(r.id) && Number.isFinite(r.anio))
        .sort((a,b) => a.anio - b.anio);

      if (!list.length) {
        YEAR_LABEL = 2025;
        YEAR_ID    = 1;
        return;
      }

      // 2) Elegir el año: primero el de LS, si no, el de la URL, si no, el primero de la lista
      let chosen = null;

      if (storedYear !== null) {
        chosen = list.find(r => r.anio === storedYear) || null;
      }

      if (!chosen) {
        const params = new URLSearchParams(window.location.search);
        const yUrl = parseInt(params.get("year") || "", 10);
        if (Number.isFinite(yUrl)) {
          chosen = list.find(r => r.anio === yUrl) || null;
        }
      }

      if (!chosen) chosen = list[0];

      YEAR_LABEL = chosen.anio;  // ej. 2027
      YEAR_ID    = chosen.id;    // ej. 3

      // Asegurar que app_year_v1 tenga el año numérico (por si venías vacío)
      try { localStorage.setItem("app_year_v1", String(YEAR_LABEL)); } catch {}
    } catch (e) {
      console.error("resolveYearFromConfig error:", e);
      YEAR_LABEL = 2025;
      YEAR_ID    = 1;
    }
  }

  // ===== Estado local por año (usa LABEL para cache local, ID para BD) =====
  let state = defaultData();
  const dbIds = { tipoVisita: [], cicloEscolar: [], asesoria: [] };

  // ----- Carga de catálogos desde BD (filtrando por id_anio) -----
  async function loadFromDB(){
    try {
      const resp = await fetch("php/marco_referencia_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || !data.ok) {
        console.error("Error en marco_referencia_listar.php", data && data.error);
        return;
      }
      state.tipoVisita   = (data.tipoVisita   || []).map(r => r.texto);
      dbIds.tipoVisita   = (data.tipoVisita   || []).map(r => r.id);
      state.cicloEscolar = (data.cicloEscolar || []).map(r => r.texto);
      dbIds.cicloEscolar = (data.cicloEscolar || []).map(r => r.id);
      state.asesoria     = (data.asesoria     || []).map(r => r.texto);
      dbIds.asesoria     = (data.asesoria     || []).map(r => r.id);

      writeYearData(YEAR_LABEL, state);
    } catch (e) {
      console.error("loadFromDB", e);
    }
  }

  const COLUMNS = [
    { key: "tipoVisita",   title: "Tipo de visita" },
    { key: "cicloEscolar", title: "Ciclo escolar" },
    { key: "asesoria",     title: "Asesoría" }
  ];

  function renderTable(){
    const body = document.getElementById("tblBody");
    if (!body) return;
    const arrays = COLUMNS.map(c => state[c.key] || []);
    const maxRows = Math.max(0, ...arrays.map(a => a.length));
    let html = "";
    for (let i=0; i<maxRows; i++){
      html += "<tr>";
      for (let col=0; col<COLUMNS.length; col++){
        const key = COLUMNS[col].key;
        const arr = arrays[col];
        const val = arr[i] ?? "";
        if (val){
          const id = (dbIds[key] || [])[i] ?? "";
          html += `<td>
                     <div class="cell">
                       <span class="txt" title="${val}">${val}</span>
                       <button class="del" type="button"
                               data-col="${key}"
                               data-index="${i}"
                               data-id="${id}">Eliminar</button>
                     </div>
                   </td>`;
        } else {
          html += "<td></td>";
        }
      }
      html += "</tr>";
    }
    body.innerHTML = html;
  }

  // ----- Eliminar de catálogos -----
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cell .del");
    if (!btn) return;
    const col = btn.dataset.col;
    const idx = parseInt(btn.dataset.index, 10);
    if (!col || !Number.isFinite(idx)) return;
    const id = btn.dataset.id ? parseInt(btn.dataset.id, 10) : 0;

    if (id > 0) {
      const body =
        `campo=${encodeURIComponent(col)}` +
        `&id=${encodeURIComponent(id)}` +
        `&anio=${encodeURIComponent(YEAR_ID)}`;
      fetch("php/marco_referencia_eliminar.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      }).then(r => r.json().catch(()=>null))
        .then(data => {
          if (!data || !data.ok) console.error("Eliminar BD catálogos", data && data.error);
        })
        .catch(err => console.error("Red eliminar catálogos", err));
    }
    (state[col] = state[col] || []).splice(idx, 1);
    if (dbIds[col]) dbIds[col].splice(idx, 1);
    writeYearData(YEAR_LABEL, state);
    renderTable();
  });

  // ----- Alta de catálogos -----
  function wireThForms(){
    document.querySelectorAll(".th-form[data-target]").forEach(form => {
      const key = form.dataset.target;
      const input = form.querySelector(".th-input");
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const val = (input?.value || "").trim();
        if (!val) return;
        state[key] = uniqSorted([...(state[key] || []), val]);
        writeYearData(YEAR_LABEL, state);
        renderTable();
        try {
          const fd = new FormData();
          fd.append("campo", key);
          fd.append("valor", val);
          fd.append("anio", YEAR_ID); // id_anio de la BD
          const resp = await fetch("php/marco_referencia_guardar.php", { method: "POST", body: fd });
          await resp.text();
        } catch(e) {
          console.error("Guardar catálogo", e);
        }
        input.value = "";
        input.focus();
      });
    });
  }

  // ---------- Circuitos ----------
  const modal = document.getElementById("circuitosModal");

  if (modal) {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  const tbody = document.getElementById("circuitTbody");
  const openBtn = document.getElementById("btnCircuitos");
  const closeBtns = modal ? modal.querySelectorAll("[data-close]") : [];
  const circuitoHidden = document.getElementById("circuitoHidden");
  const circuitoAnioHidden = document.getElementById("circuitoAnioHidden");
  let currentCircuit = "circuito01";

  let circuitosBD = {
    circuito01: [],
    circuito02: [],
    circuito03: [],
    circuito04: [],
    circuito05: []
  };

  async function loadCircuitosFromDB(){
    try {
      const resp = await fetch("php/circuito_listar.php?anio=" + encodeURIComponent(YEAR_ID));
      const data = await resp.json().catch(()=>null);
      if (!resp.ok || !data || !data.ok || !data.circuitos) return;
      circuitosBD = data.circuitos;
      renderCircuitTable();
    } catch(e){
      console.error("loadCircuitosFromDB", e);
    }
  }

  function renderCircuitTable(){
    if (!tbody) return;
    const arr = circuitosBD[currentCircuit] || [];
    let html = "";
    for (let i = 0; i < arr.length; i++){
      const item = arr[i];
      html += `
        <tr>
          <td>${escapeHtml(item.texto)}</td>
          <td>
            <button class="btn-del" type="button" data-id="${item.id}">Eliminar</button>
          </td>
        </tr>`;
    }
    if (!arr.length) {
      html = `<tr><td colspan="2" style="opacity:.8">Sin registros en ${currentCircuit}.</td></tr>`;
    }
    tbody.innerHTML = html;
  }

  // Eliminar en circuitos (usa id_anio también)
  tbody?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-del");
    if (!btn) return;

    const id = parseInt(btn.dataset.id, 10);
    if (!Number.isFinite(id) || id <= 0) return;

    try {
      const body =
        `circuito=${encodeURIComponent(currentCircuit)}` +
        `&id=${encodeURIComponent(id)}` +
        `&anio=${encodeURIComponent(YEAR_ID)}`;
      const resp = await fetch("php/circuito_eliminar.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data || !data.ok) {
        console.error("Eliminar circuito", data && data.error);
        return;
      }
      await loadCircuitosFromDB();
    } catch (err) {
      console.error("Eliminar circuito", err);
    }
  });

  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => (
    {"&":"&amp;","<":"&lt;","&gt;":"&gt;","\"":"&quot;","'":"&#039;"}[m]
  ));

  const openModal = async () => {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    if (circuitoHidden)      circuitoHidden.value      = currentCircuit;
    if (circuitoAnioHidden)  circuitoAnioHidden.value  = YEAR_ID; // mandar id_anio al POST del form
    await loadCircuitosFromDB();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  };

  openBtn?.addEventListener("click", openModal);
  closeBtns.forEach(b=>b.addEventListener("click", closeModal));

  document.querySelectorAll(".circuit-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".circuit-tabs .tab.is-active").forEach(b=>b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentCircuit = btn.dataset.circuit;
      if (circuitoHidden) circuitoHidden.value = currentCircuit;
      renderCircuitTable();
    });
  });

  // ---------- Inicio ----------
  async function start(){
    // 1) Resolver año (label+id) usando localStorage + tabla anio
    await resolveYearFromConfig();

    // 2) Cargar estado local basado en YEAR_LABEL
    state = readYearData(YEAR_LABEL);

    // 3) Ir a BD con YEAR_ID
    await loadFromDB();
    await loadCircuitosFromDB();

    // 4) Montar forms y pintar
    wireThForms();
    renderTable();

    // Reabrir modal de circuitos sólo si la URL lo indica
    const params = new URLSearchParams(window.location.search);
    const modalParam = params.get("modal");
    const circuitoParam = params.get("circuito");

    if (modalParam === "circuitos") {
      if (circuitoParam && circuitosBD[circuitoParam]) {
        currentCircuit = circuitoParam;
      }

      document.querySelectorAll(".circuit-tabs .tab").forEach(btn => {
        const isActive = btn.dataset.circuit === currentCircuit;
        btn.classList.toggle("is-active", isActive);
      });

      if (circuitoHidden)     circuitoHidden.value     = currentCircuit;
      if (circuitoAnioHidden) circuitoAnioHidden.value = YEAR_ID;

      renderCircuitTable();
      await openModal();

      // Limpiar parámetros para futuros refresh
      params.delete("modal");
      params.delete("circuito");
      params.delete("okCircuito");
      params.delete("errorCircuito");
      params.delete("msg");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "");
      window.history.replaceState({}, "", newUrl);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
