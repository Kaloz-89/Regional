(() => {
  "use strict";
  const SESSION_KEY = 'session_user';
  const USERS_KEY   = 'datos_administrativos_v1';
  const ADMINS_KEY  = 'usuarios_admin_v1';
  const readLS = (k, fb=null)=>{ try{ return JSON.parse(localStorage.getItem(k)||'null')??fb; }catch{ return fb; } };
  const getSess = ()=>{ try{ return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null'); }catch{ return null; } };
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
  const AppYear = (() => {
    const KEY = "app_year_v1";
    const MIN_YEAR = 2025;
    const MAX_YEAR = 2028;
    const getYearFromUrl = () => {
      const p = new URLSearchParams(location.search);
      const y = parseInt(p.get("year") || "", 10);
      return Number.isFinite(y) ? y : null;
    };
    const getYear = () => {
      const fromUrl = getYearFromUrl();
      if (fromUrl && fromUrl >= MIN_YEAR && fromUrl <= MAX_YEAR) return fromUrl;
      const fromLS = parseInt(localStorage.getItem(KEY) || "", 10);
      if (Number.isFinite(fromLS) && fromLS >= MIN_YEAR && fromLS <= MAX_YEAR) return fromLS;
      return MIN_YEAR;
    };
    const setYear = (y) => {
      let yy = parseInt(y,10);
      if (!Number.isFinite(yy)) yy = MIN_YEAR;
      yy = Math.max(MIN_YEAR, Math.min(MAX_YEAR, yy));
      localStorage.setItem(KEY, String(yy));
      window.dispatchEvent(new CustomEvent("yearchange", { detail:{ year: yy } }));
      const url = new URL(location.href);
      url.searchParams.set("year", String(yy));
      location.replace(url.toString());
      return yy;
    };
    return { getYear, setYear, MIN_YEAR, MAX_YEAR };
  })();
  window.AppYear = window.AppYear || AppYear;
  function mountYearTab() {
    const host = document.getElementById('yearTab');
    if (!host) return;
    if (host.dataset.mounted === "1") return;
    host.dataset.mounted = "1";
    host.classList.add('year-tab');
    host.innerHTML = `
      <button class="yt-pill" aria-haspopup="listbox" aria-expanded="false" aria-label="Cambiar año">
        <span class="yt-label">Año</span>
        <span class="yt-value">${AppYear.getYear()}</span>
      </button>
      <div class="yt-pop" hidden>
        <ul class="yt-list" role="listbox" aria-label="Año"></ul>
      </div>
    `;
    const pill = host.querySelector(".yt-pill");
    const pop  = host.querySelector(".yt-pop");
    const list = host.querySelector(".yt-list");
    for (let y = AppYear.MAX_YEAR; y >= AppYear.MIN_YEAR; y--) {
      const li = document.createElement("li");
      li.className = "yt-item";
      li.setAttribute("role","option");
      li.textContent = y;
      li.dataset.val = y;
      if (y === AppYear.getYear()) li.classList.add("active");
      list.appendChild(li);
    }
    const openPop = () => {
      pop.hidden = false;
      pill.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onDoc, { once:true });
    };
    const closePop = () => {
      pop.hidden = true;
      pill.setAttribute("aria-expanded", "false");
    };
    const onDoc = (e) => { if (!host.contains(e.target)) closePop(); };
    pill.addEventListener("click", () => { pop.hidden ? openPop() : closePop(); });
    list.addEventListener("click", (e) => {
      const li = e.target.closest(".yt-item"); if (!li) return;
      const y = parseInt(li.dataset.val,10);
      host.querySelector(".yt-value").textContent = y;
      list.querySelectorAll(".yt-item.active").forEach(n=>n.classList.remove("active"));
      li.classList.add("active");
      closePop();
      AppYear.setYear(y);
    });
  }
  const start = () => {
    paintNameAndAsesoria();
    mountYearTab();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
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