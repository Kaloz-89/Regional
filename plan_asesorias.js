// plan_asesorias.js — ADMIN
(function () {
  "use strict";

  const YEAR_KEY = "app_year_v1";
  const ENC_KEY  = "plan_asesorias_encargado_v1"; // recordar asesoría seleccionada

  let CURRENT_ENCARGADO = null;
  let YEAR_ID = null;     // id_anio real (FK)
  const ASESORIAS = {};   // id_usuarios -> { id_usuarios, asesoria_usuarios, nombre, correo }

  // ---------- Año lógico (2025, 2026...) ----------
  function getLogicalYear() {
    const params = new URLSearchParams(location.search);
    const yUrl = parseInt(params.get("year") || "", 10);
    if (Number.isFinite(yUrl)) {
      localStorage.setItem(YEAR_KEY, String(yUrl));
      return yUrl;
    }
    const yLs = parseInt(localStorage.getItem(YEAR_KEY) || "", 10);
    if (Number.isFinite(yLs)) return yLs;
    return new Date().getFullYear();
  }

  const ANIO_LOGICO = getLogicalYear();

  // ---------- Resolver YEAR_ID desde php/anio_listar.php ----------
  async function resolveYearId() {
    if (YEAR_ID !== null) return YEAR_ID;

    try {
      const resp = await fetch("php/anio_listar.php");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();

      if (!data.ok || !Array.isArray(data.anios)) {
        throw new Error("Formato inválido de anio_listar.php");
      }

      const found = data.anios.find(
        (a) => parseInt(a.anio, 10) === ANIO_LOGICO
      );

      if (!found) {
        console.warn("Año lógico", ANIO_LOGICO, "no está en tabla anio, uso primer id");
        YEAR_ID = data.anios.length ? parseInt(data.anios[0].id, 10) : 1;
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

  // dispara la resolución en segundo plano
  resolveYearId();

  const selectAsesoria = document.getElementById("selectAsesoria");
  const tablaBody      = document.querySelector("#tablaAvances tbody");
  const infoSeleccion  = document.getElementById("infoSeleccion");

  // ---------- utilidades de porcentajes ----------
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

  // ---------- mostrar “Asesor: X — Asesoría: Y” ----------
  function actualizarInfoSeleccion() {
    if (!infoSeleccion) return;
    const id = selectAsesoria.value;
    const u  = ASESORIAS[id];
    if (!id || !u) {
      infoSeleccion.textContent = "";
      return;
    }
    const nom = u.nombre || "";
    const as  = u.asesoria_usuarios || "";
    infoSeleccion.textContent = `${nom || "(sin nombre)"} — ${as || "(sin asesoría)"}`;
  }

  // ---------- guardar una fila inmediatamente ----------
  async function saveRow(tr) {
    const idUsuario = CURRENT_ENCARGADO;
    if (!idUsuario) return;

    const check = tr.querySelector(".checkPublicar");
    if (!check) return;

    const checked = check.checked;
    const had     = tr.dataset.hadProgreso === "1";

    const yearId = await resolveYearId();
    if (!yearId) return;

    const base = {
      id_prap:   tr.dataset.id_prap,
      anio:      yearId,    // id_anio real
      encargado: idUsuario
    };

    if (checked) {
      const cantidad = tr.querySelector(".cantidad").value || 0;
      const p1abs    = tr.querySelector(".p1abs").value    || 0;
      const p2abs    = tr.querySelector(".p2abs").value    || 0;

      const payload = [{
        ...base,
        cantidad,
        p1abs,
        p2abs
      }];

      try {
        const resp = await fetch("php/progreso_crud.php?action=save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          console.error("Error HTTP al guardar fila:", resp.status);
        } else {
          tr.dataset.hadProgreso = "1";
        }
      } catch (err) {
        console.error("Error fetch saveRow:", err);
      }
    } else if (!checked && had) {
      const payload = [base];
      try {
        const resp = await fetch("php/progreso_crud.php?action=delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!resp.ok) {
          console.error("Error HTTP al eliminar fila:", resp.status);
        } else {
          tr.dataset.hadProgreso = "0";
        }
      } catch (err) {
        console.error("Error fetch deleteRow:", err);
      }
    }
  }

  // ---------- cargar asesorías ----------
  fetch("php/progreso_crud.php?action=list_asesorias")
    .then(res => res.json())
    .then(data => {
      data.forEach(u => {
        ASESORIAS[String(u.id_usuarios)] = u;
        const opt = document.createElement("option");
        opt.value = u.id_usuarios;
        opt.textContent = u.asesoria_usuarios;
        selectAsesoria.appendChild(opt);
      });

      let initialEnc = null;
      const savedEnc = localStorage.getItem(ENC_KEY);

      if (savedEnc && selectAsesoria.querySelector(`option[value="${savedEnc}"]`)) {
        initialEnc = savedEnc;
        selectAsesoria.value = savedEnc;
      } else if (data.length) {
        initialEnc = String(data[0].id_usuarios);
        selectAsesoria.value = initialEnc;
      }

      CURRENT_ENCARGADO = initialEnc;
      actualizarInfoSeleccion();

      if (CURRENT_ENCARGADO) {
        resolveYearId().then((anioId) => {
          cargarTabla(CURRENT_ENCARGADO, anioId);
        });
      }
    })
    .catch(err => console.error("Error list_asesorias:", err));

  // cambio de asesoría → guardar selección y recargar página
  selectAsesoria.addEventListener("change", () => {
    const idUsuarioNuevo = selectAsesoria.value;
    actualizarInfoSeleccion();

    if (!idUsuarioNuevo) {
      tablaBody.innerHTML = "";
      return;
    }

    localStorage.setItem(ENC_KEY, idUsuarioNuevo);
    location.reload();
  });

  // ---------- cargar PRAP + progreso ----------
  function cargarTabla(idUsuario, anioId) {
    tablaBody.innerHTML = `<tr><td colspan="12">Cargando datos...</td></tr>`;

    fetch(`php/progreso_crud.php?action=load&anio=${anioId}&encargado=${idUsuario}`)
      .then(res => res.json())
      .then(data => {
        tablaBody.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
          tablaBody.innerHTML = `<tr><td colspan="12">No hay objetivos PRAP para este año.</td></tr>`;
          return;
        }

        data.forEach(row => {
          const tr = document.createElement("tr");
          tr.dataset.id_prap     = row.id_prap;
          tr.dataset.hadProgreso = row.marcado ? "1" : "0";

          const cantidad = Number(row.cantidad) || 0;
          const p1abs    = Number(row.p1abs)    || 0;
          const p2abs    = Number(row.p2abs)    || 0;

          tr.innerHTML = `
            <td>${row.objetivo || ""}</td>
            <td>${row.indicador || ""}</td>
            <td data-col="cant">
              <input type="number" class="cantidad" value="${cantidad}">
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
            <td class="pub">
              <input type="checkbox" class="checkPublicar" ${row.marcado ? "checked" : ""}>
            </td>
          `;

          tablaBody.appendChild(tr);

          actualizarPorcentajes(tr);

          const inputCant = tr.querySelector(".cantidad");
          const inputP1   = tr.querySelector(".p1abs");
          const inputP2   = tr.querySelector(".p2abs");
          const chk       = tr.querySelector(".checkPublicar");

          const onChangeNumbers = () => {
            actualizarPorcentajes(tr);
            if (chk.checked) {
              saveRow(tr);
            }
          };

          inputCant.addEventListener("change", onChangeNumbers);
          inputP1.addEventListener("change", onChangeNumbers);
          inputP2.addEventListener("change", onChangeNumbers);

          chk.addEventListener("change", () => {
            saveRow(tr);
          });
        });
      })
      .catch(err => {
        console.error("Error load:", err);
        tablaBody.innerHTML = `<tr><td colspan="12">Error al cargar datos.</td></tr>`;
      });
  }

  // ---------- backup: guardar todo al cerrar / refrescar ----------
  window.addEventListener("beforeunload", () => {
    const idUsuario = CURRENT_ENCARGADO;
    if (!idUsuario || YEAR_ID === null) return;

    const filas = tablaBody.querySelectorAll("tr");
    const toSave   = [];
    const toDelete = [];

    filas.forEach(tr => {
      const check = tr.querySelector(".checkPublicar");
      if (!check) return;

      const checked = check.checked;
      const had     = tr.dataset.hadProgreso === "1";

      const base = {
        id_prap:   tr.dataset.id_prap,
        anio:      YEAR_ID,
        encargado: idUsuario
      };

      if (checked) {
        const cantidad = tr.querySelector(".cantidad").value || 0;
        const p1abs    = tr.querySelector(".p1abs").value    || 0;
        const p2abs    = tr.querySelector(".p2abs").value    || 0;

        toSave.push({
          ...base,
          cantidad,
          p1abs,
          p2abs
        });
      } else if (!checked && had) {
        toDelete.push(base);
      }
    });

    if (toSave.length > 0) {
      navigator.sendBeacon(
        "php/progreso_crud.php?action=save",
        new Blob([JSON.stringify(toSave)], { type: "application/json" })
      );
    }

    if (toDelete.length > 0) {
      navigator.sendBeacon(
        "php/progreso_crud.php?action=delete",
        new Blob([JSON.stringify(toDelete)], { type: "application/json" })
      );
    }
  });

  // ---------- Imprimir ----------
  document.getElementById("btnPrint")?.addEventListener("click", () => {
    window.print();
  });

})();
