(function () {
  try { history.replaceState({ noForward: true }, "", location.href); } catch {}
  window.addEventListener("popstate", function (e) {
    try {
      if (e.state && e.state.noForward) {
        history.pushState({ noForward: true }, "", location.href);
      }
    } catch {}
  });
})();
(function () {
  const STORAGE_KEY = "datos_administrativos_v1";
  const tbody = document.querySelector("#tablaAdminPublic tbody");
  function leer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : null;
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[m]));
  }
  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
  }
  function render(data) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    const rows = Array.isArray(data) && data.length
      ? data
      : [{ asesoria: "", nombre: "", correo: "" }];
    rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      // N°
      const tdNum = document.createElement("td");
      tdNum.textContent = String(i + 1);
      tr.appendChild(tdNum);
      // Asesoría/Equipo
      const tdAs = document.createElement("td");
      tdAs.textContent = (row.asesoria || row.equipo || "");
      tr.appendChild(tdAs);
      // Nombre
      const tdNom = document.createElement("td");
      tdNom.textContent = (row.nombre || row.nombre_completo || "");
      tr.appendChild(tdNom);
      // Correo (link mailto si es válido)
      const tdCor = document.createElement("td");
      const correo = (row.correo || row.email || "").trim();
      if (correo && isEmail(correo)) {
        const a = document.createElement("a");
        a.href = `mailto:${correo}`;
        a.textContent = correo;
        a.rel = "noopener";
        tdCor.appendChild(a);
      } else {
        tdCor.textContent = correo || "—";
      }
      tr.appendChild(tdCor);
      tbody.appendChild(tr);
    });
  }
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) render(leer());
  });
  render(leer());
})();