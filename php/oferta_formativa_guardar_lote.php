<?php
// php/oferta_formativa_guardar_lote.php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexion_bd.php';

// Muy importante: que mysqli lance excepciones si algo falla
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conexion->set_charset('utf8mb4');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Solo se permite POST']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    echo json_encode(['ok' => false, 'error' => 'JSON inválido', 'debug_raw' => $raw]);
    exit;
}

// id_anio (FK, NO el año 2025 sino el id_anio de la tabla anio)
$anioId = isset($data['anio']) ? (int)$data['anio'] : 0;
$rows   = isset($data['rows']) && is_array($data['rows']) ? $data['rows'] : [];

if ($anioId <= 0) {
    echo json_encode(['ok' => false, 'error' => 'id_anio inválido']);
    exit;
}

// Helpers
$toStr = function($v) {
    return trim((string)($v ?? ''));
};

$toIntOrNull = function($v) {
    $t = trim((string)($v ?? ''));
    if ($t === '') return null;   // deja NULL en BD
    return (int)$t;
};

try {
    $conexion->begin_transaction();

    // 1) IDs actuales en BD para ese año
    $existentes = [];
    $stmt = $conexion->prepare(
        "SELECT id_oferta_formativa 
           FROM oferta_formativa 
          WHERE anio = ?"
    );
    $stmt->bind_param('i', $anioId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) {
        $existentes[] = (int)$r['id_oferta_formativa'];
    }
    $stmt->close();

    // IDs que vienen desde el front
    $idsKeep = [];
    foreach ($rows as $r) {
        if (!empty($r['id'])) {
            $idsKeep[] = (int)$r['id'];
        }
    }

    // 2) Eliminar los que ya no vienen
    $aDelete = array_diff($existentes, $idsKeep);
    if (!empty($aDelete)) {
        $stmtDel = $conexion->prepare(
            "DELETE FROM oferta_formativa 
              WHERE anio = ? 
                AND id_oferta_formativa = ?"
        );
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

    $stmtIns = $conexion->prepare($sqlIns);
    $stmtUpd = $conexion->prepare($sqlUpd);

    $insertados = 0;
    $actualizados = 0;

    foreach ($rows as $r) {
        $id = (int)($r['id'] ?? 0);

        // Mapeo campos JS -> columnas
        $c1  = $toStr($r['trimestre']  ?? '');
        $c2  = $toStr($r['brecha']     ?? '');
        $c3  = $toStr($r['objetivo']   ?? '');
        $c4  = $toStr($r['nombre']     ?? '');
        $c5  = $toStr($r['clase']      ?? '');
        $c6  = $toStr($r['estrategia'] ?? '');
        $c7  = $toStr($r['modalidad']  ?? '');
        $c8  = $toStr($r['horas']      ?? '');
        $c9  = $toStr($r['grupos']     ?? '');
        $c10 = $toStr($r['poblacion']  ?? '');
        $c11 = $toStr($r['fecha_ini']  ?? '');
        $c12 = $toStr($r['fecha_fin']  ?? '');
        $c13 = $toStr($r['instancia']  ?? '');
        $c14 = $toIntOrNull($r['actividad_realizada'] ?? null); // tinyint
        $c15 = $toIntOrNull($r['cant_hombres']        ?? null); // int
        $c16 = $toIntOrNull($r['cant_mujeres']        ?? null); // int

        // Opcional: si TODA la fila está vacía, la saltamos
        if (
            $c1 === '' && $c2 === '' && $c3 === '' && $c4 === '' &&
            $c5 === '' && $c6 === '' && $c7 === '' && $c8 === '' &&
            $c9 === '' && $c10 === '' && $c11 === '' && $c12 === '' &&
            $c13 === '' && $c14 === null && $c15 === null && $c16 === null
        ) {
            continue;
        }

        if ($id > 0) {
            // UPDATE
            $stmtUpd->bind_param(
                'sssssssssssssiiiii',  // 13 's' + 5 'i' = 18
                $c1,$c2,$c3,$c4,$c5,$c6,$c7,$c8,$c9,$c10,$c11,$c12,$c13,
                $c14,$c15,$c16,
                $id,$anioId
            );
            $stmtUpd->execute();
            $actualizados++;
        } else {
            // INSERT
            $stmtIns->bind_param(
                'isssssssssssssiii',   // 1 'i' (anio) + 13 's' + 3 'i'
                $anioId,
                $c1,$c2,$c3,$c4,$c5,$c6,$c7,$c8,$c9,$c10,$c11,$c12,$c13,
                $c14,$c15,$c16
            );
            $stmtIns->execute();
            $insertados++;
        }
    }

    $stmtIns->close();
    $stmtUpd->close();

    $conexion->commit();

    echo json_encode([
        'ok'           => true,
        'insertados'   => $insertados,
        'actualizados' => $actualizados,
        'eliminados'   => count($aDelete),
    ]);
} catch (Throwable $e) {
    // Si algo falla, revierte todo y muestra el error REAL
    if ($conexion->errno) {
        $conexion->rollback();
    }
    echo json_encode([
        'ok'    => false,
        'error' => $e->getMessage(),
    ]);
}
