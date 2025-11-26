<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once 'conexion_bd.php';

function responder($ok, $extra = []) {
    echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
if ($anioId <= 0) {
    responder(false, ['error' => 'Parámetro anio inválido']);
}

/*
   Se suman progresos agrupados por PRAP y año
   Las columnas coinciden con tu BD:
   progreso.progresocol_1 → cantidad total
   progreso.progresocol_2 → I periodo (abs)
   progreso.progresocol_3 → II periodo (abs)
*/
$sql = "
    SELECT
        p.id_prap,
        p.prapcol_1 AS obj,
        p.prapcol_2 AS ind,
        p.prapcol_3 AS cant,
        p.prapcol_4 AS acts,
        p.prapcol_5 AS periodo,
        p.prapcol_6 AS resp,
        COALESCE(SUM(pg.progresocol_2), 0) AS iAbs,
        COALESCE(SUM(pg.progresocol_3), 0) AS iiAbs
    FROM prap p
    LEFT JOIN progreso pg
      ON pg.prap = p.id_prap
     AND pg.anio = ?
     AND pg.marcador = 1
    WHERE p.anio = ?
    GROUP BY
        p.id_prap,
        p.prapcol_1,
        p.prapcol_2,
        p.prapcol_3,
        p.prapcol_4,
        p.prapcol_5,
        p.prapcol_6
    ORDER BY p.id_prap
";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    responder(false, ['error' => 'Error prepare: ' . $conexion->error]);
}

$stmt->bind_param('ii', $anioId, $anioId);
$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
}
$stmt->close();

responder(true, ['rows' => $rows]);
