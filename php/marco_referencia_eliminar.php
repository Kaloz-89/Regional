<?php
header('Content-Type: application/json; charset=utf-8');
include "conexion_bd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'Metodo no permitido']);
    exit;
}

$campo = $_POST['campo'] ?? '';
$id    = isset($_POST['id']) ? intval($_POST['id']) : 0;
// anioId llega pero realmente con el PK basta; si quieres puedes comprobarlo también
$anioId = isset($_POST['anio']) ? (int)$_POST['anio'] : 0;

if ($campo === '' || $id <= 0) {
    echo json_encode(['ok' => false, 'error' => 'Datos incompletos']);
    exit;
}

$tabla = '';
$pk = '';

switch ($campo) {
    case 'tipoVisita':
        $tabla = 'tipo_visita';
        $pk    = 'id_tipoVisita';
        break;
    case 'cicloEscolar':
        $tabla = 'ciclo_escolar';
        $pk    = 'id_cicloEscolar';
        break;
    case 'asesoria':
        $tabla = 'asesorias';
        $pk    = 'id_asesorias';
        break;
    default:
        echo json_encode(['ok' => false, 'error' => 'Campo no valido']);
        exit;
}

$sql = "DELETE FROM $tabla WHERE $pk = $id";
$run = mysqli_query($conexion, $sql);

if ($run) {
    echo json_encode(['ok' => true]);
} else {
    echo json_encode(['ok' => false, 'error' => mysqli_error($conexion)]);
}

mysqli_close($conexion);
exit;
