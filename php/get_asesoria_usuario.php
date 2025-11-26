<?php
// php/get_asesoria_usuario.php
header('Content-Type: application/json; charset=utf-8');
require 'conexion_bd.php';

// Leemos el JSON enviado por fetch()
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

$username = isset($data['username']) ? trim($data['username']) : '';

if ($username === '') {
    http_response_code(400);
    echo json_encode([
        'ok'    => false,
        'error' => 'Usuario vacío.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Buscamos al usuario por su campo "usuario"
$stmt = $conexion->prepare(
    "SELECT id_usuarios, nombre, asesoria_usuarios 
     FROM usuarios 
     WHERE usuario = ? 
     LIMIT 1"
);
$stmt->bind_param('s', $username);
$stmt->execute();
$res = $stmt->get_result();

if (!$res || $res->num_rows === 0) {
    echo json_encode([
        'ok'    => false,
        'error' => 'Usuario no encontrado.'
    ], JSON_UNESCAPED_UNICODE);
    $stmt->close();
    $conexion->close();
    exit;
}

$row = $res->fetch_assoc();
$stmt->close();
$conexion->close();

// Verificamos que tenga una asesoría asociada
$asesoria = trim((string)$row['asesoria_usuarios']);

if ($asesoria === '') {
    echo json_encode([
        'ok'    => false,
        'error' => 'Usuario sin asesoría asociada.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Todo bien: devolvemos los datos necesarios
echo json_encode([
    'ok'   => true,
    'user' => [
        'id_usuarios'       => (int)$row['id_usuarios'],
        'nombre'            => $row['nombre'],
        'asesoria_usuarios' => $asesoria
    ]
], JSON_UNESCAPED_UNICODE);
exit;
