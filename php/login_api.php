<?php
// php/login_api.php
header('Content-Type: application/json; charset=utf-8');

session_start();

require_once __DIR__ . '/conexion_bd.php';
require_once __DIR__ . '/config_superadmin.php';

function json_response($ok, $extra = [])
{
    echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$username = isset($data['username']) ? trim($data['username']) : '';
$password = isset($data['password']) ? (string)$data['password'] : '';
$mode     = isset($data['mode']) ? $data['mode'] : 'normal'; // normal | admin

if ($username === '' || $password === '') {
    json_response(false, ['error' => 'Credenciales inválidas.']);
}

function check_password($plain, $stored)
{
    if ($stored === '' || $stored === null) {
        return false;
    }
    if (preg_match('/^\$2y\$\d{2}\$/', $stored)) {
        return password_verify($plain, $stored);
    }
    return hash_equals((string)$stored, (string)$plain);
}

// ---------- SÚPER ADMIN (solo en modo admin) ----------
if ($mode === 'admin'
    && strcasecmp($username, SUPERADMIN_USER) === 0
    && SUPERADMIN_HASH !== ''
    && password_verify($password, SUPERADMIN_HASH)) {

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id'      => 0,
        'usuario' => SUPERADMIN_USER,
        'nombre'  => SUPERADMIN_USER,
        'role'    => 'superadmin',
        'ts'      => time()
    ];

    json_response(true, [
        'user' => [
            'id'      => 0,
            'usuario' => SUPERADMIN_USER,
            'nombre'  => SUPERADMIN_USER,
            'role'    => 'superadmin'
        ]
    ]);
}

// ---------- USUARIOS NORMALES / ADMIN DB ----------
if ($mode === 'normal') {
    $sql = "SELECT id_usuarios, nombre, usuario, contrasena_estandar
            FROM usuarios
            WHERE usuario = ?
            LIMIT 1";
    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        json_response(false, ['error' => 'Error interno.']);
    }
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();

    if (!$row || !check_password($password, $row['contrasena_estandar'])) {
        json_response(false, ['error' => 'Credenciales inválidas.']);
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id'      => (int)$row['id_usuarios'],
        'usuario' => $row['usuario'],
        'nombre'  => $row['nombre'],
        'role'    => 'user',
        'ts'      => time()
    ];

    json_response(true, [
        'user' => [
            'id'      => (int)$row['id_usuarios'],
            'usuario' => $row['usuario'],
            'nombre'  => $row['nombre'],
            'role'    => 'user'
        ]
    ]);
}

if ($mode === 'admin') {
    $sql = "SELECT id_usuarios, nombre, usuario, usuario_admin, contrasena_admin
            FROM usuarios
            WHERE usuario = ? OR usuario_admin = ?
            LIMIT 1";
    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        json_response(false, ['error' => 'Error interno.']);
    }
    $stmt->bind_param('ss', $username, $username);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();

    if (
        !$row ||
        $row['contrasena_admin'] === null ||
        $row['contrasena_admin'] === '' ||
        strtolower(trim($row['contrasena_admin'])) === 'notiene' ||
        !check_password($password, $row['contrasena_admin'])
    ) {
        json_response(false, ['error' => 'Credenciales inválidas.']);
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'id'      => (int)$row['id_usuarios'],
        'usuario' => $row['usuario'],
        'nombre'  => $row['nombre'],
        'role'    => 'admin',
        'ts'      => time()
    ];

    json_response(true, [
        'user' => [
            'id'      => (int)$row['id_usuarios'],
            'usuario' => $row['usuario'],
            'nombre'  => $row['nombre'],
            'role'    => 'admin'
        ]
    ]);
}

json_response(false, ['error' => 'Modo no permitido.']);
