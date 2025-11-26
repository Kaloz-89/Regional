// ===== Helper para POST JSON =====
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ===== Claves de sesión =====
const SESSION_KEY     = "session_user";
const LAST_LOGOUT_KEY = "last_logout";

const $ = (s, c = document) => c.querySelector(s);

function saveSession(obj) {
  // Guardamos TODO lo que necesitamos:
  // id_usuarios, asesoria_usuarios, usuario, nombre, role
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(obj));
}

// ===== Bloque básico “atrás” en login =====
(function antiBackOnLogin() {
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    }
  });
  try {
    history.replaceState({ login: true }, "", location.href);
    history.pushState({ blocker: true }, "", location.href);
    window.addEventListener("popstate", function () {
      history.pushState({ blocker: true }, "", location.href);
    });
  } catch {}
})();

// ===================================================
// ================ LOGIN MODO NORMAL ================
// ===================================================
const btnLogin  = $("#btnLogin");
const userInput = $("#userInput");
const passInput = $("#passInput");

btnLogin?.addEventListener("click", async () => {
  const username = (userInput.value || "").trim();
  const password = passInput.value || "";
  if (!username || !password) {
    alert("Ingresa tu usuario y contraseña.");
    return;
  }

  btnLogin.disabled = true;
  btnLogin.textContent = "Verificando...";

  try {
    const resp = await postJSON("php/login_api.php", {
      mode: "normal",
      username,
      password
    });

    if (!resp.ok) {
      alert(resp.error || "Usuario o contraseña incorrectos.");
    } else {
      // resp.user DEBE TRAER:
      // id_usuarios, nombre, asesoria_usuarios, usuario, role
      const u = resp.user || {};

      saveSession({
        id_usuarios:       u.id_usuarios,        // <-- ID del usuario
        asesoria_usuarios: u.asesoria_usuarios,  // <-- Asesoría asociada
        username:          u.usuario,
        nombre:            u.nombre,
        role:              u.role || "user",
        ts:                Date.now()
      });

      try { localStorage.removeItem(LAST_LOGOUT_KEY); } catch {}
      location.href = "pagina_principal_regional.html";
    }
  } catch (e) {
    console.error(e);
    alert("Error de conexión. Intenta más tarde.");
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Acceso";
  }
});

// Enter en usuario/contraseña
[userInput, passInput].forEach(el => {
  el?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btnLogin.disabled) {
      e.preventDefault();
      btnLogin.click();
    }
  });
});

// ===================================================
// ================== MODAL ADMIN =====================
// ===================================================
const adminModal     = $("#adminModal");
const btnAdminOpen   = $("#btnAdminOpen");
const btnAdminCancel = $("#btnAdminCancel");
const btnAdminLogin  = $("#btnAdminLogin");
const adminUser      = $("#adminUser");
const adminPass      = $("#adminPass");
const adminMsg       = $("#adminMsg");

function openModal() {
  adminMsg.textContent = "";
  adminUser.value = "";
  adminPass.value = "";
  adminModal.style.display = "flex";
  document.body.classList.add("modal-open");
  setTimeout(() => adminUser.focus(), 40);
}

function closeModal() {
  adminModal.style.display = "none";
  document.body.classList.remove("modal-open");
}

btnAdminOpen?.addEventListener("click", openModal);
btnAdminCancel?.addEventListener("click", closeModal);

adminModal?.addEventListener("click", (e) => {
  if (e.target === adminModal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && adminModal?.style.display === "flex") {
    closeModal();
  }
});

btnAdminLogin?.addEventListener("click", async () => {
  const username = (adminUser.value || "").trim();
  const password = adminPass.value || "";

  if (!username || !password) {
    adminMsg.textContent = "Completa usuario y contraseña.";
    return;
  }

  btnAdminLogin.disabled = true;
  btnAdminLogin.textContent = "Verificando...";
  adminMsg.textContent = "";

  try {
    const resp = await postJSON("php/login_api.php", {
      mode: "admin",
      username,
      password
    });

    if (!resp.ok) {
      adminMsg.textContent = resp.error || "No autorizado.";
    } else {
      const u = resp.user || {};

      // También guardamos id_usuarios por si el admin
      // usa vistas que lo necesiten (plan asesorías, control visitas, etc.)
      saveSession({
        id_usuarios:       u.id_usuarios ?? null,
        asesoria_usuarios: u.asesoria_usuarios ?? null,
        username:          u.usuario,
        nombre:            u.nombre,
        role:              u.role || "admin",
        ts:                Date.now()
      });

      try { localStorage.removeItem(LAST_LOGOUT_KEY); } catch {}
      location.href = "pagina_principal_regional_administradores.html";
    }
  } catch (e) {
    console.error(e);
    adminMsg.textContent = "Error de conexión.";
  } finally {
    btnAdminLogin.disabled = false;
    btnAdminLogin.textContent = "Acceder";
  }
});

// Enter en usuario/contraseña admin
[adminUser, adminPass].forEach(el => {
  el?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btnAdminLogin.disabled) {
      e.preventDefault();
      btnAdminLogin.click();
    }
  });
});

// ===== Botón ojo (mostrar/ocultar contraseña) =====
(function () {
  function initToggle(btn) {
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    const targetId = btn.getAttribute("data-target");
    const input = document.getElementById(targetId);
    if (!input) return;
    input.type = "password";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.setAttribute("aria-pressed", visible ? "false" : "true");
    });
  }
  function attachAll() {
    document.querySelectorAll('[data-toggle="password"]').forEach(initToggle);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachAll);
  } else {
    attachAll();
  }
})();
