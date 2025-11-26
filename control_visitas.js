(() => {
  "use strict";

  const STORAGE_KEY = "visitas_jefatura_v1";
  const YEAR_KEY    = "app_year_val_v1";
  const SESSION_KEY = "session_user";

  // Utilidades de almacenamiento local
  const readJSON = (k, fb = null) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const clearStore = () => localStorage.removeItem(STORAGE_KEY);

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Obtiene el año activo (de localStorage global)
  function getActiveYear() {
    const y = parseInt(localStorage.getItem(YEAR_KEY) || "0", 10);
    return Number.isFinite(y) && y > 0 ? y : 2025;
  }

  // --------------------------------------------------
  // PERFIL: nombre + asesoría debajo de la foto
  // --------------------------------------------------
  async function hydrateProfileCard() {
    const nameSlot     = document.querySelector("[data-profile-name]");
    const asesoriaSlot = document.querySelector("[data-profile-asesoria]");
    if (!nameSlot && !asesoriaSlot) return;

    const sess = getSession();
    if (!sess || !sess.username) {
      if (nameSlot)     nameSlot.textContent     = "Sesión no encontrada";
      if (asesoriaSlot) asesoriaSlot.textContent = "";
      return;
    }

    const baseName  = sess.nombre || sess.username || "";
    const userId    = Number(sess.id_usuarios || 0); // usamos el id_usuarios de la sesión
    const username  = (sess.username || "").toLowerCase();
    const asesoriaFromSession = sess.asesoria_usuarios || "";

    // Siempre mostramos al menos el nombre de la sesión
    if (nameSlot) nameSlot.textContent = baseName;

    // Si ya tenemos la asesoría guardada en sesión, la ponemos de una vez
    if (asesoriaFromSession && asesoriaSlot) {
      asesoriaSlot.textContent = asesoriaFromSession;
    }

    try {
      // Usamos la misma API de usuarios/asesorías que plan_asesorias
      const resp = await fetch("php/progreso_crud.php?action=list_asesorias");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const lista = await resp.json();

      if (!Array.isArray(lista) || !lista.length) return;

      // 1) Intentamos primero empatar por id_usuarios
      let propio = null;
      if (userId) {
        propio = lista.find(u => Number(u.id_usuarios) === userId);
      }

      // 2) Si por ID no aparece (caso raro), intentamos por username
      if (!propio) {
        propio = lista.find(u => (u.usuario || "").toLowerCase() === username);
      }

      if (propio) {
        if (nameSlot) {
          nameSlot.textContent = propio.nombre || baseName;
        }
        if (asesoriaSlot) {
          asesoriaSlot.textContent =
            propio.asesoria_usuarios ||
            asesoriaFromSession ||
            "";
        }
      }
    } catch (e) {
      console.error("Error al obtener asesoría para el perfil:", e);
      // Dejamos lo que ya había (nombre + posible asesoría de sesión)
    }
  }

  // --------------------------------------------------
  // Carga los datos de Jefatura desde BD → espejo local
  // --------------------------------------------------
  async function loadYearData(year) {
    if (!year) return;
    try {
      const resp = await fetch(`php/anio_listar.php`);
      const list = await resp.json().catch(() => null);
      const found = list?.anios?.find(r => Number(r.anio) === Number(year));
      if (!found) throw new Error("Año no encontrado en BD");

      const anioId = found.id;
      const res2 = await fetch(`php/jefatura_listar.php?anio=${anioId}`);
      const data = await res2.json().catch(() => null);
      if (!data || !data.ok) throw new Error(data?.error || "Error al listar visitas");

      // Reemplazar completamente el espejo
      const map = {};
      map[String(year)] = data.rows || [];
      writeJSON(STORAGE_KEY, map);
      localStorage.setItem("visitas_jefatura_last_update", String(Date.now()));
      console.log(`✔ Espejo actualizado para ${year}: ${data.rows.length} filas`);

    } catch (e) {
      console.error("❌ Error al cargar datos del año:", e);
      clearStore();
    }
  }

  // Recargar al cambiar de año (evento global de AppYear)
  window.addEventListener("yearchange", (ev) => {
    const newYear = ev?.detail?.anio || getActiveYear();
    clearStore();
    loadYearData(newYear);
  });

  // Carga inicial al entrar
  document.addEventListener("DOMContentLoaded", () => {
    hydrateProfileCard();   // <-- llena nombre + asesoría
    const y = getActiveYear();
    clearStore();
    loadYearData(y);
  });

})();
