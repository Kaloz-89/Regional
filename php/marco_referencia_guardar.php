<?php
include "conexion_bd.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../marco_referencia.html");
    exit;
}

$campo = $_POST['campo'] ?? '';
$valor = trim($_POST['valor'] ?? '');
$anioId = isset($_POST['anio']) ? (int)$_POST['anio'] : 0; // id_anio

if ($campo === '' || $valor === '' || $anioId <= 0) {
    header("Location: ../marco_referencia.html?error=1");
    exit;
}

$tabla   = '';
$columna = '';

switch ($campo) {
    case 'tipoVisita':
        $tabla   = 'tipo_visita';
        $columna = 'tipo_visita';
        break;
    case 'cicloEscolar':
        $tabla   = 'ciclo_escolar';
        $columna = 'ciclo_escolar';
        break;
    case 'asesoria':
        $tabla   = 'asesorias';
        $columna = 'asesoria_seleccion';
        break;
    default:
        header("Location: ../marco_referencia.html?error=2");
        exit;
}

$valor_sql = mysqli_real_escape_string($conexion, $valor);
$sql = "INSERT INTO $tabla ($columna, anio) VALUES ('$valor_sql', $anioId)";
$run = mysqli_query($conexion, $sql);

if ($run) {
    header("Location: ../marco_referencia.html?ok=1");
} else {
    $err = urlencode(mysqli_error($conexion));
    header("Location: ../marco_referencia.html?error=3&msg=$err");
}

mysqli_close($conexion);
exit;
