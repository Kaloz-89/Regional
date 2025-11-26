<?php
// NADA de HTML ni espacios antes de <?php

$host = "localhost";
$user = "root";
$pass = "kz89";
$db   = "bd_regional";

$conexion = mysqli_connect($host, $user, $pass, $db);

if (!$conexion) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        "ok"  => false,
        "msg" => "Error de conexión: " . mysqli_connect_error()
    ]);
    exit;
}

