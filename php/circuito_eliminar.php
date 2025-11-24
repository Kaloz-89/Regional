<?php
// php/circuito_eliminar.php
header('Content-Type: application/json; charset=utf-8');
include "conexion_bd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'Metodo no permitido']);
    exit;
}

$circuito = $_POST['circuito'] ?? '';
$id       = isset($_POST['id']) ? intval($_POST['id']) : 0;
$anioId   = isset($_POST['anio']) ? (int)$_POST['anio'] : 0; // id_anio, opcional

if ($circuito === '' || $id <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Datos incompletos']);
    exit;
}

$mapaCircuitos = [
    'circuito01' => ['tabla' => 'circuito_1', 'pk' => 'id_circuito1'],
    'circuito02' => ['tabla' => 'circuito_2', 'pk' => 'id_circuito2'],
    'circuito03' => ['tabla' => 'circuito_3', 'pk' => 'id_circuito3'],
    'circuito04' => ['tabla' => 'circuito_4', 'pk' => 'id_circuito4'],
    'circuito05' => ['tabla' => 'circuito_5', 'pk' => 'id_circuito5'],
];

if (!isset($mapaCircuitos[$circuito])) {
    echo json_encode(['ok' => false, 'error' => 'Circuito no valido']);
    exit;
}

$tabla = $mapaCircuitos[$circuito]['tabla'];
$pk    = $mapaCircuitos[$circuito]['pk'];

// PK es único, no hace falta filtrar por año para borrar
$sql = "DELETE FROM $tabla WHERE $pk = $id";
$run = mysqli_query($conexion, $sql);

if ($run) {
    echo json_encode(['ok' => true]);
} else {
    echo json_encode(['ok' => false, 'error' => mysqli_error($conexion)]);
}

mysqli_close($conexion);
exit;
