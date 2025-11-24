<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Parámetro anio inválido']);
    exit;
}

$sql = "SELECT
          id_jefatura AS id,
          jefaturacol_1  AS asesoria,
          jefaturacol_2  AS circuito,
          jefaturacol_3  AS institucion,
          jefaturacol_4  AS mes,
          DATE(jefaturacol_5) AS fecha,   -- solo fecha
          jefaturacol_6  AS tipoVisita,
          jefaturacol_7  AS cicloEscolar,
          jefaturacol_8  AS tematica,
          jefaturacol_9  AS prioridad,
          jefaturacol_10 AS observacion,
          jefaturacol_11 AS validFlag,
          jefaturacol_12 AS estadoFlag
        FROM jefatura
        WHERE anio = ?
        ORDER BY jefaturacol_5 ASC, id_jefatura ASC";

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
    $validacion = ((int)$row['validFlag'] === 1) ? 'Validada' : 'Pendiente';
    $estado     = ((int)$row['estadoFlag'] === 1) ? 'Revisada' : 'Sin revisar';

    $rows[] = [
        'id'                => (int)$row['id'],
        'asesoria'          => $row['asesoria'],
        'circuito'          => $row['circuito'],
        'institucion'       => $row['institucion'],
        'mes'               => $row['mes'],
        'fecha'             => $row['fecha'],
        'tipoVisita'        => $row['tipoVisita'],
        'cicloEscolar'      => $row['cicloEscolar'],
        'tematica'          => $row['tematica'],
        'prioridad'         => $row['prioridad'],
        'observacion'       => $row['observacion'],
        'validacionJefatura'=> $validacion,
        'estado'            => $estado
    ];
}
$stmt->close();

echo json_encode([
    'ok'   => true,
    'rows' => $rows
]);
