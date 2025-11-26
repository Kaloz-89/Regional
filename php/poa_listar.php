<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

// aquí anio = id_anio (FK)
$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Parámetro anio inválido']);
    exit;
}

$sql = "SELECT
          id_poa AS id,
          poacol_1 AS area,
          poacol_2 AS objetivo,
          poacol_3 AS meta,
          poacol_4 AS indicador
        FROM poa
        WHERE anio = ?
        ORDER BY id_poa ASC";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(['ok' => false, 'error' => 'Error prepare: '.$conexion->error]);
    exit;
}
$stmt->bind_param('i', $anioId);
$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = [
        'id'        => (int)$row['id'],
        'area'      => $row['area'],
        'objetivo'  => $row['objetivo'],
        'meta'      => is_null($row['meta']) ? null : (int)$row['meta'],
        'indicador' => $row['indicador'],
    ];
}
$stmt->close();

echo json_encode([
    'ok'   => true,
    'rows' => $rows
]);
