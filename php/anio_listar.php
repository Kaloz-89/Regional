<?php
// php/anio_listar.php
header('Content-Type: application/json; charset=utf-8');
include "conexion_bd.php";

$out = [
    'ok'    => true,
    'anios' => []
];

$sql = "SELECT id_anio, anio FROM anio ORDER BY anio ASC";
$res = mysqli_query($conexion, $sql);

if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $out['anios'][] = [
            'id'   => (int)$row['id_anio'],
            'anio' => (int)$row['anio']
        ];
    }
    mysqli_free_result($res);
} else {
    $out['ok']    = false;
    $out['error'] = mysqli_error($conexion);
}

echo json_encode($out);
mysqli_close($conexion);
exit;
