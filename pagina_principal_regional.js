// pagina_principal_regional.js
(() => {
  "use strict";

  /* ==========================
     Utilidades de sesión / usuario
     ========================== */
  const SESSION_KEY = 'session_user';
  const USERS_KEY   = 'datos_administrativos_v1';
  const ADMINS_KEY  = 'usuarios_admin_v1';

  const readLS = (k, fb=null)=>{
    try{ return JSON.parse(localStorage.getItem(k)||'null')??fb; }
    catch{ return fb; }
  };

  const getSess = ()=>{
    try{ return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null'); }
    catch{ return null; }
  };

  const normKey = s => (s||"").toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ')
    .replace(/\s+/g,' ').trim();

  const rowIndex = row => {
    const idx = {}; if (!row) return idx;
    for (const k of Object.keys(row)) idx[normKey(k)] = row[k];
    return idx;
  };

  const getField = (row, variants) => {
    if (!row) return undefined;
    const idx = rowIndex(row);
    for (const v of variants) {
      const val = idx[normKey(v)];
      if (val !== undefined && val !== null && String(val).trim() !== "") return String(val).trim();
    }
    return undefined;
  };

  const findUserRowByUsername = (username) => {
    const rows = readLS(USERS_KEY, []);
    const uname = (username||'').trim().toLowerCase();
    return rows.find(r => (r?.usuario||'').trim().toLowerCase() === uname) || null;
  };

  function resolveNameAndAsesoria() {
    const sess = getSess();
    if(!sess) return { name:null, asesoria:null, isAdmin:false };

    const uname = (sess.username||'').trim();
    const role  = (sess.role||'').trim();
    const isAdmin = role === 'admin';

    const row = findUserRowByUsername(uname);

    const NAME_VARIANTS = ['Nombre completo','nombre completo','Nombre','nombre'];
    const ASESORIA_VARIANTS = [
      'Nombre de asesoria o equipo','Nombre de asesoría o equipo',
      'Asesoria','Asesoría','Asesoria equipo','Asesoría equipo',
      'Nombre de equipo','Equipo','Departamento','Area','Área'
    ];

    let name;
    if (isAdmin && uname.toLowerCase()==='administrador') {
      name = 'Administrador';
    } else if (isAdmin) {
      const admins = readLS(ADMINS_KEY, []);
      const hit = admins.find(a => (a?.usuario||'').trim().toLowerCase()===uname.toLowerCase());
      name = (hit?.nombre && String(hit.nombre).trim())
          || getField(row, NAME_VARIANTS)
          || uname
          || 'Administrador';
    } else {
      name = getField(row, NAME_VARIANTS) || uname || null;
    }

    let asesoria = getField(row, ASESORIA_VARIANTS);
    if (!asesoria && isAdmin) asesoria = 'Administración';

    return { name, asesoria, isAdmin };
  }

  function paintNameAndAsesoria() {
    const { name, asesoria, isAdmin } = resolveNameAndAsesoria();
    if (!name && !asesoria) return;

    const nameSel = isAdmin ? '[data-admin-name-slot]' : '[data-user-name-slot]';
    const aseSel  = isAdmin ? '[data-admin-asesoria-slot]' : '[data-user-asesoria-slot]';

    let nameSlot = document.querySelector(nameSel);
    let aseSlot  = document.querySelector(aseSel);

    if (!nameSlot || !aseSlot) {
      const landmark = document.querySelector('.perfil, .avatar, .user-card, .left-panel, .card, .profile, .icon, .panel-izq') || document.body;
      if (!nameSlot) { nameSlot = document.createElement('div'); nameSlot.className='name-slot'; landmark.appendChild(nameSlot); }
      if (!aseSlot)  { aseSlot  = document.createElement('div'); aseSlot.className='asesoria-slot'; nameSlot.insertAdjacentElement('afterend', aseSlot); }
    }

    if (name) nameSlot.textContent = name;
    if (asesoria) aseSlot.textContent = asesoria;
  }

  /* =========================================================
     AppYear — maneja años DESDE BD + localStorage
     - Guarda:
         app_year_id_v1  -> id_anio (1,2,3,...)
         app_year_v1     -> año (2025,2026,...)
         app_year_val_v1 -> año (igual que arriba, por compatibilidad)
     ========================================================= */

  const AppYear = (() => {
    const LS_ID  = "app_year_id_v1";
    const LS_VAL = "app_year_val_v1";
    const LS_OLD = "app_year_v1"; // compatibilidad con código viejo

    /** @type {{id:number, anio:number}[]} */
    let _years = [];  // viene de php/anio_listar.php

    function setYearListFromServer(list) {
      const norm = [];

      if (Array.isArray(list)) {
        for (const item of list) {
          if (!item || typeof item !== "object") continue;
          const id   = parseInt(item.id ?? item.id_anio ?? 0, 10);
          const anio = parseInt(item.anio ?? item.year ?? item.valor ?? 0, 10);
          if (Number.isFinite(id) && id > 0 && Number.isFinite(anio) && anio > 0) {
            norm.push({ id, anio });
          }
        }
      }

      if (!norm.length) {
        // Fallback si hay un problema grave con la BD
        // (esto SOLO es para que no se rompa la página)
        for (let i = 0; i < 4; i++) {
          norm.push({ id: i+1, anio: 2025 + i });
        }
      }

      norm.sort((a,b) => a.anio - b.anio); // de menor a mayor
      _years = norm;
    }

    function getYearOptions() {
      return _years.slice();
    }

    function findDefaultIndex() {
      if (!_years.length) return -1;

      // 1) Intentar por id guardado
      const rawId = localStorage.getItem(LS_ID);
      const id = parseInt(rawId ?? "", 10);
      if (Number.isFinite(id) && id > 0) {
        const idx = _years.findIndex(y => y.id === id);
        if (idx >= 0) return idx;
      }

      // 2) Compatibilidad: leer año (app_year_v1 / app_year_val_v1)
      const rawVal = localStorage.getItem(LS_OLD) ?? localStorage.getItem(LS_VAL);
      const val = parseInt(rawVal ?? "", 10);
      if (Number.isFinite(val) && val > 0) {
        const idx = _years.findIndex(y => y.anio === val);
        if (idx >= 0) return idx;
      }

      // 3) Intentar por ?year= en la URL
      const params = new URLSearchParams(location.search);
      const urlYear = parseInt(params.get("year") || "", 10);
      if (Number.isFinite(urlYear) && urlYear > 0) {
        const idx = _years.findIndex(y => y.anio === urlYear);
        if (idx >= 0) return idx;
      }

      // 4) Por defecto: el más reciente (último de la lista)
      return _years.length - 1;
    }

    function getCurrent() {
      const idx = findDefaultIndex();
      if (idx < 0) return null;
      return _years[idx];
    }

    function setCurrentById(id) {
      if (!_years.length) return null;

      const target = _years.find(y => y.id === id) || _years[_years.length-1];

      // Guardar en LS: ID y valor
      localStorage.setItem(LS_ID,  String(target.id));
      localStorage.setItem(LS_VAL, String(target.anio));
      // compatibilidad con código viejo
      localStorage.setItem(LS_OLD, String(target.anio));

      // Avisar al resto de la app
      try {
        window.dispatchEvent(new CustomEvent("yearchange", {
          detail: { id: target.id, anio: target.anio }
        }));
      } catch {}

      // Actualizar parámetro ?year= en la URL (valor legible, ej. 2027)
      const url = new URL(location.href);
      url.searchParams.set("year", String(target.anio));
      location.replace(url.toString());

      return target;
    }

    function getCurrentId() {
      const cur = getCurrent();
      return cur ? cur.id : null;
    }

    function getCurrentYear() {
      const cur = getCurrent();
      return cur ? cur.anio : null;
    }

    return {
      setYearListFromServer,
      getYearOptions,
      getCurrent,
      setCurrentById,
      getCurrentId,
      getCurrentYear
    };
  })();

  // Lo exponemos para otras páginas (ej. marco_referencia.js)
  window.AppYear = window.AppYear || AppYear;

  /* =========================================================
     Cargar años desde php/anio_listar.php
     ========================================================= */

  async function loadYearsConfig() {
    try {
      const resp = await fetch("php/anio_listar.php");
      const text = await resp.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("anio_listar.php no devolvió JSON válido. Respuesta:", text);
      }

      if (!resp.ok || !data || !data.ok || !Array.isArray(data.anios)) {
        console.error("anio_listar.php sin datos válidos, usando fallback", data);
        AppYear.setYearListFromServer([]);
        return;
      }

      // data.anios = [{id:1, anio:2025}, ...]
      AppYear.setYearListFromServer(data.anios);
    } catch (e) {
      console.error("Error de red en loadYearsConfig:", e);
      AppYear.setYearListFromServer([]);
    }
  }

  /* =========================================================
     YearTab — dropdown con scroll (no ocupa toda la pantalla)
     ========================================================= */

  function mountYearTab() {
    const host = document.getElementById('yearTab');
    if (!host) return;
    if (host.dataset.mounted === "1") return;
    host.dataset.mounted = "1";
    host.classList.add('year-tab');

    const options = AppYear.getYearOptions(); // [{id, anio}, ...]
    if (!options.length) return;

    const current = AppYear.getCurrent() || options[options.length - 1];
    const currentYear = current.anio;

    host.innerHTML = `
      <button class="yt-pill" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambiar año">
        <span class="yt-label">Año</span>
        <span class="yt-value">${currentYear}</span>
      </button>
      <div class="yt-pop" hidden>
        <ul class="yt-list" role="listbox" aria-label="Año"></ul>
      </div>
    `;

    const pill = host.querySelector(".yt-pill");
    const pop  = host.querySelector(".yt-pop");
    const list = host.querySelector(".yt-list");

    // Orden descendente (ej. 2040, 2039, 2038...)
    const sorted = options.slice().sort((a,b) => b.anio - a.anio);

    for (const y of sorted) {
      const li = document.createElement("li");
      li.className = "yt-item";
      li.setAttribute("role","option");
      li.textContent = y.anio;
      li.dataset.id  = String(y.id);
      if (y.id === current.id) li.classList.add("active");
      list.appendChild(li);
    }

    // Scroll para que el año actual quede visible (alrededor de 4 ítems)
    const scrollToCurrent = () => {
      const activeLi = list.querySelector(".yt-item.active");
      if (!activeLi) return;
      const liHeight = activeLi.offsetHeight || 1;
      const offset   = activeLi.offsetTop;
      const targetScroll = Math.max(0, offset - liHeight); // lo deja más o menos en medio
      pop.scrollTop = targetScroll;
    };

    const openPop = () => {
      pop.hidden = false;
      pill.setAttribute("aria-expanded", "true");
      scrollToCurrent();
      document.addEventListener("click", onDocClick, { once:true });
    };

    const closePop = () => {
      pop.hidden = true;
      pill.setAttribute("aria-expanded", "false");
    };

    const onDocClick = (e) => {
      if (!host.contains(e.target)) closePop();
    };

    pill.addEventListener("click", (ev) => {
      ev.stopPropagation();
      pop.hidden ? openPop() : closePop();
    });

    pop.addEventListener("click", (ev) => ev.stopPropagation());

    list.addEventListener("click", (e) => {
      const li = e.target.closest(".yt-item"); if (!li) return;
      const id = parseInt(li.dataset.id, 10);
      if (!Number.isFinite(id) || id <= 0) return;

      const selected = AppYear.setCurrentById(id);
      if (!selected) return;

      host.querySelector(".yt-value").textContent = selected.anio;
      list.querySelectorAll(".yt-item.active").forEach(n => n.classList.remove("active"));
      li.classList.add("active");
      // El redirect se hace dentro de AppYear.setCurrentById
    });
  }

  /* =========================================================
     Arranque
     ========================================================= */

  const start = async () => {
    paintNameAndAsesoria();
    await loadYearsConfig();
    mountYearTab();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* -------------------- Dropdown "Datos de la Empresa" + cierre seguro -------------------- */
(function () {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.nav-dropdown > .has-caret');
    const dd = e.target.closest('.nav-dropdown');
    if (trigger) {
      e.preventDefault();
      const parent = trigger.parentElement;
      const isOpen = parent.classList.contains('open');
      document.querySelectorAll('.nav-dropdown.open').forEach(n => {
        if (n !== parent) n.classList.remove('open');
      });
      parent.classList.toggle('open', !isOpen);
      return;
    }
    if (!dd) {
      document.querySelectorAll('.nav-dropdown.open').forEach(n => n.classList.remove('open'));
    }
  });

  document.addEventListener('click', (e) => {
    const menu = e.target.closest('.nav-dropdown .dropdown-menu');
    if (menu) e.stopPropagation();
  }, true);

  // Cierre seguro del popup de año si se hace click fuera
  const host = document.getElementById('yearTab');
  if (host) {
    const pill = host.querySelector('.yt-pill');
    const pop  = host.querySelector('.yt-pop');
    if (pill && pop) {
      pop.addEventListener('click', (ev) => ev.stopPropagation());
      pill.addEventListener('click', (ev) => ev.stopPropagation());
      document.addEventListener('click', (e) => {
        if (!host.contains(e.target)) {
          if (!pop.hidden) {
            pop.hidden = true;
            pill.setAttribute('aria-expanded','false');
          }
        }
      });
    }
  }
})();
