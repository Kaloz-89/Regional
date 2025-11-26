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

// id_anio (no el año humano)
$anioId = isset($data['anio']) ? (int)$data['anio'] : 0;
$rows   = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];

if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'id_anio inválido']);
    exit;
}

// Helpers para castear
$toStr = function($v) {
    return trim((string)($v ?? ''));
};

$toIntOrNull = function($v) {
    $t = trim((string)($v ?? ''));
    if ($t === '') return null;   // <-- permite dejarlo en blanco (NULL)
    return (int)$t;
};

$conexion->begin_transaction();

try {
    // 1) IDs actuales en BD para ese año
    $existentes = [];
    $stmt = $conexion->prepare("SELECT id_oferta_formativa FROM oferta_formativa WHERE anio = ?");
    $stmt->bind_param('i', $anioId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $existentes[] = (int)$r['id_oferta_formativa'];
    }
    $stmt->close();

    // IDs que se mantienen
    $idsKeep = [];
    foreach ($rows as $r) {
        if (!empty($r['id'])) $idsKeep[] = (int)$r['id'];
    }

    // 2) Eliminar los que ya no están
    $aDelete = array_diff($existentes, $idsKeep);
    if (!empty($aDelete)) {
        $stmtDel = $conexion->prepare("DELETE FROM oferta_formativa WHERE anio = ? AND id_oferta_formativa = ?");
        foreach ($aDelete as $delId) {
            $stmtDel->bind_param('ii', $anioId, $delId);
            $stmtDel->execute();
        }
        $stmtDel->close();
    }

    // 3) Preparar INSERT y UPDATE
    $sqlIns = "INSERT INTO oferta_formativa (
                 anio,
                 oferta_formativacol_1,  oferta_formativacol_2,  oferta_formativacol_3,
                 oferta_formativacol_4,  oferta_formativacol_5,  oferta_formativacol_6,
                 oferta_formativacol_7,  oferta_formativacol_8,  oferta_formativacol_9,
                 oferta_formativacol_10, oferta_formativacol_11, oferta_formativacol_12,
                 oferta_formativacol_13, oferta_formativacol_14, oferta_formativacol_15,
                 oferta_formativacol_16
               )
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $sqlUpd = "UPDATE oferta_formativa SET
                 oferta_formativacol_1  = ?, oferta_formativacol_2  = ?, oferta_formativacol_3  = ?,
                 oferta_formativacol_4  = ?, oferta_formativacol_5  = ?, oferta_formativacol_6  = ?,
                 oferta_formativacol_7  = ?, oferta_formativacol_8  = ?, oferta_formativacol_9  = ?,
                 oferta_formativacol_10 = ?, oferta_formativacol_11 = ?, oferta_formativacol_12 = ?,
                 oferta_formativacol_13 = ?, oferta_formativacol_14 = ?, oferta_formativacol_15 = ?,
                 oferta_formativacol_16 = ?
               WHERE id_oferta_formativa = ? AND anio = ?";

    // 13 columnas texto (1–13) + 3 numéricas (14–16)
    $stmtIns = $conexion->prepare($sqlIns);
    $stmtUpd = $conexion->prepare($sqlUpd);

    foreach ($rows as $r) {
        $id = (int)($r['id'] ?? 0);

        // Mapeo campos JS -> columnas de la tabla
        $c1  = $toStr($r['trimestre']            ?? '');
        $c2  = $toStr($r['brecha']               ?? '');
        $c3  = $toStr($r['objetivo']             ?? '');
        $c4  = $toStr($r['nombre']               ?? '');
        $c5  = $toStr($r['clase']                ?? '');
        $c6  = $toStr($r['estrategia']           ?? '');
        $c7  = $toStr($r['modalidad']            ?? '');
        $c8  = $toStr($r['horas']                ?? '');   // texto, tú decides si pones número
        $c9  = $toStr($r['grupos']               ?? '');
        $c10 = $toStr($r['poblacion']            ?? '');
        $c11 = $toStr($r['fecha_ini']            ?? '');   // *** se guarda tal cual texto ***
        $c12 = $toStr($r['fecha_fin']            ?? '');   // *** se guarda tal cual texto ***
        $c13 = $toStr($r['instancia']            ?? '');
        $c14 = $toIntOrNull($r['actividad_realizada'] ?? null); // tinyint (puede ser NULL)
        $c15 = $toIntOrNull($r['cant_hombres']        ?? null); // int (puede ser NULL)
        $c16 = $toIntOrNull($r['cant_mujeres']        ?? null); // int (puede ser NULL)

        if ($id > 0) {
            // UPDATE
                    if ($id > 0) {
            // UPDATE
            $stmtUpd->bind_param(
                'sssssssssssssiiiii',   // 13 's' + 5 'i' = 18
                $c1,$c2,$c3,$c4,$c5,$c6,$c7,$c8,$c9,$c10,$c11,$c12,$c13,
                $c14,$c15,$c16,
                $id,$anioId
            );
            $stmtUpd->execute();
        } else {
            // INSERT
            $stmtIns->bind_param(
                'isssssssssssssiii',
                $anioId,
                $c1,$c2,$c3,$c4,$c5,$c6,$c7,$c8,$c9,$c10,$c11,$c12,$c13,
                $c14,$c15,$c16
            );
            $stmtIns->execute();
        }
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
