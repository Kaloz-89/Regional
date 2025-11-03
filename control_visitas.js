/* Control de Visitas — perfil delgado pegado al header.
   - Exige login si tu guard existe.
   - Obtiene el nombre con la MISMA lógica que la página principal.
   - No añade lógica de negocio a los botones (placeholders). */

(function () {
  // 1) Enforce login (si tu app expone un guard)
  try { window.requireAuth?.(); } catch (e) { console.warn('Guard login no disponible', e); }

  // 2) (Opcional) clave de página para tu sistema de años
  try { window.registerPageKey?.('control_visitas'); } catch (_) {}

  // === Copia compacta de la lógica de la principal para resolver nombre ===
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

  function resolveName() {
    const sess = getSess();
    if(!sess) return null;
    const uname = (sess.username||'').trim();
    const role  = (sess.role||'').trim();
    const isAdmin = role === 'admin';
    const row = findUserRowByUsername(uname);

    const NAME_VARIANTS = ['Nombre completo','nombre completo','Nombre','nombre'];
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
    return name || '—';
  }

  // Pintar SOLO el nombre bajo la imagen (como pediste)
  const nameEl = document.querySelector('[data-profile-name]');
  if (nameEl) nameEl.textContent = resolveName();

  // 3) Si tienes inicialización de header mínima, engánchate (opcional)
  try { window.initHeaderMinimal?.(); } catch (_) {}
})();
