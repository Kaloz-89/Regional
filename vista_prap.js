// vista_prap.js (solo lectura) con soporte por AÑO
(function () {
  // Año (URL > localStorage > año actual)
  const YEAR_STORE_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  function getActiveYear() {
    const params = new URLSearchParams(location.search);
    const fromUrl = parseInt(params.get("year") || "", 10);
    if (Number.isFinite(fromUrl)) return fromUrl;
    const fromLs = parseInt(localStorage.getItem(YEAR_STORE_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW;
  }
  const YEAR = getActiveYear();
  // Parámetro id (obligatorio)
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const MAIN_VIEW = "vista_direccion.html";
  if (!id) {
    alert("Falta el parámetro id (ej: vista_prap.html?id=XXXX&year=YYYY).");
    // Evita dejar historial “hacia adelante”
    const backUrl = `${MAIN_VIEW}?year=${YEAR}`;
    location.replace(backUrl);
    return;
  }
  // Clave de almacenamiento por AÑO
  const KEY = `${YEAR}_prap_${id}`;
  // DOM
  const table = document.getElementById("tablaPrapView");
  const tbody = table ? table.getElementsByTagName("tbody")[0] : null;
  if (!tbody) return;
  // Datos
  function leer() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  // Render
  function render() {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const data = leer();
    if (!data.length) {
      const tr = tbody.insertRow();
      const td = tr.insertCell(0);
      td.colSpan = 6; // obj, ind, cant, acts, periodo, resp
      td.textContent = "Sin registros PRAP para este ítem.";
      td.style.textAlign = "center";
      return;
    }
    data.forEach((fila) => {
      const tr = tbody.insertRow();
      const campos = ["obj", "ind", "cant", "acts", "periodo", "resp"];
      campos.forEach((k) => {
        const td = tr.insertCell(tr.cells.length);
        td.textContent = fila[k] ?? "";
      });
    });
  }
  // Render inicial
  render();
  // Re-render solo si cambia esta clave exacta (mismo año e id)
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) render();
  });
  document.addEventListener("DOMContentLoaded", function () {
    const back = document.getElementById("btnBackDir");
    if (!back) return;
    // Asegura que el href preserve el year actual
    const rawHref = back.getAttribute("href") || MAIN_VIEW;
    const url = new URL(rawHref, location.href);
    if (!url.searchParams.has("year")) {
      url.searchParams.set("year", String(YEAR));
      back.setAttribute("href", url.pathname + "?" + url.searchParams.toString());
    }
    back.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        const href = back.getAttribute("href") || `${MAIN_VIEW}?year=${YEAR}`;
        // Reemplaza la URL actual sin dejar “adelante” en el historial
        location.replace(href);
      },
      { passive: false }
    );
  });
})();