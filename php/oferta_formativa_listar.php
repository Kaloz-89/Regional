<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Parámetro anio inválido']);
    exit;
}

$sql = "SELECT
          id_oferta_formativa AS id,
          oferta_formativacol_1  AS trimestre,
          oferta_formativacol_2  AS brecha,
          oferta_formativacol_3  AS objetivo,
          oferta_formativacol_4  AS nombre,
          oferta_formativacol_5  AS clase,
          oferta_formativacol_6  AS estrategia,
          oferta_formativacol_7  AS modalidad,
          oferta_formativacol_8  AS horas,
          oferta_formativacol_9  AS grupos,
          oferta_formativacol_10 AS poblacion,
          oferta_formativacol_11 AS fecha_ini,
          oferta_formativacol_12 AS fecha_fin,
          oferta_formativacol_13 AS instancia,
          oferta_formativacol_14 AS actividad_realizada,
          oferta_formativacol_15 AS cant_hombres,
          oferta_formativacol_16 AS cant_mujeres
        FROM oferta_formativa
        WHERE anio = ?
        ORDER BY id_oferta_formativa ASC";

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
    // Normalizamos a string (el JS ya los trata todo como texto)
    $rows[] = [
        'id'                  => (int)$row['id'],
        'trimestre'           => (string)($row['trimestre'] ?? ''),
        'brecha'              => (string)($row['brecha'] ?? ''),
        'objetivo'            => (string)($row['objetivo'] ?? ''),
        'nombre'              => (string)($row['nombre'] ?? ''),
        'clase'               => (string)($row['clase'] ?? ''),
        'estrategia'          => (string)($row['estrategia'] ?? ''),
        'modalidad'           => (string)($row['modalidad'] ?? ''),
        'horas'               => (string)($row['horas'] ?? ''),
        'grupos'              => (string)($row['grupos'] ?? ''),
        'poblacion'           => (string)($row['poblacion'] ?? ''),
        'fecha_ini'           => (string)($row['fecha_ini'] ?? ''),
        'fecha_fin'           => (string)($row['fecha_fin'] ?? ''),
        'instancia'           => (string)($row['instancia'] ?? ''),
        'actividad_realizada' => $row['actividad_realizada'], // puede venir null o 0/1
        'cant_hombres'        => $row['cant_hombres'],
        'cant_mujeres'        => $row['cant_mujeres'],
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'rows' => $rows]);
