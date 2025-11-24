<?php
include "conexion_bd.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $username          = $_POST["nombreCompleto"]   ?? '';
    $user              = $_POST["usuario"]          ?? '';
    $asesoria          = $_POST["asesoria"]         ?? '';
    $useremail         = $_POST["correo"]           ?? '';
    $userpassword      = $_POST["contrasena"]       ?? '';
    $adminuserpassword = $_POST["contrasenaAdmin"]  ?? '';

    $query = "INSERT INTO usuarios
                (nombre, asesoria_usuarios, correo, usuario, contrasena_estandar, contrasena_admin)
              VALUES
                ('$username','$asesoria','$useremail','$user','$userpassword','$adminuserpassword')";

    $run = mysqli_query($conexion, $query);

    mysqli_close($conexion);

    if ($run) {
        // Éxito: volvemos al formulario
        header("Location: ../registro_usuarios.php?ok=1");
        exit;
    } else {
        // Error: volvemos al formulario con flag de error
        header("Location: ../registro_usuarios.php?error=1");
        exit;
    }

} else {
    // Si entran directo a este PHP sin POST, mando al formulario
    header("Location: ../registro_usuarios.php");
    exit;
}
?>
