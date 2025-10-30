(function () {
  "use strict";
  const YEAR_STORE_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  function getActiveYear() {
    const p = new URLSearchParams(location.search);
    const fromUrl = parseInt(p.get("year") || "", 10);
    if (Number.isFinite(fromUrl)) return fromUrl;
    const fromLs = parseInt(localStorage.getItem(YEAR_STORE_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW;
  }
  const YEAR = getActiveYear();
  const YPFX = `${YEAR}_`;
  const STORAGE_DIRECCION = "tablaPoa_direccion_v1";
  const KEY_DIRS = `${YPFX}${STORAGE_DIRECCION}`;
  const KEY_PRAP = (id) => `${YPFX}prap_${id}`;
  const keyPageRows = (ns) => `${YPFX}page_rows_${ns}`;
  const keyProg     = (ns, rid) => `${YPFX}prog_${ns}_${rid}`;
  const parseNum = (v) => {
    const n = Number(String(v ?? "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  };
  const clampPct = (n, d) => {
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return "—";
    const x = Math.max(0, Math.min(100, (n / d) * 100));
    return x.toFixed(1) + "%";
  };
  const newRid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,10);
  const safeJSON = (raw, fb) => { try { return raw ? JSON.parse(raw) : fb; } catch { return fb; } };
  const ckey = (prapId, rid) => `${prapId}::${rid}`;
  const isCKey = (k) => typeof k === "string" && k.includes("::");
  function leerDireccionesIds() {
    const arr = safeJSON(localStorage.getItem(KEY_DIRS), []);
    return Array.isArray(arr) ? arr.map(x => x.id).filter(Boolean) : [];
  }
  function normalizarFila(f) {
    return {
      rid: f.rid || newRid(),
      obj: f.obj ?? "", ind: f.ind ?? "", cant: f.cant ?? "",
      acts: f.acts ?? "", periodo: f.periodo ?? "", resp: f.resp ?? ""
    };
  }
  function leerPrap(dirId) {
    const arr = safeJSON(localStorage.getItem(KEY_PRAP(dirId)), []);
    if (!Array.isArray(arr)) return [];
    const norm = arr.map(normalizarFila);
    if (norm.some((f,i)=>!arr[i]?.rid)) {
      try { localStorage.setItem(KEY_PRAP(dirId), JSON.stringify(norm)); } catch {}
    }
    return norm;
  }
  function escribirPrap(dirId, rows) {
    try { localStorage.setItem(KEY_PRAP(dirId), JSON.stringify(rows)); } catch {}
  }
  /* ========= Migraciones ========= */
  function migratePageRowsIfNeeded(ns, allRowsByRid) {
    const legacyKey = `page_rows_${ns}`;
    const newKey = keyPageRows(ns);
    if (!localStorage.getItem(newKey) && localStorage.getItem(legacyKey)) {
      try { localStorage.setItem(newKey, localStorage.getItem(legacyKey)); localStorage.removeItem(legacyKey); } catch {}
    }
    const obj = safeJSON(localStorage.getItem(newKey), {});
    let touched = false;
    Object.keys(obj).forEach(k => {
      if (isCKey(k)) return;
      const rid = k, val = obj[k];
      const occ = allRowsByRid.get(rid) || [];
      occ.forEach(({ prapId }) => {
        const ck = ckey(prapId, rid);
        if (!Object.prototype.hasOwnProperty.call(obj, ck)) {
          obj[ck] = val; touched = true;
        }
      });
      delete obj[k]; touched = true;
    });
    if (touched) { try { localStorage.setItem(newKey, JSON.stringify(obj)); } catch {} }
  }
  function migrateProgIfNeeded(ns, rid) {
    const legacyKey = `prog_${ns}_${rid}`;
    const newKey = keyProg(ns, rid);
    if (localStorage.getItem(newKey)) return;
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return;
    try { localStorage.setItem(newKey, raw); localStorage.removeItem(legacyKey); } catch {}
  }
  function readPageRows(ns){
    const obj = safeJSON(localStorage.getItem(keyPageRows(ns)), {});
    return (obj && typeof obj === "object") ? obj : {};
  }
  function writePageRows(ns, data){
    try { localStorage.setItem(keyPageRows(ns), JSON.stringify(data || {})); } catch{}
  }
  function readProg(ns, rid){
    migrateProgIfNeeded(ns, rid);
    const raw = localStorage.getItem(keyProg(ns,rid)) || localStorage.getItem(`prog_${ns}_${rid}`) || "";
    const obj = safeJSON(raw, {});
    return obj && typeof obj === "object" ? obj : {};
  }
  function writeProg(ns, rid, data){
    try { localStorage.setItem(keyProg(ns,rid), JSON.stringify(data || {})); } catch{}
  }
  function fixDuplicateRidsForDir(dirId) {
    const rows = leerPrap(dirId);
    const seen = new Map();
    let changed = false;
    rows.forEach((r, idx) => {
      const rid = r.rid;
      if (!seen.has(rid)) {
        seen.set(rid, idx);
      } else {
        const oldRid = rid;
        const newR = newRid();
        rows[idx].rid = newR;
        changed = true;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          const tail = k.startsWith(YPFX) ? k.slice(YPFX.length) : k;
          const mProg = /^prog_([^_]+)_(.+)$/.exec(tail);
          if (mProg) {
            const ns = mProg[1];
            const ridHit = mProg[2];
            if (ridHit !== oldRid) continue;
            const newKey = k.startsWith(YPFX) ? keyProg(ns, newR) : `prog_${ns}_${newR}`;
            if (!localStorage.getItem(newKey)) {
              localStorage.setItem(newKey, localStorage.getItem(k));
            }
            localStorage.removeItem(k);
            i = Math.max(i - 1, -1);
          }
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith(YPFX)) continue;
          const tail = k.slice(YPFX.length);
          const mPR = /^page_rows_(.+)$/.exec(tail);
          if (!mPR) continue;
          const ns = mPR[1];
          const fullKey = keyPageRows(ns);
          const obj = safeJSON(localStorage.getItem(fullKey), {});
          let touched = false;
          if (Object.prototype.hasOwnProperty.call(obj, oldRid)) {
            obj[ckey(dirId, newR)] = obj[oldRid];
            delete obj[oldRid];
            touched = true;
          }
          const oldC = ckey(dirId, oldRid);
          if (Object.prototype.hasOwnProperty.call(obj, oldC)) {
            obj[ckey(dirId, newR)] = obj[oldC];
            delete obj[oldC];
            touched = true;
          }
          if (touched) localStorage.setItem(fullKey, JSON.stringify(obj));
        }
      }
    });
    if (changed) escribirPrap(dirId, rows);
  }
  function loadAllRows() {
    const ids = leerDireccionesIds();
    ids.forEach(id => fixDuplicateRidsForDir(id));
    const out = [];
    ids.forEach(id => {
      const prapRows = leerPrap(id);
      prapRows.forEach(r => out.push({ prapId:id, ...r }));
    });
    return out;
  }
  function renderAdminTableForNamespace({ ns, tableEl }) {
    const tbody = tableEl.tBodies[0];
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const rows = loadAllRows();
    const pageRows = readPageRows(ns);
    rows.forEach(r => {
      const key = ckey(r.prapId, r.rid);
      const st = pageRows[key] || pageRows[r.rid] || { localQty: 0, publish: false };
      const tr = tbody.insertRow();
      tr.dataset.rid = r.rid;
      let td = tr.insertCell(-1); td.textContent = r.obj;
      td = tr.insertCell(-1);     td.textContent = r.ind;
      td = tr.insertCell(-1);     td.className = "num";
      const qty = document.createElement("input");
      qty.type = "number"; qty.step = "1"; qty.className = "local-qty";
      qty.value = String(parseNum(st.localQty));
      td.appendChild(qty);
      td = tr.insertCell(-1);     td.textContent = r.acts;
      td = tr.insertCell(-1);     td.textContent = r.periodo;
      td = tr.insertCell(-1);     td.textContent = r.resp;
      td = tr.insertCell(-1);
      td.className = "aportebox";
      const prog = readProg(ns, r.rid);
      const iAbsNow = parseNum(prog.abs1);
      const iiAbsNow = parseNum(prog.abs2);
      const topI = document.createElement("div");
      topI.className = "ap-total";
      topI.textContent = String(iAbsNow);
      const addI = document.createElement("input");
      addI.type = "number"; addI.step = "1"; addI.className = "ap-input"; addI.placeholder = "±";
      td.appendChild(topI); td.appendChild(addI);
      const tdP1pct = tr.insertCell(-1); tdP1pct.className = "num";
      td = tr.insertCell(-1);
      td.className = "aportebox";
      const topII = document.createElement("div");
      topII.className = "ap-total";
      topII.textContent = String(iiAbsNow);
      const addII = document.createElement("input");
      addII.type = "number"; addII.step = "1"; addII.className = "ap-input"; addII.placeholder = "±";
      td.appendChild(topII); td.appendChild(addII);
      const tdP2pct = tr.insertCell(-1); tdP2pct.className = "num";
      const tdTot = tr.insertCell(-1); tdTot.className = "num";
      const tdPub = tr.insertCell(-1); tdPub.className = "pub";
      const chk = document.createElement("input");
      chk.type = "checkbox"; chk.checked = !!st.publish;
      tdPub.appendChild(chk);
      function recalc() {
        const localQty = parseNum(qty.value);
        const p1 = parseNum(topI.textContent);
        const p2 = parseNum(topII.textContent);
        tdP1pct.textContent = clampPct(p1, localQty);
        tdP2pct.textContent = clampPct(p2, localQty);
        tdTot.textContent   = clampPct(p1 + p2, localQty);
      }
      recalc();
      function saveAdminState() {
        const state = readPageRows(ns);
        state[key] = {
          localQty: parseNum(qty.value),
          publish:  !!chk.checked
        };
        if (Object.prototype.hasOwnProperty.call(state, r.rid)) delete state[r.rid];
        writePageRows(ns, state);
      }
      const saveAndRecalc = () => { saveAdminState(); recalc(); };
      qty.addEventListener("input", saveAndRecalc);
      qty.addEventListener("change", saveAndRecalc);
      qty.addEventListener("blur",  saveAndRecalc);
      qty.addEventListener("keydown", (e)=>{ if(e.key==='Enter'){ e.preventDefault(); saveAndRecalc(); }});
      chk.addEventListener("change", saveAndRecalc);
      const commitDelta = (inputEl, which) => {
        const delta = parseNum(inputEl.value);
        if (!delta && inputEl.value !== "0" && inputEl.value !== "-0") { inputEl.value = ""; return; }
        const curI  = parseNum(topI.textContent);
        const curII = parseNum(topII.textContent);
        const nextI  = which === "abs1" ? curI + delta : curI;
        const nextII = which === "abs2" ? curII + delta : curII;
        topI.textContent  = String(nextI);
        topII.textContent = String(nextII);
        inputEl.value = "";
        writeProg(ns, r.rid, { abs1: nextI, abs2: nextII });
        recalc();
      };
      ["change","blur","keydown"].forEach(ev => {
        if (ev === "keydown") {
          addI.addEventListener(ev, (e)=>{ if(e.key==='Enter'){ e.preventDefault(); commitDelta(addI, "abs1"); }});
          addII.addEventListener(ev, (e)=>{ if(e.key==='Enter'){ e.preventDefault(); commitDelta(addII, "abs2"); }});
        } else {
          addI.addEventListener(ev, ()=>commitDelta(addI, "abs1"));
          addII.addEventListener(ev, ()=>commitDelta(addII, "abs2"));
        }
      });
    });
  }
  function renderPublicTableForNamespace({ ns, tableEl }) {
    const tbody = tableEl.tBodies[0];
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const rows = loadAllRows();
    const pageRows = readPageRows(ns);
    const visibles = rows.filter(r => {
      const st = pageRows[ckey(r.prapId, r.rid)] || pageRows[r.rid];
      return st?.publish === true;
    });
    visibles.forEach(r => {
      const key = ckey(r.prapId, r.rid);
      const st = pageRows[key] || pageRows[r.rid] || { localQty: 0, publish: false };
      const localQty = parseNum(st.localQty);
      const prog = readProg(ns, r.rid);
      const iAbsNow = parseNum(prog.abs1);
      const iiAbsNow = parseNum(prog.abs2);
      const tr = tbody.insertRow();
      let td = tr.insertCell(-1); td.textContent = r.obj;
      td = tr.insertCell(-1);     td.textContent = r.ind;
      td = tr.insertCell(-1);     td.className = "num"; td.textContent = String(localQty);
      td = tr.insertCell(-1);     td.textContent = r.acts;
      td = tr.insertCell(-1);     td.textContent = r.periodo;
      td = tr.insertCell(-1);     td.textContent = r.resp;
      td = tr.insertCell(-1); td.className = "aportebox";
      const topI = document.createElement("div");
      topI.className = "ap-total";
      topI.textContent = String(iAbsNow);
      const addI = document.createElement("input");
      addI.type = "number"; addI.step = "1"; addI.className = "ap-input"; addI.placeholder = "±";
      td.appendChild(topI); td.appendChild(addI);
      const tdP1pct = tr.insertCell(-1); tdP1pct.className = "num";
      td = tr.insertCell(-1); td.className = "aportebox";
      const topII = document.createElement("div");
      topII.className = "ap-total";
      topII.textContent = String(iiAbsNow);
      const addII = document.createElement("input");
      addII.type = "number"; addII.step = "1"; addII.className = "ap-input"; addII.placeholder = "±";
      td.appendChild(topII); td.appendChild(addII);
      const tdP2pct = tr.insertCell(-1); tdP2pct.className = "num";
      const tdTot = tr.insertCell(-1); tdTot.className = "num";
      function recalc() {
        const p1 = parseNum(topI.textContent);
        const p2 = parseNum(topII.textContent);
        tdP1pct.textContent = clampPct(p1, localQty);
        tdP2pct.textContent = clampPct(p2, localQty);
        tdTot.textContent   = clampPct(p1 + p2, localQty);
      }
      recalc();
      const commit = (inputEl, which) => {
        const delta = parseNum(inputEl.value);
        if (!delta && inputEl.value !== "0" && inputEl.value !== "-0") { inputEl.value = ""; return; }
        const curI  = parseNum(topI.textContent);
        const curII = parseNum(topII.textContent);
        const nextI  = which === "abs1" ? curI + delta : curI;
        const nextII = which === "abs2" ? curII + delta : curII;
        topI.textContent  = String(nextI);
        topII.textContent = String(nextII);
        inputEl.value = "";
        writeProg(ns, r.rid, { abs1: nextI, abs2: nextII });
        recalc();
      };
      ["change","blur","keydown"].forEach(ev => {
        if (ev === "keydown") {
          addI.addEventListener(ev, (e)=>{ if(e.key==='Enter'){ e.preventDefault(); commit(addI, "abs1"); }});
          addII.addEventListener(ev, (e)=>{ if(e.key==='Enter'){ e.preventDefault(); commit(addII, "abs2"); }});
        } else {
          addI.addEventListener(ev, ()=>commit(addI, "abs1"));
          addII.addEventListener(ev, ()=>commit(addII, "abs2"));
        }
      });
    });
  }
  window.CoreAvV2 = {
    renderAdminTableForNamespace,
    renderPublicTableForNamespace,
    loadAllRows,
    readProg,
    keyProg,
  };
  window.PrapAvanceNS = window.PrapAvanceNS || {};
  window.PrapAvanceNS.initAvancesPage = function ({ isAdmin, namespace }) {
    document.addEventListener("DOMContentLoaded", function () {
      const table = document.getElementById("tablaAvances");
      if (!table) return;
      const all = loadAllRows();
      const byRid = new Map();
      all.forEach(r => {
        if (!byRid.has(r.rid)) byRid.set(r.rid, []);
        byRid.get(r.rid).push({ prapId: r.prapId });
      });
      migratePageRowsIfNeeded(namespace, byRid);
      if (isAdmin) {
        CoreAvV2.renderAdminTableForNamespace({ ns: namespace, tableEl: table });
      } else {
        CoreAvV2.renderPublicTableForNamespace({ ns: namespace, tableEl: table });
      }
    });
    window.addEventListener("storage", (e) => {
      if (!e.key || !e.key.startsWith(YPFX)) return;
      const tail = e.key.slice(YPFX.length);
      const table = document.getElementById("tablaAvances");
      if (!table) return;
      const hit =
        tail === STORAGE_DIRECCION ||
        tail.startsWith("prap_") ||
        tail.startsWith(`page_rows_${namespace}`) ||
        tail.startsWith(`prog_${namespace}_`);
      if (hit) {
        if (isAdmin) {
          CoreAvV2.renderAdminTableForNamespace({ ns: namespace, tableEl: table });
        } else {
          CoreAvV2.renderPublicTableForNamespace({ ns: namespace, tableEl: table });
        }
      }
    });
  };
})();