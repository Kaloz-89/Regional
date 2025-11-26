// Bloque anti-forward (igual que en otras vistas)
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

// ====== Tabla pública de usuarios (solo nombre/asesoría/correo) desde BD ======
(function () {
  const tabla = document.getElementById("tablaAdminPublic");
  if (!tabla) return;

  const tbody = tabla.querySelector("tbody");
  const msg   = document.getElementById("msgPublic"); // opcional (si no existe, no pasa nada)

  function setMsg(texto, esError = false) {
    if (!msg) return;
    msg.textContent = texto || "";
    msg.style.color = esError ? "#f97373" : "";

    if (!texto) return;
    clearTimeout(setMsg._t);
    setMsg._t = setTimeout(() => {
      msg.textContent = "";
      msg.style.color = "";
    }, 2000);
  }

  function isEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
  }

  function renderUsuariosPublic(lista) {
    tbody.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4; // N°, Asesoría, Nombre, Correo
      td.textContent = "No hay usuarios registrados.";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    lista.forEach((u, i) => {
      const tr = document.createElement("tr");

      // N°
      const tdNum = document.createElement("td");
      tdNum.textContent = String(i + 1);
      tr.appendChild(tdNum);

      // Asesoría / Equipo
      const tdAs = document.createElement("td");
      tdAs.textContent = u.asesoria_usuarios || "";
      tr.appendChild(tdAs);

      // Nombre de la persona
      const tdNom = document.createElement("td");
      tdNom.textContent = u.nombre || "";
      tr.appendChild(tdNom);

      // Correo (solo si es válido → mailto)
      const tdCor = document.createElement("td");
      const correo = (u.correo || "").trim();
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

  async function cargarUsuariosPublic() {
    try {
      setMsg("Cargando usuarios...");
      const res = await fetch("php/obtener_usuarios.php");
      if (!res.ok) throw new Error("HTTP " + res.status);

      const datos = await res.json();
      // datos debe ser el array de usuarios que ya usas en la vista admin
      renderUsuariosPublic(datos);
      setMsg("");
    } catch (err) {
      console.error(err);
      setMsg("Error al cargar usuarios.", true);
    }
  }

  // Carga automática al abrir la página
  cargarUsuariosPublic();
})();
