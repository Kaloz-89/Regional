(function () {
  const STORAGE_KEY = "usuarios_admin_v1";
  const LEGACY_KEY = "usuarios_simple_v1";
  const tabla = document.getElementById("tablaUsuarios");
  const tbody = tabla.querySelector("tbody");
  const btnAdd = document.getElementById("btnAdd");
  const msg = document.getElementById("msg");
  const clean = (v) => (v == null ? "" : String(v).trim());
  const filaVacia = () => ({ nombre: "", usuario: "", contrasena: "" });
  function feedback(txt) {
    if (!msg) return;
    msg.textContent = txt || "";
    if (!txt) return;
    clearTimeout(feedback._t);
    feedback._t = setTimeout(() => (msg.textContent = ""), 1200);
  }
  // ====== Storage ======
  function leer(key = STORAGE_KEY) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function escribir(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      feedback("✔ Guardado.");
    } catch (e) {
      feedback("No se pudo guardar (storage lleno o bloqueado).");
      console.warn(e);
    }
  }
  (function migrateIfNeeded() {
    const current = leer(STORAGE_KEY);
    if (current && current.length) return;
    const legacy = leer(LEGACY_KEY);
    if (legacy && legacy.length) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        console.info("[usuarios_admin] Migrados", legacy.length, "registros desde", LEGACY_KEY);
      } catch (e) {
        console.warn("No se pudo migrar desde clave vieja:", e);
      }
    }
  })();
  // ====== DOM <-> Datos ======
  function dataDesdeDOM() {
    return [...tbody.rows].map((tr) => {
      const c = tr.cells;
      return {
        nombre:     clean(c[1]?.textContent),
        usuario:    clean(c[2]?.textContent),
        contrasena: clean(c[3]?.textContent) 
      };
    });
  }
  function crearFila(row, i) {
    const tr = document.createElement("tr");
    const tdNum = document.createElement("td");
    tdNum.textContent = String(i + 1);
    tr.appendChild(tdNum);
    [row.nombre, row.usuario, row.contrasena].forEach((valor) => {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = valor || "";
      tr.appendChild(td);
    });
    const tdAcc = document.createElement("td");
    tdAcc.style.textAlign = "center";
    const btn = document.createElement("button");
    btn.className = "btn-trash";
    btn.title = "Eliminar fila";
    btn.textContent = "🗑️";
    btn.addEventListener("click", () => eliminarFila(i));
    tdAcc.appendChild(btn);
    tr.appendChild(tdAcc);
    return tr;
  }
  function render(datos) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const rows = (Array.isArray(datos) && datos.length) ? datos : [filaVacia()];
    rows.forEach((row, i) => tbody.appendChild(crearFila(row, i)));
    renumerar();
  }
  function renumerar() {
    [...tbody.rows].forEach((tr, i) => {
      if (tr.cells[0]) tr.cells[0].textContent = String(i + 1);
    });
  }
  let tSave;
  function guardarDebounced() {
    clearTimeout(tSave);
    tSave = setTimeout(() => {
      const datos = dataDesdeDOM();
      escribir(datos);
    }, 120);
  }
  function agregarFila() {
    const datos = leer(STORAGE_KEY);
    datos.push(filaVacia());
    escribir(datos);
    render(datos);
  }
  function eliminarFila(idx) {
    const datos = leer(STORAGE_KEY);
    if (!datos[idx]) return;
    if (!confirm("¿Eliminar esta fila?")) return;
    datos.splice(idx, 1);
    escribir(datos);
    render(datos.length ? datos : [filaVacia()]);
  }
  btnAdd.addEventListener("click", agregarFila);
  tbody.addEventListener("input", (e) => {
    const td = e.target.closest('td[contenteditable="true"]');
    if (!td) return;
    guardarDebounced();
  });
  tbody.addEventListener("keydown", (e) => {
    const td = e.target.closest('td[contenteditable="true"]');
    if (!td) return;
    if (e.key === "Enter") {
      e.preventDefault();
      td.blur();
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) render(leer(STORAGE_KEY));
  });
  const data = leer(STORAGE_KEY);
  render(data.length ? data : [filaVacia()]);
})();