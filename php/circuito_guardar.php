<?php
// php/circuito_guardar.php

include "conexion_bd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../marco_referencia.html");
    exit;
}

$circuito = $_POST['circuito'] ?? '';
$valor    = trim($_POST['valor'] ?? '');
$anioId   = isset($_POST['anio']) ? (int)$_POST['anio'] : 0; // id_anio

if ($circuito === '' || $valor === '' || $anioId <= 0) {
    header("Location: ../marco_referencia.html?errorCircuito=1&modal=circuitos");
    exit;
}

$mapaCircuitos = [
    'circuito01' => ['tabla' => 'circuito_1', 'pk' => 'id_circuito1', 'col' => 'institucion_1'],
    'circuito02' => ['tabla' => 'circuito_2', 'pk' => 'id_circuito2', 'col' => 'institucion_2'],
    'circuito03' => ['tabla' => 'circuito_3', 'pk' => 'id_circuito3', 'col' => 'institucion_3'],
    'circuito04' => ['tabla' => 'circuito_4', 'pk' => 'id_circuito4', 'col' => 'institucion_4'],
    'circuito05' => ['tabla' => 'circuito_5', 'pk' => 'id_circuito5', 'col' => 'institucion_5'],
];

if (!isset($mapaCircuitos[$circuito])) {
    header("Location: ../marco_referencia.html?errorCircuito=2&modal=circuitos");
    exit;
}

$tabla = $mapaCircuitos[$circuito]['tabla'];
$col   = $mapaCircuitos[$circuito]['col'];

$valor_sql = mysqli_real_escape_string($conexion, $valor);

$sql = "INSERT INTO $tabla ($col, anio) VALUES ('$valor_sql', $anioId)";
$run = mysqli_query($conexion, $sql);

if ($run) {
    $c = urlencode($circuito);
    header("Location: ../marco_referencia.html?okCircuito=1&modal=circuitos&circuito=$c");
} else {
    $err = urlencode(mysqli_error($conexion));
    $c   = urlencode($circuito);
    header("Location: ../marco_referencia.html?errorCircuito=3&modal=circuitos&circuito=$c&msg=$err");
}

mysqli_close($conexion);
exit;
