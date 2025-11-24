(() => {
  "use strict";

  const STORAGE_KEY = "visitas_jefatura_v1";
  const YEAR_KEY    = "app_year_val_v1";

  // Utilidades
  const readJSON = (k, fb=null) => { try { return JSON.parse(localStorage.getItem(k)||'null') ?? fb; } catch { return fb; } };
  const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const clearStore = () => localStorage.removeItem(STORAGE_KEY);

  // Obtiene el año activo (de localStorage global)
  function getActiveYear(){
    const y = parseInt(localStorage.getItem(YEAR_KEY)||"0",10);
    return Number.isFinite(y) && y>0 ? y : 2025;
  }

  // Carga los datos del año desde BD → localStorage
  async function loadYearData(year){
    if (!year) return;
    try {
      const resp = await fetch(`php/anio_listar.php`);
      const list = await resp.json().catch(()=>null);
      const found = list?.anios?.find(r => Number(r.anio)===Number(year));
      if (!found) throw new Error("Año no encontrado en BD");

      const anioId = found.id;
      const res2 = await fetch(`php/jefatura_listar.php?anio=${anioId}`);
      const data = await res2.json().catch(()=>null);
      if (!data || !data.ok) throw new Error(data?.error || "Error al listar visitas");

      // Reemplazar completamente el espejo
      const map = {};
      map[String(year)] = data.rows || [];
      writeJSON(STORAGE_KEY, map);
      localStorage.setItem("visitas_jefatura_last_update", String(Date.now()));
      console.log(`✔ Espejo actualizado para ${year}: ${data.rows.length} filas`);

    } catch(e){
      console.error("❌ Error al cargar datos del año:", e);
      clearStore();
    }
  }

  // Recargar al cambiar de año (evento global de AppYear)
  window.addEventListener("yearchange", (ev)=>{
    const newYear = ev?.detail?.anio || getActiveYear();
    clearStore();
    loadYearData(newYear);
  });

  // Carga inicial al entrar
  document.addEventListener("DOMContentLoaded", ()=>{
    const y = getActiveYear();
    clearStore();
    loadYearData(y);
  });

})();
