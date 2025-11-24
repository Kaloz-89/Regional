<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Crear usuario administrativo</title>

  <!-- Boot del tema (oscuro / claro) -->
  <script src="theme-boot.js"></script>

  <!-- Estilos -->
  <link rel="stylesheet" href="registro_usuarios.css">
  <link rel="stylesheet" href="registro_usuarios_light.css">

  <link rel="icon" href="badge-55534E.png" type="image/png">
</head>

<header>
  <div class="logo_direca">
    <img src="logo_direca.png" alt="DIRECA">
  </div>

  <nav>
    <ul class="nav-links">
      <li class="nav-volver">
        <!-- Volver a la tabla de datos administrativos -->
        <a href="datos_administrativos.html">← Volver a Datos Administrativos</a>
      </li>
    </ul>
  </nav>

  <div class="logo">
    <img src="logo_mep_sinfondo.png" alt="MEP">
  </div>
</header>

<body class="admin-user-form-page">
  <main class="sheet-wrap">
    <section class="sheet">
      <h1 class="sheet-title">CREAR USUARIO ADMINISTRATIVO</h1>
      <p class="sheet-subtitle">
        Complete los campos para registrar un nuevo usuario en el sistema.
      </p>

      <form action="php/usuarios.php"  method="post" id="formCrearUsuario" class="form-usuarios" autocomplete="off">
        <!-- Fila 1 -->
        <div class="field-row">
          <div class="field">
            <label for="asesoria">Nombre de asesoría o equipo</label>
            <input type="text" id="asesoria" name="asesoria" required>
          </div>

          <div class="field">
            <label for="nombreCompleto">Nombre completo</label>
            <input type="text" id="nombreCompleto" name="nombreCompleto" required>
          </div>
        </div>

        <!-- Fila 2 -->
        <div class="field-row">
          <div class="field">
            <label for="correo">Correo electrónico</label>
            <input type="email" id="correo" name="correo" required>
          </div>

          <div class="field">
            <label for="usuario">Usuario</label>
            <input type="text" id="usuario" name="usuario" required>
          </div>
        </div>

        <!-- Fila 3 -->
        <div class="field-row">
          <div class="field">
            <label for="contrasena">Contraseña</label>
            <input type="password" id="contrasena" name="contrasena" required>
          </div>

          <div class="field">
            <label for="contrasenaAdmin">Contraseña Administrador</label>
            <input type="password" id="contrasenaAdmin" name="contrasenaAdmin">
          </div>
        </div>
        <!-- Acciones -->
        <div class="acciones-form">
          <button type="submit" class="btn-primary">Guardar usuario</button>
          <a href="datos_administrativos.html" class="btn-secondary btn-ghost">
            Cancelar
          </a>
          <span id="msgForm" class="muted"></span>
        </div>
      </form>
    </section>
  </main>

  <!-- Scripts globales -->
  <script src="header.js" defer></script>
  <script src="theme-toggle.js" defer></script>
  <!-- JS específico de esta página (para que luego conectes con backend) -->
  <script src="usuarios_admin.js" defer></script>
</body>
</html>
