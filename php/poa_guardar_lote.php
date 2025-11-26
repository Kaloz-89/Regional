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

// id_anio (FK)
$anioId = isset($data['anio']) ? (int)$data['anio'] : 0;
$rows   = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];

if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'id_anio inválido']);
    exit;
}

$toStr = function ($v) {
    return trim((string)($v ?? ''));
};

$toIntOrNull = function ($v) {
    $t = trim((string)($v ?? ''));
    if ($t === '') return null;
    return (int)$t;
};

$conexion->begin_transaction();

try {
    // 1) IDs actuales en BD para ese año
    $existentes = [];
    $stmt = $conexion->prepare("SELECT id_poa FROM poa WHERE anio = ?");
    $stmt->bind_param('i', $anioId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $existentes[] = (int)$r['id_poa'];
    }
    $stmt->close();

    // IDs que permanecen
    $idsKeep = [];
    foreach ($rows as $r) {
        if (!empty($r['id'])) $idsKeep[] = (int)$r['id'];
    }

    // 2) Eliminar los que ya no están
    $aDelete = array_diff($existentes, $idsKeep);
    if (!empty($aDelete)) {
        $stmtDel = $conexion->prepare("DELETE FROM poa WHERE anio = ? AND id_poa = ?");
        foreach ($aDelete as $delId) {
            $stmtDel->bind_param('ii', $anioId, $delId);
            $stmtDel->execute();
        }
        $stmtDel->close();
    }

    // 3) Preparar INSERT y UPDATE
    $sqlIns = "INSERT INTO poa (
                 anio,
                 poacol_1, poacol_2, poacol_3, poacol_4
               ) VALUES (?,?,?,?,?)";

    $sqlUpd = "UPDATE poa SET
                 poacol_1 = ?, poacol_2 = ?, poacol_3 = ?, poacol_4 = ?
               WHERE id_poa = ? AND anio = ?";

    $stmtIns = $conexion->prepare($sqlIns);
    $stmtUpd = $conexion->prepare($sqlUpd);

    foreach ($rows as $r) {
        $id        = (int)($r['id'] ?? 0);
        $area      = $toStr($r['area'] ?? '');
        $objetivo  = $toStr($r['objetivo'] ?? '');
        $meta      = $toIntOrNull($r['meta'] ?? null);      // int NULL permitido
        $indicador = $toStr($r['indicador'] ?? '');

        if ($id > 0) {
            // UPDATE
            $stmtUpd->bind_param(
                'ssissi',
                $area, $objetivo, $meta, $indicador,
                $id, $anioId
            );
            $stmtUpd->execute();
        } else {
            // INSERT
            $stmtIns->bind_param(
                'issis',
                $anioId,
                $area, $objetivo, $meta, $indicador
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
