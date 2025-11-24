// Bloque anti-forward (si lo usabas)
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

// ====== Tabla de usuarios desde BD ======
(function () {
  const tabla = document.getElementById("tablaAdmin");
  if (!tabla) return;

  const tbody = tabla.querySelector("tbody");
  const msg   = document.getElementById("msg");

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

  function renderUsuarios(lista) {
    tbody.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8;
      td.textContent = "No hay usuarios registrados.";
      td.style.textAlign = "center";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    lista.forEach((u, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${u.asesoria_usuarios || ""}</td>
        <td>${u.nombre || ""}</td>
        <td>${u.correo || ""}</td>
        <td>${u.usuario || ""}</td>
        <td>${u.contrasena_estandar || ""}</td>
        <td>${u.contrasena_admin || ""}</td>
        <td style="text-align:center">
          <button type="button" class="btn-trash" title="Eliminar usuario" data-id="${u.id_usuarios}">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function cargarUsuarios() {
    try {
      setMsg("Cargando usuarios...");
      const res = await fetch("php/obtener_usuarios.php");
      if (!res.ok) throw new Error("HTTP " + res.status);

      const datos = await res.json();
      renderUsuarios(datos);
      setMsg("");
    } catch (err) {
      console.error(err);
      setMsg("Error al cargar usuarios.", true);
    }
  }

  // Delegamos el click en el tbody para los botones de eliminar
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-trash");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    const confirmar = confirm("¿Desea eliminar este usuario?");
    if (!confirmar) return;

    try {
      const formData = new FormData();
      formData.append("id", id);

      const res = await fetch("php/eliminar_usuario.php", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        setMsg("Usuario eliminado.");
        // Recargar la lista desde la BD
        cargarUsuarios();
      } else {
        setMsg(data.msg || "No se pudo eliminar el usuario.", true);
      }
    } catch (err) {
      console.error(err);
      setMsg("Error al eliminar el usuario.", true);
    }
  });

  // Se ejecuta automáticamente al abrir la página
  cargarUsuarios();
})();
