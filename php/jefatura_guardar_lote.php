<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Solo se permite POST']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
    exit;
}

$anioId = isset($data['anio']) ? (int)$data['anio'] : 0; // OJO: aquí viene el id_anio
$rows   = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];

if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'id_anio inválido']);
    exit;
}

function validacionToFlag($s){
    $t = mb_strtolower(trim((string)$s), 'UTF-8');
    if ($t === 'validada' || $t === 'validado' || $t === '1' || $t === 'sí' || $t === 'si') return 1;
    return 0; // Pendiente
}
function estadoToFlag($s){
    $t = mb_strtolower(trim((string)$s), 'UTF-8');
    if ($t === 'revisada' || $t === 'revisado' || $t === '1' || $t === 'sí' || $t === 'si') return 1;
    return 0; // Sin revisar
}

$conexion->begin_transaction();

try {
    // 1) averiguar qué IDs existen actualmente para ese año
    $existentes = [];
    $stmt = $conexion->prepare("SELECT id_jefatura FROM jefatura WHERE anio = ?");
    $stmt->bind_param('i', $anioId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $existentes[] = (int)$r['id_jefatura'];
    }
    $stmt->close();

    // IDs que se van a mantener
    $idsKeep = [];
    foreach ($rows as $r) {
        if (!empty($r['id'])) $idsKeep[] = (int)$r['id'];
    }

    // 2) eliminar los que ya no están en la tabla de la vista
    $aDelete = array_diff($existentes, $idsKeep);
    if (!empty($aDelete)) {
        $stmtDel = $conexion->prepare("DELETE FROM jefatura WHERE anio = ? AND id_jefatura = ?");
        foreach ($aDelete as $delId) {
            $stmtDel->bind_param('ii', $anioId, $delId);
            $stmtDel->execute();
        }
        $stmtDel->close();
    }

    // 3) preparar sentencias de INSERT y UPDATE
    $sqlIns = "INSERT INTO jefatura (
                 anio,
                 jefaturacol_1, jefaturacol_2, jefaturacol_3, jefaturacol_4,
                 jefaturacol_5, jefaturacol_6, jefaturacol_7, jefaturacol_8,
                 jefaturacol_9, jefaturacol_10, jefaturacol_11, jefaturacol_12
               )
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $sqlUpd = "UPDATE jefatura SET
                 jefaturacol_1  = ?, jefaturacol_2  = ?, jefaturacol_3  = ?,
                 jefaturacol_4  = ?, jefaturacol_5  = ?, jefaturacol_6  = ?,
                 jefaturacol_7  = ?, jefaturacol_8  = ?, jefaturacol_9  = ?,
                 jefaturacol_10 = ?, jefaturacol_11 = ?, jefaturacol_12 = ?
               WHERE id_jefatura = ? AND anio = ?";

    $stmtIns = $conexion->prepare($sqlIns);
    $stmtUpd = $conexion->prepare($sqlUpd);

    foreach ($rows as $r) {
        $id           = (int)($r['id'] ?? 0);
        $asesoria     = trim($r['asesoria']     ?? '');
        $circuito     = trim($r['circuito']     ?? '');
        $institucion  = trim($r['institucion']  ?? '');
        $mes          = trim($r['mes']          ?? '');
        $fecha        = trim($r['fecha']        ?? '');
        $tipoVisita   = trim($r['tipoVisita']   ?? '');
        $cicloEscolar = trim($r['cicloEscolar'] ?? '');
        $tematica     = trim($r['tematica']     ?? '');
        $prioridad    = trim($r['prioridad']    ?? '');
        $observacion  = trim($r['observacion']  ?? '');
        $valJefStr    = $r['validacionJefatura'] ?? '';
        $estadoStr    = $r['estado'] ?? '';

        $validFlag  = validacionToFlag($valJefStr);
        $estadoFlag = estadoToFlag($estadoStr);

        if ($id > 0) {
            // UPDATE
            $stmtUpd->bind_param(
                'ssssssssssiiii',
                $asesoria,
                $circuito,
                $institucion,
                $mes,
                $fecha,
                $tipoVisita,
                $cicloEscolar,
                $tematica,
                $prioridad,
                $observacion,
                $validFlag,
                $estadoFlag,
                $id,
                $anioId
            );
            $stmtUpd->execute();
        } else {
            // INSERT
            $stmtIns->bind_param(
                'issssssssssii',
                $anioId,
                $asesoria,
                $circuito,
                $institucion,
                $mes,
                $fecha,
                $tipoVisita,
                $cicloEscolar,
                $tematica,
                $prioridad,
                $observacion,
                $validFlag,
                $estadoFlag
            );
            $stmtIns->execute();
        }
    }

    $stmtIns->close();
    $stmtUpd->close();

    $conexion->commit();
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    $conexion->rollback();
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
