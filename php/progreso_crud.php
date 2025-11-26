<?php
// php/progreso_crud.php
header('Content-Type: application/json; charset=utf-8');
require 'conexion_bd.php';

$action = $_GET['action'] ?? '';

switch ($action) {

    /* ============================
       1) LISTAR ASESORÍAS
       ============================ */
    case 'list_asesorias':
        $sql = "
            SELECT 
                id_usuarios,
                nombre,
                asesoria_usuarios,
                usuario
            FROM usuarios
            WHERE asesoria_usuarios IS NOT NULL
              AND asesoria_usuarios <> ''
            ORDER BY asesoria_usuarios, nombre
        ";

        $res = mysqli_query($conexion, $sql);

        $out = [];
        if ($res) {
            while ($row = mysqli_fetch_assoc($res)) {
                $out[] = [
                    'id_usuarios'       => (int)$row['id_usuarios'],
                    'nombre'            => $row['nombre'],
                    'asesoria_usuarios' => $row['asesoria_usuarios'],
                    'usuario'           => $row['usuario'],
                ];
            }
            mysqli_free_result($res);
        }

        echo json_encode($out, JSON_UNESCAPED_UNICODE);
        break;

    /* ============================
       2) CARGAR PRAP + PROGRESO
       ============================ */
    case 'load':
        // OJO: este anio es id_anio (FK), igual que en prap_listar.php
        $anio      = intval($_GET['anio'] ?? 0);
        $encargado = intval($_GET['encargado'] ?? 0);

        if (!$anio || !$encargado) {
            echo json_encode([]);
            break;
        }

        // 2.1 PRAP del año (anio = id_anio)
        $praps = [];
        $sqlP = "SELECT id_prap, prapcol_1, prapcol_2, prapcol_3,
                        prapcol_4, prapcol_5, prapcol_6
                 FROM prap
                 WHERE anio = $anio
                 ORDER BY id_prap ASC";
        $resP = mysqli_query($conexion, $sqlP);
        if ($resP) {
            while ($row = mysqli_fetch_assoc($resP)) {
                $praps[] = $row;
            }
            mysqli_free_result($resP);
        }

        // 2.2 Progresos del mismo año + encargado
        $progMap = [];
        $sqlG = "SELECT prap, progresocol_1, progresocol_2, progresocol_3, marcador
                 FROM progreso
                 WHERE anio = $anio AND encargado = $encargado";
        $resG = mysqli_query($conexion, $sqlG);
        if ($resG) {
            while ($row = mysqli_fetch_assoc($resG)) {
                $progMap[(int)$row['prap']] = $row;
            }
            mysqli_free_result($resG);
        }

        // 2.3 Construir respuesta (primero los que tienen progreso)
        $conProgreso = [];
        $sinProgreso = [];

        foreach ($praps as $p) {
            $id_prap = (int)$p['id_prap'];
            $g       = $progMap[$id_prap] ?? null;

            $tiene = $g !== null;

            $cantidad = $tiene ? (int)$g['progresocol_1'] : (int)$p['prapcol_3'];
            $p1abs    = $tiene ? (int)$g['progresocol_2'] : 0;
            $p2abs    = $tiene ? (int)$g['progresocol_3'] : 0;

            $fila = [
                "id_prap"      => $id_prap,
                "objetivo"     => $p['prapcol_1'],
                "indicador"    => $p['prapcol_2'],
                "cantidad"     => $cantidad,
                "actividad"    => $p['prapcol_4'],
                "periodo"      => $p['prapcol_5'],
                "responsables" => $p['prapcol_6'],
                "p1abs"        => $p1abs,
                "p2abs"        => $p2abs,
                "marcado"      => $tiene && ((int)$g['marcador'] === 1)
            ];

            if ($tiene) {
                $conProgreso[] = $fila;
            } else {
                $sinProgreso[] = $fila;
            }
        }

        $data = array_merge($conProgreso, $sinProgreso);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        break;

    /* ============================
       3) GUARDAR / ACTUALIZAR
       ============================ */
    case 'save':
        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            echo json_encode(["ok" => false, "error" => "Entrada inválida"], JSON_UNESCAPED_UNICODE);
            break;
        }

        foreach ($input as $item) {
            $prap      = intval($item['id_prap']);
            $anio      = intval($item['anio']);      // id_anio
            $encargado = intval($item['encargado']);

            $c1 = intval($item['cantidad']);
            $c2 = intval($item['p1abs']);
            $c3 = intval($item['p2abs']);

            $checkSql = "SELECT id_progreso
                         FROM progreso
                         WHERE prap = $prap AND anio = $anio AND encargado = $encargado
                         LIMIT 1";
            $checkRes = mysqli_query($conexion, $checkSql);

            if ($checkRes && ($row = mysqli_fetch_assoc($checkRes))) {
                $idProg = (int)$row['id_progreso'];
                $updSql = "UPDATE progreso
                           SET progresocol_1 = $c1,
                               progresocol_2 = $c2,
                               progresocol_3 = $c3,
                               marcador      = 1
                           WHERE id_progreso = $idProg";
                mysqli_query($conexion, $updSql);
            } else {
                $insSql = "INSERT INTO progreso
                           (progresocol_1, progresocol_2, progresocol_3, marcador, anio, encargado, prap)
                           VALUES ($c1, $c2, $c3, 1, $anio, $encargado, $prap)";
                mysqli_query($conexion, $insSql);
            }

            if ($checkRes) mysqli_free_result($checkRes);
        }

        echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);
        break;

    /* ============================
       4) ELIMINAR PROGRESOS
       ============================ */
    case 'delete':
        $input = json_decode(file_get_contents("php://input"), true);

        if (!is_array($input)) {
            echo json_encode(["ok" => false, "error" => "Entrada inválida"], JSON_UNESCAPED_UNICODE);
            break;
        }

        foreach ($input as $item) {
            $prap      = intval($item['id_prap']);
            $anio      = intval($item['anio']);      // id_anio
            $encargado = intval($item['encargado']);

            $delSql = "DELETE FROM progreso
                       WHERE prap = $prap AND anio = $anio AND encargado = $encargado";
            mysqli_query($conexion, $delSql);
        }

        echo json_encode(["ok" => true], JSON_UNESCAPED_UNICODE);
        break;

    default:
        echo json_encode(["ok" => false, "error" => "Acción no válida"], JSON_UNESCAPED_UNICODE);
        break;
}

mysqli_close($conexion);
exit;
