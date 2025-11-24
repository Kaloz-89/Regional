<?php
header('Content-Type: application/json; charset=utf-8');

include "conexion_bd.php";

// Opcional pero recomendado
if (function_exists('mysqli_set_charset')) {
    mysqli_set_charset($conexion, "utf8mb4");
}

$sql = "SELECT 
            id_usuarios,
            nombre,
            asesoria_usuarios,
            correo,
            usuario,
            contrasena_estandar,
            contrasena_admin
        FROM usuarios
        ORDER BY id_usuarios ASC";

$result = mysqli_query($conexion, $sql);

$usuarios = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $usuarios[] = $row;
    }
}

mysqli_close($conexion);

// Devolvemos el arreglo como JSON
echo json_encode($usuarios);
