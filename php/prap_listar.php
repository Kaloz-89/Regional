<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
$poaId  = isset($_GET['poa'])  ? (int)$_GET['poa']  : 0;

if ($anioId <= 0 || $poaId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Parámetros anio o poa inválidos']);
    exit;
}

$sql = "SELECT
          id_prap,
          prapcol_1,
          prapcol_2,
          prapcol_3,
          prapcol_4,
          prapcol_5,
          prapcol_6
        FROM prap
        WHERE anio = ? AND poa = ?
        ORDER BY id_prap ASC";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(['ok' => false, 'error' => 'Error prepare: '.$conexion->error]);
    exit;
}

$stmt->bind_param('ii', $anioId, $poaId);
$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = [
        'id'      => (int)$row['id_prap'],
        'obj'     => $row['prapcol_1'] ?? '',
        'ind'     => $row['prapcol_2'] ?? '',
        'cant'    => is_null($row['prapcol_3']) ? null : (int)$row['prapcol_3'],
        'acts'    => $row['prapcol_4'] ?? '',
        'periodo' => $row['prapcol_5'] ?? '',
        'resp'    => $row['prapcol_6'] ?? '',
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'rows' => $rows]);
