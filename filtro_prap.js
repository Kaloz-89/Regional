// Bloquear botón atrás en la vista pública
(function () {
  try { history.replaceState({ noForward: true }, "", location.href); } catch {}
  window.addEventListener("popstate", (e) => {
    try {
      if (e.state && e.state.noForward)
        history.pushState({ noForward: true }, "", location.href);
    } catch {}
  });
})();

// ================== Filtro PRAP Público (solo lectura desde BD) ==================
(function () {
  "use strict";

  const YEAR_STORE_KEY = "app_year_v1";
  const NOW = new Date().getFullYear();

  function getActiveYear() {
    const p = new URLSearchParams(location.search);
    const fromUrl = parseInt(p.get("year") || "", 10);
    if (Number.isFinite(fromUrl)) {
      localStorage.setItem(YEAR_STORE_KEY, String(fromUrl));
      return fromUrl;
    }
    const fromLs = parseInt(localStorage.getItem(YEAR_STORE_KEY) || "", 10);
    if (Number.isFinite(fromLs)) return fromLs;
    return NOW;
  }

  const YEAR = getActiveYear();
  let YEAR_ID = 1;

  // -------- DOM --------
  const selDireccion = document.getElementById("selDireccion");
  const inpResp      = document.getElementById("inpResp");
  const btnBuscar    = document.getElementById("btnBuscar");
  const btnLimpiar   = document.getElementById("btnLimpiar");
  const tbody        = document.querySelector("#tablaFiltro tbody");
  const lblResumen   = document.getElementById("lblResumen");

  if (!selDireccion || !inpResp || !btnBuscar || !btnLimpiar || !tbody || !lblResumen) {
    console.warn("[filtro_prap_public] Faltan elementos esperados en el DOM.");
    return;
  }

  let TODOS = [];
  let DIRS  = [];

  const norm = (s) =>
    (s ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ");

  async function resolveYearId() {
    try {
      const resp = await fetch("php/anio_listar.php");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.anios)) throw new Error("Formato inválido");

      const found = data.anios.find((a) => parseInt(a.anio, 10) === YEAR);
      if (!found) {
        YEAR_ID = data.anios.length ? parseInt(data.anios[0].id, 10) || 1 : 1;
        return YEAR_ID;
      }
      const idAnio = parseInt(found.id, 10);
      YEAR_ID = Number.isFinite(idAnio) && idAnio > 0 ? idAnio : 1;
      return YEAR_ID;
    } catch (e) {
      console.error("Error resolveYearId:", e);
      YEAR_ID = 1;
      return YEAR_ID;
    }
  }

  // -------- Cargar datos --------
  async function cargarDatos() {
    lblResumen.textContent = "Cargando datos…";
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Cargando datos…</td></tr>`;

    try {
      await resolveYearId();

      const url = `php/filtro_prap_admin_api.php?anio=${encodeURIComponent(YEAR_ID)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();

      if (!data.ok || !Array.isArray(data.rows)) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">Error al cargar datos.</td></tr>`;
        lblResumen.textContent = "Mostrando 0 resultados";
        return;
      }

      TODOS = data.rows;
      const seen = new Set();
      DIRS = [];
      TODOS.forEach((r) => {
        const id = String(r.dir_id ?? "");
        const nom = r.dir_nombre ?? "";
        if (id && !seen.has(id)) {
          seen.add(id);
          DIRS.push({ id, nombre: nom });
        }
      });

      poblarDirecciones();
      ejecutarFiltro();
    } catch (e) {
      console.error("Error al cargar datos PRAP público:", e);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No se pudieron cargar los datos.</td></tr>`;
      lblResumen.textContent = "Mostrando 0 resultados";
    }
  }

  function poblarDirecciones() {
    selDireccion.innerHTML = `<option value="">— Todas —</option>`;
    DIRS.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = d.nombre ? d.nombre : `Dirección #${i + 1}`;
      selDireccion.appendChild(opt);
    });
    selDireccion.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function ejecutarFiltro() {
    const dirIdSel  = selDireccion.value;
    const respQuery = norm(inpResp.value);

    const filtrados = TODOS.filter((row) => {
      if (dirIdSel && String(row.dir_id) !== dirIdSel) return false;
      if (respQuery) {
        const respN = norm(row.resp || "");
        return respN.includes(respQuery);
      }
      return true;
    });

    renderTabla(filtrados);
  }

  function renderTabla(items) {
    tbody.innerHTML = "";

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center">No hay resultados para los filtros seleccionados.</td></tr>`;
      lblResumen.textContent = "Mostrando 0 resultados";
      return;
    }

    items.forEach((it) => {
      const tr = tbody.insertRow();
      tr.insertCell(0).textContent = it.dir_nombre || "";
      tr.insertCell(1).textContent = it.obj || "";
      tr.insertCell(2).textContent = it.ind || "";
      tr.insertCell(3).textContent = it.cant || "";
      tr.insertCell(4).textContent = it.acts || "";
      tr.insertCell(5).textContent = it.periodo || "";
      tr.insertCell(6).textContent = it.resp || "";
      const tdVer = tr.insertCell(7);
      const a = document.createElement("a");
      a.href = `vista_prap.html?id=${encodeURIComponent(it.dir_id)}&year=${YEAR}`;
      a.textContent = "Ver";
      tdVer.appendChild(a);
    });

    lblResumen.textContent = `Mostrando ${items.length} resultado${items.length === 1 ? "" : "s"}`;
  }

  btnBuscar.addEventListener("click", ejecutarFiltro);
  btnLimpiar.addEventListener("click", () => {
    selDireccion.value = "";
    inpResp.value = "";
    ejecutarFiltro();
  });
  inpResp.addEventListener("input", () => ejecutarFiltro());
  selDireccion.addEventListener("change", ejecutarFiltro);

  cargarDatos();
})();
