(function oneWayNav() {
  function isInternalHtmlLink(a) {
    if (!a || !a.href) return false;
    const href = a.getAttribute('href') || '';
    const lowered = href.trim().toLowerCase();
    if (
      lowered.startsWith('mailto:') ||
      lowered.startsWith('tel:') ||
      lowered.startsWith('javascript:') ||
      lowered.startsWith('blob:') ||
      a.hasAttribute('download')
    ) return false;
    const url = new URL(a.href, location.href);
    const isSameOrigin = url.origin === location.origin;
    const isHtml = /\.html($|[?#])/i.test(url.pathname);
    return isSameOrigin && isHtml;
  }
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('a');
    if (!a) return;
    if (!isInternalHtmlLink(a)) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || a.target === '_blank') return;
    ev.preventDefault();
    location.replace(a.href);
  }, true);
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) setTimeout(() => { history.back(); }, 0);
  });
})();
(function () {
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
  const MAIN_PAGE = "direccion.html";
  const params = new URLSearchParams(location.search);
  const dirId = params.get("id");
  if (!dirId) {
    alert("Falta el parámetro id en la URL (ej: prap.html?id=XXXX&year=YYYY).");
    const backUrl = `${MAIN_PAGE}?year=${YEAR}`;
    location.replace(backUrl);
    return;
  }
  const KEY = `${YEAR}_prap_${dirId}`;
  const table = document.getElementById("tablaPrap");
  const tbody = table ? table.getElementsByTagName("tbody")[0] : null;
  if (!tbody) return;
  const btnAdd = document.getElementById("agregarFila");
  const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(1, 10);
  function normalizeFila(f) {
    return {
      rid: f.rid || rid(),
      obj: f.obj ?? "",
      ind: f.ind ?? "",
      cant: f.cant ?? "",
      acts: f.acts ?? "",
      periodo: f.periodo ?? "",
      resp: f.resp ?? ""
    };
  }
  function leer() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(arr)) return [];
      return arr.map(normalizeFila);
    } catch { return []; }
  }
  function escribir(arr) {
    try {
      localStorage.setItem(KEY, JSON.stringify(arr.map(normalizeFila)));
    } catch (e) {
      console.warn("No se pudo guardar PRAP:", e);
    }
  }
  function render() {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const filas = leer();
    const filas2 = leer();
    filas2.forEach((fila) => {
      const tr = tbody.insertRow();
      const campos = ["obj", "ind", "cant", "acts", "periodo", "resp"];
      campos.forEach((k, i) => {
        const td = tr.insertCell(i);
        td.contentEditable = "true";
        td.textContent = fila[k] ?? "";
        td.dataset.key = k;
        td.dataset.rid = fila.rid;
      });
      const tdAcc = tr.insertCell(6);
      const btn = document.createElement("button");
      btn.textContent = "🗑️";
      btn.className = "eliminar-fila btn btn-danger";
      btn.addEventListener("click", () => {
        const nuevo = leer().filter(x => x.rid !== fila.rid);
        escribir(nuevo);
        render();
      });
      tdAcc.style.textAlign = "center";
      tdAcc.appendChild(btn);
    });
  }
  function agregarFila() {
    const arr = leer();
    arr.push(normalizeFila({}));
    escribir(arr);
    render();
  }
  let tSave;
  function guardarDesdeDOM() {
    clearTimeout(tSave);
    tSave = setTimeout(() => {
      const nuevo = [];
      [...tbody.rows].forEach((tr) => {
        const c = tr.cells;
        const r =
          (c[0]?.dataset?.rid) ||
          (c[1]?.dataset?.rid) ||
          (c[2]?.dataset?.rid) ||
          null;
        nuevo.push({
          rid: r || rid(),
          obj: c[0]?.textContent ?? "",
          ind: c[1]?.textContent ?? "",
          cant: c[2]?.textContent ?? "",
          acts: c[3]?.textContent ?? "",
          periodo: c[4]?.textContent ?? "",
          resp: c[5]?.textContent ?? "",
        });
      });
      escribir(nuevo);
    }, 120);
  }
  if (btnAdd) btnAdd.addEventListener("click", agregarFila);
  tbody.addEventListener("input", (e) => {
    if (!e.target.closest('td[contenteditable="true"]')) return;
    guardarDesdeDOM();
  });
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".eliminar-fila");
    if (!btn) return;
    const tr = btn.closest("tr");
    tr?.remove();
    guardarDesdeDOM();
    render();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) render();
  });
  escribir(leer());
  render();
})();