<?php
header('Content-Type: application/json; charset=utf-8');
include "conexion_bd.php";

// aquí anio ES id_anio
$anioId = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;

$out = [
  'ok' => true,
  'tipoVisita'   => [],
  'cicloEscolar' => [],
  'asesoria'     => []
];

if ($anioId <= 0) {
    $out['ok']   = false;
    $out['error']= 'anio_id_invalido';
    echo json_encode($out);
    mysqli_close($conexion);
    exit;
}

$q1 = "SELECT id_tipoVisita AS id, tipo_visita AS texto
       FROM tipo_visita
       WHERE anio = $anioId
       ORDER BY tipo_visita";
$r1 = mysqli_query($conexion, $q1);
if ($r1) {
    while ($row = mysqli_fetch_assoc($r1)) {
        $out['tipoVisita'][] = $row;
    }
} else {
    $out['ok']   = false;
    $out['error']= mysqli_error($conexion);
}

$q2 = "SELECT id_cicloEscolar AS id, ciclo_escolar AS texto
       FROM ciclo_escolar
       WHERE anio = $anioId
       ORDER BY ciclo_escolar";
$r2 = mysqli_query($conexion, $q2);
if ($r2) {
    while ($row = mysqli_fetch_assoc($r2)) {
        $out['cicloEscolar'][] = $row;
    }
} else {
    $out['ok']   = false;
    $out['error']= mysqli_error($conexion);
}

$q3 = "SELECT id_asesorias AS id, asesoria_seleccion AS texto
       FROM asesorias
       WHERE anio = $anioId
       ORDER BY asesoria_seleccion";
$r3 = mysqli_query($conexion, $q3);
if ($r3) {
    while ($row = mysqli_fetch_assoc($r3)) {
        $out['asesoria'][] = $row;
    }
} else {
    $out['ok']   = false;
    $out['error']= mysqli_error($conexion);
}

echo json_encode($out);
mysqli_close($conexion);
exit;
