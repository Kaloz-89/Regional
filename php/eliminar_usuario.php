<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'Método no permitido']);
    exit;
}

include "conexion_bd.php";

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;

if ($id <= 0) {
    echo json_encode(['ok' => false, 'msg' => 'ID inválido']);
    mysqli_close($conexion);
    exit;
}

$sql = "DELETE FROM usuarios WHERE id_usuarios = $id";
$run = mysqli_query($conexion, $sql);

if ($run && mysqli_affected_rows($conexion) > 0) {
    echo json_encode(['ok' => true]);
} else {
    echo json_encode(['ok' => false, 'msg' => 'No se encontró el usuario o no se pudo eliminar']);
}

mysqli_close($conexion);
