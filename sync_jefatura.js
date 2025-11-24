// === Sincronizador global del espejo de visitas_jefatura_v1 ===
// Se puede llamar desde cualquier página (resumen, reporte, formulario, etc.)
// y garantiza que el localStorage esté actualizado con el año activo,
// incluso cuando se vuelve con el botón "Atrás" del navegador.

(async () => {
  "use strict";

  const STORAGE_KEY = "visitas_jefatura_v1";
  const YEAR_KEY    = "app_year_val_v1";   // mismo que ya usas

  const readJSON = (k, fb = null) => {
    try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; }
    catch { return fb; }
  };
  const writeJSON = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  };

  async function getActiveYearId() {
    const resp = await fetch("php/anio_listar.php");
    const data = await resp.json().catch(() => null);
    if (!data?.ok || !Array.isArray(data.anios)) {
      throw new Error("Error al listar años");
    }

    const year = parseInt(localStorage.getItem(YEAR_KEY) || "0", 10);
    const found = data.anios.find(a => Number(a.anio) === year);
    if (!found) throw new Error("Año no encontrado en anio_listar.php");

    // En tus otros JS usas 'id', así que mantenemos eso
    return { year, yearId: Number(found.id ?? found.id_anio) };
  }

  // force = true => rehace el espejo aunque ya tenga datos
  async function syncVisitas(force = false) {
    const currentYear = parseInt(localStorage.getItem(YEAR_KEY) || "0", 10);
    if (!currentYear) return;

    const store = readJSON(STORAGE_KEY, {});
    const yearData = store[currentYear];

    if (!force && Array.isArray(yearData) && yearData.length > 0) {
      console.log(`✔ Espejo de jefatura ya cargado (${yearData.length} filas, año ${currentYear})`);
      return;
    }

    try {
      const { yearId } = await getActiveYearId();
      const r = await fetch(`php/jefatura_listar.php?anio=${encodeURIComponent(yearId)}`);
      const d = await r.json().catch(() => null);
      if (!d?.ok) throw new Error(d?.error || "Error al listar visitas");

      const rows = d.rows || [];

      // 👉 NO sobreescribimos todo, solo el año actual
      const newStore = readJSON(STORAGE_KEY, {});
      newStore[currentYear] = rows;
      writeJSON(STORAGE_KEY, newStore);

      try {
        localStorage.setItem("visitas_jefatura_last_update", String(Date.now()));
      } catch {}

      console.log(`🔁 Sincronizado ${rows.length} registros del año ${currentYear}`);

      // Avisar a las páginas que ya hay datos frescos
      window.dispatchEvent(new Event("visitas_jefatura_sync"));
    } catch (err) {
      console.warn("No se pudo sincronizar visitas:", err.message);
    }
  }

  // Hacemos visible la función por si quieres llamarla manualmente en consola
  window.syncVisitasJefatura = syncVisitas;

  // 1) Sincronizar al cargar por primera vez
  await syncVisitas(false);

  // 2) Sincronizar también cuando se vuelve con el botón "Atrás"
  //    (bfcache -> pageshow.persisted = true)
  window.addEventListener("pageshow", (ev) => {
    if (ev.persisted) {
      // Forzamos refresco desde BD
      syncVisitas(true);
    }
  });

})();
