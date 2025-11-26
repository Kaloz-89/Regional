// plan_asesorias_asesor.js — vista de usuario (solo su asesoría)
(function () {
  "use strict";

  const SESSION_KEY = "session_user";
  const YEAR_KEY    = "app_year_v1";

  // OJO: ids iguales a los del HTML público
  const spanPersona  = document.getElementById("nombreAsesor");
  const spanAsesoria = document.getElementById("nombreAsesoria");
  const tbody        = document.querySelector("#tablaAvances tbody");
  const btnPrint     = document.getElementById("btnPrintAsesor");

  if (!tbody) return;

  // ========= Utiles =========
  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getLogicalYear() {
    const p = new URLSearchParams(location.search);
    const yUrl = parseInt(p.get("year") || "", 10);
    if (Number.isFinite(yUrl)) {
      localStorage.setItem(YEAR_KEY, String(yUrl));
      return yUrl;
    }
    const yLs = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    if (Number.isFinite(yLs)) return yLs;
    return new Date().getFullYear();
  }

  const ANIO_LOGICO = getLogicalYear();
  let YEAR_ID = null;           // id_anio real para progreso
  let CURRENT_USER_ID = null;   // id_usuarios
  let CURRENT_ASESORIA = "";    // texto asesoria
  let CURRENT_NOMBRE   = "";    // nombre persona

  // ========= Resolver id_anio =========
  async function resolveYearId() {
    if (YEAR_ID !== null) return YEAR_ID;
    try {
      const resp = await fetch("php/anio_listar.php");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (!data.ok || !Array.isArray(data.anios)) throw new Error("Formato inválido");

      const found = data.anios.find(a => parseInt(a.anio, 10) === ANIO_LOGICO);
      if (!found) {
        YEAR_ID = data.anios.length ? parseInt(data.anios[0].id, 10) || 1 : 1;
      } else {
        const idAnio = parseInt(found.id, 10);
        YEAR_ID = Number.isFinite(idAnio) && idAnio > 0 ? idAnio : 1;
      }
    } catch (e) {
      console.error("Error resolveYearId:", e);
      YEAR_ID = 1;
    }
    return YEAR_ID;
  }

  // ========= Porcentajes =========
  function formatPercent(value) {
    if (!Number.isFinite(value) || value <= 0) return "0%";
    const v = Number(value.toFixed(1));
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "%";
  }

  function actualizarPorcentajes(tr) {
    const inputCant = tr.querySelector(".cantidad");
    const inputP1   = tr.querySelector(".p1abs");
    const inputP2   = tr.querySelector(".p2abs");

    const celdaP1   = tr.querySelector(".celda-p1por");
    const celdaP2   = tr.querySelector(".celda-p2por");
    const celdaTot  = tr.querySelector(".celda-total");

    const cant = Number(inputCant.value) || 0;
    const p1   = Number(inputP1.value)   || 0;
    const p2   = Number(inputP2.value)   || 0;

    if (cant <= 0) {
      celdaP1.textContent  = "0%";
      celdaP2.textContent  = "0%";
      celdaTot.textContent = "0%";
      return;
    }

    const p1por = (p1 / cant) * 100;
    const p2por = (p2 / cant) * 100;
    const total = ((p1 + p2) / cant) * 100;

    celdaP1.textContent  = formatPercent(p1por);
    celdaP2.textContent  = formatPercent(p2por);
    celdaTot.textContent = formatPercent(total);
  }

  // ========= Guardar una fila (solo p1, p2, cantidad ya viene fija) =========
  async function saveRow(tr) {
    if (!CURRENT_USER_ID) return;
    const yearId = await resolveYearId();
    if (!yearId) return;

    const payload = [{
      id_prap:   tr.dataset.id_prap,
      anio:      yearId,
      encargado: CURRENT_USER_ID,
      cantidad:  tr.querySelector(".cantidad").value || 0,
      p1abs:     tr.querySelector(".p1abs").value    || 0,
      p2abs:     tr.querySelector(".p2abs").value    || 0
    }];

    try {
      const resp = await fetch("php/progreso_crud.php?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        console.error("Error HTTP al guardar fila:", resp.status);
      }
    } catch (err) {
      console.error("Error fetch saveRow:", err);
    }
  }

  // ========= Cargar PRAP + progreso del usuario =========
  function cargarTabla(idUsuario, anioId) {
    tbody.innerHTML = `<tr><td colspan="11">Cargando datos...</td></tr>`;

    fetch(`php/progreso_crud.php?action=load&anio=${anioId}&encargado=${idUsuario}`)
      .then(res => res.json())
      .then(data => {
        tbody.innerHTML = "";

        // Solo PRAP asignados (marcado = true)
        const filas = Array.isArray(data)
          ? data.filter(r => r.marcado)
          : [];

        if (!filas.length) {
          tbody.innerHTML = `<tr><td colspan="11">No hay objetivos PRAP asignados a tu asesoría para este año.</td></tr>`;
          return;
        }

        filas.forEach(row => {
          const tr = document.createElement("tr");
          tr.dataset.id_prap = row.id_prap;

          const cantidad = Number(row.cantidad) || 0;
          const p1abs    = Number(row.p1abs)    || 0;
          const p2abs    = Number(row.p2abs)    || 0;

          tr.innerHTML = `
            <td>${row.objetivo || ""}</td>
            <td>${row.indicador || ""}</td>
            <td class="num">
              <input type="number" class="cantidad" value="${cantidad}" readonly>
            </td>
            <td>${row.actividad || ""}</td>
            <td>${row.periodo || ""}</td>
            <td>${row.responsables || ""}</td>
            <td class="num">
              <input type="number" class="p1abs abs" value="${p1abs}">
            </td>
            <td class="num celda-p1por"></td>
            <td class="num">
              <input type="number" class="p2abs abs" value="${p2abs}">
            </td>
            <td class="num celda-p2por"></td>
            <td class="num celda-total"></td>
          `;

          tbody.appendChild(tr);

          // cálculo inicial
          actualizarPorcentajes(tr);

          const inputP1 = tr.querySelector(".p1abs");
          const inputP2 = tr.querySelector(".p2abs");

          const onChangeNumbers = () => {
            actualizarPorcentajes(tr);
            saveRow(tr);
          };

          inputP1.addEventListener("change", onChangeNumbers);
          inputP2.addEventListener("change", onChangeNumbers);
        });
      })
      .catch(err => {
        console.error("Error load:", err);
        tbody.innerHTML = `<tr><td colspan="11">Error al cargar datos.</td></tr>`;
      });
  }

  // ========= Inicio: detectar usuario / asesoría =========
  async function start() {
    const sess = getSession();
    if (!sess || !sess.username) {
      alert("Tu sesión ha caducado. Vuelve a iniciar sesión.");
      location.href = "index.html";
      return;
    }

    const username = (sess.username || "").toLowerCase();
    CURRENT_NOMBRE = sess.nombre || sess.username || "";

    try {
      const resp = await fetch("php/progreso_crud.php?action=list_asesorias");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const lista = await resp.json();

      if (!Array.isArray(lista) || !lista.length) {
        alert("No hay asesorías configuradas. Contacta al administrador.");
        return;
      }

      const propio = lista.find(u =>
        (u.usuario || "").toLowerCase() === username
      );

      if (!propio) {
        alert("Tu usuario no tiene una asesoría asociada. Contacta al administrador.");
        return;
      }

      CURRENT_USER_ID   = String(propio.id_usuarios);
      CURRENT_ASESORIA  = propio.asesoria_usuarios || "";
      CURRENT_NOMBRE    = propio.nombre || CURRENT_NOMBRE;

      // Nombre (arriba, más pequeño) y asesoría (abajo, más grande)
      if (spanPersona)  spanPersona.textContent  = CURRENT_NOMBRE   || "—";
      if (spanAsesoria) spanAsesoria.textContent = CURRENT_ASESORIA || "—";

      const anioId = await resolveYearId();
      cargarTabla(CURRENT_USER_ID, anioId);
    } catch (e) {
      console.error(e);
      alert("Error al cargar la asesoría de tu usuario.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // ========= Imprimir / PDF =========
  btnPrint?.addEventListener("click", () => {
    window.print();
  });

})();
