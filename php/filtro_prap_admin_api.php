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

$anioId = isset($_GET['anio']) ? intval($_GET['anio']) : 0;
if ($anioId <= 0) {
    responder(false, ['error' => 'Parámetro anio inválido']);
}

/*
   Ajusta los nombres de columnas de acuerdo a tu BD si hace falta:
   - prap.poa           → FK al POA
   - poa.id_poa         → id del POA (lo usamos como dir_id para el link)
   - poa.poacol_1       → texto de la Dirección que quieres mostrar
   - prap.prapcol_1..6  → columnas de PRAP (objetivo, indicador, cantidad, actividades, periodo, responsables)
*/
$sql = "
    SELECT
        poa.id_poa            AS dir_id,
        poa.poacol_1          AS dir_nombre,
        p.id_prap             AS id_prap,
        p.prapcol_1           AS obj,
        p.prapcol_2           AS ind,
        p.prapcol_3           AS cant,
        p.prapcol_4           AS acts,
        p.prapcol_5           AS periodo,
        p.prapcol_6           AS resp
    FROM prap p
    INNER JOIN poa poa ON p.poa = poa.id_poa
    WHERE p.anio = ?
    ORDER BY poa.poacol_1, p.id_prap
";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    responder(false, ['error' => 'Error prepare: ' . $conexion->error]);
}

$stmt->bind_param('i', $anioId);
$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
}
$stmt->close();

responder(true, ['rows' => $rows]);
