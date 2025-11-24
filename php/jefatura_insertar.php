<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php'; // crea $conexion (mysqli)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Solo se permite POST']);
    exit;
}

// Lee JSON del body
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
    exit;
}

// Año humano (2025, 2026, ...)
$year = isset($data['year']) ? (int)$data['year'] : 0;
if ($year <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Año inválido']);
    exit;
}

// Buscar id del año en tabla anio
$stmt = $conexion->prepare("SELECT id_anio FROM anio WHERE anio = ? LIMIT 1");
if (!$stmt) {
    echo json_encode(['ok' => false, 'error' => 'Error prepare anio: '.$conexion->error]);
    exit;
}
$stmt->bind_param('i', $year);
$stmt->execute();
$stmt->bind_result($id_anio);
if (!$stmt->fetch()) {
    $stmt->close();
    echo json_encode(['ok' => false, 'error' => 'Año no encontrado en tabla anio']);
    exit;
}
$stmt->close();

// Campos que vienen del formulario
$asesoria     = trim($data['asesoria']     ?? '');
$circuito     = trim($data['circuito']     ?? '');
$institucion  = trim($data['institucion']  ?? '');
$mes          = trim($data['mes']          ?? '');
$fecha        = trim($data['fecha']        ?? '');   // "yyyy-mm-dd"
$tipoVisita   = trim($data['tipoVisita']   ?? '');
$cicloEscolar = trim($data['cicloEscolar'] ?? '');
$tematica     = trim($data['tematica']     ?? '');
$observacion  = trim($data['observacion']  ?? '');

// Validaciones mínimas
if (
    $asesoria === '' || $circuito === '' || $institucion === '' ||
    $mes === '' || $fecha === '' || $tipoVisita === '' || $cicloEscolar === ''
) {
    echo json_encode(['ok' => false, 'error' => 'Faltan campos obligatorios']);
    exit;
}

// Flags por defecto (0 = Pendiente / Sin revisar)
$validFlag  = 0;
$estadoFlag = 0;

// Prioridad fija por ahora
$prioridad = 'No Aplica';

// Insert usando tus columnas
$sql = "INSERT INTO jefatura (
          anio,
          jefaturacol_1, jefaturacol_2, jefaturacol_3, jefaturacol_4,
          jefaturacol_5, jefaturacol_6, jefaturacol_7, jefaturacol_8,
          jefaturacol_9, jefaturacol_10, jefaturacol_11, jefaturacol_12
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(['ok' => false, 'error' => 'Error prepare: '.$conexion->error]);
    exit;
}

$stmt->bind_param(
    'issssssssssii',
    $id_anio,       // i
    $asesoria,      // s
    $circuito,      // s
    $institucion,   // s
    $mes,           // s
    $fecha,         // s
    $tipoVisita,    // s
    $cicloEscolar,  // s
    $tematica,      // s
    $prioridad,     // s
    $observacion,   // s
    $validFlag,     // i
    $estadoFlag     // i
);

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    echo json_encode(['ok' => false, 'error' => 'Error al insertar: '.$err]);
    exit;
}

$newId = $stmt->insert_id;
$stmt->close();

echo json_encode([
    'ok'  => true,
    'id'  => $newId,
    'msg' => 'Registro creado correctamente'
]);
