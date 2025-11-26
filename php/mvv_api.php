<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "conexion_bd.php";

function responder($ok, $extra = []) {
    echo json_encode(array_merge(['ok' => $ok], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$ANIO_FIJO = 1;
$SECCION   = 'MVV';

// ---------- GET ----------
if ($method === 'GET') {
    $sql = "SELECT id_cuadro, titulo, contenido, anio, seccion 
            FROM cuadros_informativos 
            WHERE anio = ? AND seccion = ? 
            ORDER BY id_cuadro";
    $stmt = $conexion->prepare($sql);
    if (!$stmt) responder(false, ['error' => $conexion->error]);

    $stmt->bind_param("is", $ANIO_FIJO, $SECCION);
    $stmt->execute();
    $res = $stmt->get_result();

    $data = [];
    while ($row = $res->fetch_assoc()) $data[] = $row;
    $stmt->close();

    responder(true, ['data' => $data]);
}

// ---------- POST ----------
if ($method === 'POST') {
    $raw  = file_get_contents("php://input");
    $json = json_decode($raw, true);
    $cards = $json['cards'] ?? [];

    if (!is_array($cards) || empty($cards)) {
        responder(false, ['error' => 'Datos incompletos']);
    }

    $conexion->begin_transaction();
    try {
        $del = $conexion->prepare("DELETE FROM cuadros_informativos WHERE anio = ? AND seccion = ?");
        $del->bind_param("is", $ANIO_FIJO, $SECCION);
        $del->execute();
        $del->close();

        $ins = $conexion->prepare("INSERT INTO cuadros_informativos (titulo, contenido, anio, seccion) VALUES (?,?,?,?)");
        foreach ($cards as $c) {
            $titulo = trim($c['title'] ?? '');
            $contenido = trim($c['body'] ?? '');
            if ($titulo === '' && $contenido === '') continue;
            $ins->bind_param("ssis", $titulo, $contenido, $ANIO_FIJO, $SECCION);
            $ins->execute();
        }
        $ins->close();

        $conexion->commit();
        responder(true);
    } catch (Exception $e) {
        $conexion->rollback();
        responder(false, ['error' => $e->getMessage()]);
    }
}

responder(false, ['error' => 'Método no permitido']);
