<?php
// php/prap_guardar_lote.php
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

$anioId = isset($data['anio']) ? (int)$data['anio'] : 0; // id_anio
$poaId  = isset($data['poa'])  ? (int)$data['poa']  : 0; // id_poa
$rows   = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];

if ($anioId <= 0 || $poaId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'id_anio o id_poa inválidos']);
    exit;
}

$toStr = function($v) {
    return trim((string)($v ?? ''));
};
$toIntOrNull = function($v) {
    $t = trim((string)($v ?? ''));
    if ($t === '') return null;
    return (int)$t;
};

$conexion->begin_transaction();

try {
    // IDs existentes para ese año+poa
    $existentes = [];
    $stmt = $conexion->prepare("SELECT id_prap FROM prap WHERE anio = ? AND poa = ?");
    if (!$stmt) {
        throw new Exception('Error prepare SELECT: '.$conexion->error);
    }
    $stmt->bind_param('ii', $anioId, $poaId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $existentes[] = (int)$r['id_prap'];
    }
    $stmt->close();

    // IDs que se mantienen
    $idsKeep = [];
    foreach ($rows as $r) {
        if (!empty($r['id'])) {
            $idsKeep[] = (int)$r['id'];
        }
    }

    // Eliminar los que ya no están
    $aDelete = array_diff($existentes, $idsKeep);
    if (!empty($aDelete)) {
        $stmtDel = $conexion->prepare(
            "DELETE FROM prap WHERE anio = ? AND poa = ? AND id_prap = ?"
        );
        if (!$stmtDel) {
            throw new Exception('Error prepare DELETE: '.$conexion->error);
        }
        foreach ($aDelete as $delId) {
            $stmtDel->bind_param('iii', $anioId, $poaId, $delId);
            $stmtDel->execute();
        }
        $stmtDel->close();
    }

    // INSERT y UPDATE
    $sqlIns = "INSERT INTO prap (
                 anio,
                 poa,
                 prapcol_1,
                 prapcol_2,
                 prapcol_3,
                 prapcol_4,
                 prapcol_5,
                 prapcol_6
               )
               VALUES (?,?,?,?,?,?,?,?)";

    $sqlUpd = "UPDATE prap SET
                 prapcol_1 = ?,
                 prapcol_2 = ?,
                 prapcol_3 = ?,
                 prapcol_4 = ?,
                 prapcol_5 = ?,
                 prapcol_6 = ?
               WHERE id_prap = ? AND anio = ? AND poa = ?";

    $stmtIns = $conexion->prepare($sqlIns);
    $stmtUpd = $conexion->prepare($sqlUpd);

    if (!$stmtIns || !$stmtUpd) {
        throw new Exception('Error prepare INSERT/UPDATE: ' . $conexion->error);
    }

    foreach ($rows as $r) {
        $id      = isset($r['id']) ? (int)$r['id'] : 0;
        $obj     = $toStr($r['obj']     ?? '');
        $ind     = $toStr($r['ind']     ?? '');
        $cant    = $toIntOrNull($r['cant']    ?? null); // INT (NULL permitido)
        $acts    = $toStr($r['acts']    ?? '');
        $periodo = $toStr($r['periodo'] ?? '');
        $resp    = $toStr($r['resp']    ?? '');

        if ($id > 0) {
            // UPDATE
            $stmtUpd->bind_param(
                'ssisssiii', // 9 parámetros
                $obj,
                $ind,
                $cant,
                $acts,
                $periodo,
                $resp,
                $id,
                $anioId,
                $poaId
            );
            $stmtUpd->execute();
        } else {
            // INSERT
            $stmtIns->bind_param(
                'iississs',  // 8 parámetros
                $anioId,
                $poaId,
                $obj,
                $ind,
                $cant,
                $acts,
                $periodo,
                $resp
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
