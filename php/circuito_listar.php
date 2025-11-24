<?php
// php/circuito_listar.php
header('Content-Type: application/json; charset=utf-8');
include "conexion_bd.php";

// Aquí anio ES id_anio
$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;

$out = [
    'ok'        => true,
    'circuitos' => [
        'circuito01' => [],
        'circuito02' => [],
        'circuito03' => [],
        'circuito04' => [],
        'circuito05' => [],
    ],
];

if ($anioId <= 0) {
    $out['ok']   = false;
    $out['error']= 'anio_id_invalido';
    echo json_encode($out);
    mysqli_close($conexion);
    exit;
}

$mapaCircuitos = [
    'circuito01' => ['tabla' => 'circuito_1', 'pk' => 'id_circuito1', 'col' => 'institucion_1'],
    'circuito02' => ['tabla' => 'circuito_2', 'pk' => 'id_circuito2', 'col' => 'institucion_2'],
    'circuito03' => ['tabla' => 'circuito_3', 'pk' => 'id_circuito3', 'col' => 'institucion_3'],
    'circuito04' => ['tabla' => 'circuito_4', 'pk' => 'id_circuito4', 'col' => 'institucion_4'],
    'circuito05' => ['tabla' => 'circuito_5', 'pk' => 'id_circuito5', 'col' => 'institucion_5'],
];

foreach ($mapaCircuitos as $keyFront => $cfg) {
    $tabla = $cfg['tabla'];
    $pk    = $cfg['pk'];
    $col   = $cfg['col'];

    $sql = "SELECT $pk AS id, $col AS texto 
            FROM $tabla 
            WHERE anio = $anioId 
            ORDER BY $col";

    $res = mysqli_query($conexion, $sql);
    if ($res) {
        while ($row = mysqli_fetch_assoc($res)) {
            $out['circuitos'][$keyFront][] = $row;
        }
        mysqli_free_result($res);
    } else {
        $out['ok']    = false;
        $out['error'] = mysqli_error($conexion);
        break;
    }
}

echo json_encode($out);
mysqli_close($conexion);
exit;
