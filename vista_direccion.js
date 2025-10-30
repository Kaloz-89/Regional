// ===== Vista de Direcciones (solo lectura) con almacenamiento por AÑO =====
(function () {
  // Año (lo define la home)
  const YEAR_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();
  const getYear = () => {
    const y = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    return Number.isFinite(y) ? y : NOW;
  };
  const ykey  = (k)    => `${getYear()}_${k}`;
  const yGet  = (k)    => localStorage.getItem(ykey(k));
  const STORAGE_KEY = "tablaPoa_direccion_v1";
  const DETAIL_VIEW_PAGE = "vista_prap.html";
  const COLS = 4;
  const table = document.getElementById('tablaPoaView');
  const tbody = table ? table.getElementsByTagName('tbody')[0] : null;
  if (!tbody) return;
  // Datos
  function leerDirecciones() {
    try {
      const raw = yGet(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  // Render
  function render() {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const data = leerDirecciones();
    if (!data.length) {
      const tr = tbody.insertRow();
      const td = tr.insertCell(0);
      td.colSpan = 1 + COLS; // N° + 4 columnas
      td.textContent = "Sin registros.";
      td.style.textAlign = "center";
      return;
    }
    const year = getYear();
    data.forEach((fila, idx) => {
      const tr = tbody.insertRow();
      const tdNum = tr.insertCell(0);
      const url = `${DETAIL_VIEW_PAGE}?id=${encodeURIComponent(fila.id)}&year=${year}`;
      tdNum.innerHTML = `<a href="${url}" class="link-num" data-href="${url}">${idx + 1}</a>`;
      tdNum.style.textAlign = "center";
      const cols = Array.isArray(fila.cols) ? fila.cols : [];
      for (let i = 0; i < COLS; i++) {
        const td = tr.insertCell(i + 1);
        td.textContent = cols[i] ?? "";
      }
    });
  }
  tbody.addEventListener('click', (e) => {
    const a = e.target.closest('a.link-num');
    if (a) {
      e.preventDefault();
      const href = a.getAttribute('data-href') || a.href;
      if (href) location.replace(href);
    }
  });
  render();
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    const yr = `${getYear()}_`;
    if (!e.key.startsWith(yr)) return;
    const tail = e.key.slice(yr.length);
    if (tail === STORAGE_KEY) render();
  });
})();