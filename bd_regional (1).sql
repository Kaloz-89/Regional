-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 26-11-2025 a las 17:53:00
-- Versión del servidor: 8.0.44
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `bd_regional`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anio`
--

CREATE TABLE `anio` (
  `id_anio` int NOT NULL,
  `anio` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `anio`
--

INSERT INTO `anio` (`id_anio`, `anio`) VALUES
(1, 2025),
(2, 2026),
(3, 2027),
(4, 2028),
(5, 2029),
(6, 2030),
(7, 2031),
(8, 2032),
(9, 2033),
(10, 2034),
(11, 2035),
(12, 2036),
(13, 2037),
(14, 2038),
(15, 2039),
(16, 2040);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asesorias`
--

CREATE TABLE `asesorias` (
  `id_asesorias` int NOT NULL,
  `asesoria_seleccion` varchar(72) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `asesorias`
--

INSERT INTO `asesorias` (`id_asesorias`, `asesoria_seleccion`, `anio`) VALUES
(7, 'c', 3),
(8, 'algo', 3),
(9, 'nose', 3),
(10, 'j', 16);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciclo_escolar`
--

CREATE TABLE `ciclo_escolar` (
  `id_cicloEscolar` int NOT NULL,
  `ciclo_escolar` varchar(64) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `ciclo_escolar`
--

INSERT INTO `ciclo_escolar` (`id_cicloEscolar`, `ciclo_escolar`, `anio`) VALUES
(6, 'b', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circuito_1`
--

CREATE TABLE `circuito_1` (
  `id_circuito1` int NOT NULL,
  `institucion_1` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `circuito_1`
--

INSERT INTO `circuito_1` (`id_circuito1`, `institucion_1`, `anio`) VALUES
(14, '1', 3),
(15, 'jueves', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circuito_2`
--

CREATE TABLE `circuito_2` (
  `id_circuito2` int NOT NULL,
  `institucion_2` varchar(128) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `circuito_2`
--

INSERT INTO `circuito_2` (`id_circuito2`, `institucion_2`, `anio`) VALUES
(5, '2', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circuito_3`
--

CREATE TABLE `circuito_3` (
  `id_circuito3` int NOT NULL,
  `institucion_3` varchar(128) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `circuito_3`
--

INSERT INTO `circuito_3` (`id_circuito3`, `institucion_3`, `anio`) VALUES
(2, '3', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circuito_4`
--

CREATE TABLE `circuito_4` (
  `id_circuito4` int NOT NULL,
  `institucion_4` varchar(128) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `circuito_4`
--

INSERT INTO `circuito_4` (`id_circuito4`, `institucion_4`, `anio`) VALUES
(1, '4', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `circuito_5`
--

CREATE TABLE `circuito_5` (
  `id_circuito5` int NOT NULL,
  `institucion_5` varchar(128) NOT NULL,
  `anio` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `circuito_5`
--

INSERT INTO `circuito_5` (`id_circuito5`, `institucion_5`, `anio`) VALUES
(4, '5', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuadros_informativos`
--

CREATE TABLE `cuadros_informativos` (
  `id_cuadro` int NOT NULL,
  `titulo` varchar(45) DEFAULT NULL,
  `contenido` varchar(256) DEFAULT NULL,
  `anio` int DEFAULT NULL,
  `seccion` varchar(30) NOT NULL DEFAULT 'GENERAL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cuadros_informativos`
--

INSERT INTO `cuadros_informativos` (`id_cuadro`, `titulo`, `contenido`, `anio`, `seccion`) VALUES
(94, 'Título…', 'abuela', 1, 'JUSTIFICACION'),
(95, 'Título…', 'Contenido…', 1, 'JUSTIFICACION'),
(96, 'Título…', 'Contenido…', 1, 'JUSTIFICACION'),
(97, 'Título…', 'que', 1, 'MVV'),
(98, 'Título…', ',', 1, 'MVV'),
(99, 'Título…', 'Contenllido…', 1, 'MVV');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jefatura`
--

CREATE TABLE `jefatura` (
  `id_jefatura` int NOT NULL,
  `jefaturacol_1` varchar(64) DEFAULT NULL,
  `jefaturacol_2` varchar(16) DEFAULT NULL,
  `jefaturacol_3` varchar(64) DEFAULT NULL,
  `jefaturacol_4` varchar(16) DEFAULT NULL,
  `jefaturacol_5` datetime DEFAULT NULL,
  `jefaturacol_6` varchar(32) DEFAULT NULL,
  `jefaturacol_7` varchar(32) DEFAULT NULL,
  `jefaturacol_8` varchar(128) DEFAULT NULL,
  `jefaturacol_9` varchar(16) DEFAULT NULL,
  `jefaturacol_10` varchar(256) DEFAULT NULL,
  `jefaturacol_11` tinyint DEFAULT NULL,
  `jefaturacol_12` tinyint DEFAULT NULL,
  `anio` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `jefatura`
--

INSERT INTO `jefatura` (`id_jefatura`, `jefaturacol_1`, `jefaturacol_2`, `jefaturacol_3`, `jefaturacol_4`, `jefaturacol_5`, `jefaturacol_6`, `jefaturacol_7`, `jefaturacol_8`, `jefaturacol_9`, `jefaturacol_10`, `jefaturacol_11`, `jefaturacol_12`, `anio`) VALUES
(4, 'c', 'circuito03', '3', 'Marzo', '2025-11-05 00:00:00', 'a', 'b', 'no se', 'Alta', 'se pudo observar', 1, 1, 3),
(5, 'nose', 'circuito05', '5', 'Enero', '2025-11-13 00:00:00', 'hola', 'b', 'iuqos', 'Media', 'koiohiygu', 1, 1, 3),
(7, 'c', 'circuito05', '5', 'Julio', '2025-11-28 00:00:00', 'hola', 'b', 'final', 'No Aplica', 'viernes', 0, 0, 3),
(8, 'nose', 'circuito02', '2', 'Noviembre', '2025-11-27 00:00:00', 'hola', 'b', 'ultima semana', 'No Aplica', 'q', 0, 0, 3),
(9, 'algo', 'Circuito03', '3', 'Diciembre', '2025-10-31 00:00:00', 'hola', 'b', 'khe', 'No Aplica', 'so', 0, 0, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oferta_formativa`
--

CREATE TABLE `oferta_formativa` (
  `id_oferta_formativa` int NOT NULL,
  `oferta_formativacol_1` varchar(45) DEFAULT NULL,
  `oferta_formativacol_2` varchar(256) DEFAULT NULL,
  `oferta_formativacol_3` varchar(256) DEFAULT NULL,
  `oferta_formativacol_4` varchar(256) DEFAULT NULL,
  `oferta_formativacol_5` varchar(256) DEFAULT NULL,
  `oferta_formativacol_6` varchar(45) DEFAULT NULL,
  `oferta_formativacol_7` varchar(45) DEFAULT NULL,
  `oferta_formativacol_8` varchar(45) DEFAULT NULL,
  `oferta_formativacol_9` varchar(45) DEFAULT NULL,
  `oferta_formativacol_10` varchar(45) DEFAULT NULL,
  `oferta_formativacol_11` varchar(64) DEFAULT NULL,
  `oferta_formativacol_12` varchar(64) DEFAULT NULL,
  `oferta_formativacol_13` varchar(64) DEFAULT NULL,
  `oferta_formativacol_14` tinyint DEFAULT NULL,
  `oferta_formativacol_15` int DEFAULT NULL,
  `anio` int DEFAULT NULL,
  `oferta_formativacol_16` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `oferta_formativa`
--

INSERT INTO `oferta_formativa` (`id_oferta_formativa`, `oferta_formativacol_1`, `oferta_formativacol_2`, `oferta_formativacol_3`, `oferta_formativacol_4`, `oferta_formativacol_5`, `oferta_formativacol_6`, `oferta_formativacol_7`, `oferta_formativacol_8`, `oferta_formativacol_9`, `oferta_formativacol_10`, `oferta_formativacol_11`, `oferta_formativacol_12`, `oferta_formativacol_13`, `oferta_formativacol_14`, `oferta_formativacol_15`, `anio`, `oferta_formativacol_16`) VALUES
(4, 'hola', '', '', '', '', '', '', '', '', '', 'jueves', '', '', 1, NULL, 3, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poa`
--

CREATE TABLE `poa` (
  `id_poa` int NOT NULL,
  `poacol_1` varchar(128) DEFAULT NULL,
  `poacol_2` varchar(128) DEFAULT NULL,
  `poacol_3` int DEFAULT NULL,
  `poacol_4` varchar(45) DEFAULT NULL,
  `anio` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `poa`
--

INSERT INTO `poa` (`id_poa`, `poacol_1`, `poacol_2`, `poacol_3`, `poacol_4`, `anio`) VALUES
(6, 'hola', '', NULL, '', 3),
(7, 'jueves', '', NULL, '', 3),
(9, 'viernes', 'algo', NULL, '', 3),
(10, 'carlos', '', NULL, '', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prap`
--

CREATE TABLE `prap` (
  `id_prap` int NOT NULL,
  `poa` int NOT NULL,
  `prapcol_1` varchar(128) DEFAULT NULL,
  `prapcol_2` varchar(128) DEFAULT NULL,
  `prapcol_3` int DEFAULT NULL,
  `prapcol_4` varchar(64) DEFAULT NULL,
  `prapcol_5` varchar(45) DEFAULT NULL,
  `prapcol_6` varchar(96) DEFAULT NULL,
  ` prapcol_6` varchar(96) DEFAULT NULL,
  `anio` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `prap`
--

INSERT INTO `prap` (`id_prap`, `poa`, `prapcol_1`, `prapcol_2`, `prapcol_3`, `prapcol_4`, `prapcol_5`, `prapcol_6`, ` prapcol_6`, `anio`) VALUES
(2, 7, 'martes', '', 3, '', '', 'nadie', NULL, 3),
(7, 7, 'no se', '', 8, '', '', '', NULL, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `progreso`
--

CREATE TABLE `progreso` (
  `id_progreso` int NOT NULL,
  `progresocol_1` int DEFAULT NULL,
  `progresocol_2` int DEFAULT NULL,
  `progresocol_3` int DEFAULT NULL,
  `marcador` tinyint DEFAULT NULL,
  `anio` int DEFAULT NULL,
  `encargado` int NOT NULL,
  `prap` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `progreso`
--

INSERT INTO `progreso` (`id_progreso`, `progresocol_1`, `progresocol_2`, `progresocol_3`, `marcador`, `anio`, `encargado`, `prap`) VALUES
(14, 3, 0, 0, 1, 3, 127, 2),
(17, 0, 0, 0, 1, 3, 20, 7),
(18, 0, 1, 1, 1, 3, 20, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_visita`
--

CREATE TABLE `tipo_visita` (
  `id_tipoVisita` int NOT NULL,
  `tipo_visita` varchar(64) NOT NULL,
  `anio` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `tipo_visita`
--

INSERT INTO `tipo_visita` (`id_tipoVisita`, `tipo_visita`, `anio`) VALUES
(36, 'a', 3),
(37, 'hola', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuarios` int NOT NULL,
  `nombre` varchar(65) DEFAULT NULL,
  `asesoria_usuarios` varchar(128) DEFAULT NULL,
  `correo` varchar(55) DEFAULT NULL,
  `usuario` varchar(45) DEFAULT NULL,
  `contrasena_estandar` varchar(45) DEFAULT NULL,
  `usuario_admin` varchar(45) DEFAULT NULL,
  `contrasena_admin` varchar(45) DEFAULT NULL,
  `fecha_creacion` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuarios`, `nombre`, `asesoria_usuarios`, `correo`, `usuario`, `contrasena_estandar`, `usuario_admin`, `contrasena_admin`, `fecha_creacion`) VALUES
(20, 'Carlos Alvarez', 'Tecnico', 'Carlosag2904@gmail.com', 'kz', '123', NULL, '123', NULL),
(127, 'nose', 'viernes', 'algo@gmail.com', 'js', '321', 'js', '321', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `anio`
--
ALTER TABLE `anio`
  ADD PRIMARY KEY (`id_anio`),
  ADD UNIQUE KEY `anio_UNIQUE` (`anio`);

--
-- Indices de la tabla `asesorias`
--
ALTER TABLE `asesorias`
  ADD PRIMARY KEY (`id_asesorias`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `ciclo_escolar`
--
ALTER TABLE `ciclo_escolar`
  ADD PRIMARY KEY (`id_cicloEscolar`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `circuito_1`
--
ALTER TABLE `circuito_1`
  ADD PRIMARY KEY (`id_circuito1`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `circuito_2`
--
ALTER TABLE `circuito_2`
  ADD PRIMARY KEY (`id_circuito2`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `circuito_3`
--
ALTER TABLE `circuito_3`
  ADD PRIMARY KEY (`id_circuito3`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `circuito_4`
--
ALTER TABLE `circuito_4`
  ADD PRIMARY KEY (`id_circuito4`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `circuito_5`
--
ALTER TABLE `circuito_5`
  ADD PRIMARY KEY (`id_circuito5`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `cuadros_informativos`
--
ALTER TABLE `cuadros_informativos`
  ADD PRIMARY KEY (`id_cuadro`),
  ADD KEY `cuadros_informativos-anio_idx` (`anio`);

--
-- Indices de la tabla `jefatura`
--
ALTER TABLE `jefatura`
  ADD PRIMARY KEY (`id_jefatura`),
  ADD KEY `jefatura-anio_idx` (`anio`);

--
-- Indices de la tabla `oferta_formativa`
--
ALTER TABLE `oferta_formativa`
  ADD PRIMARY KEY (`id_oferta_formativa`),
  ADD KEY `año-oferta_formativa_idx` (`anio`);

--
-- Indices de la tabla `poa`
--
ALTER TABLE `poa`
  ADD PRIMARY KEY (`id_poa`),
  ADD KEY `poa-anio_idx` (`anio`);

--
-- Indices de la tabla `prap`
--
ALTER TABLE `prap`
  ADD PRIMARY KEY (`id_prap`),
  ADD KEY `prap-poa_idx` (`poa`),
  ADD KEY `prap-anio_idx` (`anio`);

--
-- Indices de la tabla `progreso`
--
ALTER TABLE `progreso`
  ADD PRIMARY KEY (`id_progreso`),
  ADD KEY `encargado-progreso_idx` (`progresocol_1`),
  ADD KEY `progreso-anio_idx` (`anio`),
  ADD KEY `progreso-usuarios` (`encargado`),
  ADD KEY `progreso-prap` (`prap`);

--
-- Indices de la tabla `tipo_visita`
--
ALTER TABLE `tipo_visita`
  ADD PRIMARY KEY (`id_tipoVisita`),
  ADD KEY `anio` (`anio`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuarios`),
  ADD KEY `usuarios-anio_idx` (`fecha_creacion`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `anio`
--
ALTER TABLE `anio`
  MODIFY `id_anio` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `asesorias`
--
ALTER TABLE `asesorias`
  MODIFY `id_asesorias` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `ciclo_escolar`
--
ALTER TABLE `ciclo_escolar`
  MODIFY `id_cicloEscolar` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `circuito_1`
--
ALTER TABLE `circuito_1`
  MODIFY `id_circuito1` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `circuito_2`
--
ALTER TABLE `circuito_2`
  MODIFY `id_circuito2` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `circuito_3`
--
ALTER TABLE `circuito_3`
  MODIFY `id_circuito3` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `circuito_4`
--
ALTER TABLE `circuito_4`
  MODIFY `id_circuito4` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `circuito_5`
--
ALTER TABLE `circuito_5`
  MODIFY `id_circuito5` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `cuadros_informativos`
--
ALTER TABLE `cuadros_informativos`
  MODIFY `id_cuadro` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT de la tabla `jefatura`
--
ALTER TABLE `jefatura`
  MODIFY `id_jefatura` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `oferta_formativa`
--
ALTER TABLE `oferta_formativa`
  MODIFY `id_oferta_formativa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `poa`
--
ALTER TABLE `poa`
  MODIFY `id_poa` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `prap`
--
ALTER TABLE `prap`
  MODIFY `id_prap` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `progreso`
--
ALTER TABLE `progreso`
  MODIFY `id_progreso` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `tipo_visita`
--
ALTER TABLE `tipo_visita`
  MODIFY `id_tipoVisita` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuarios` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=128;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asesorias`
--
ALTER TABLE `asesorias`
  ADD CONSTRAINT `asesorias_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `ciclo_escolar`
--
ALTER TABLE `ciclo_escolar`
  ADD CONSTRAINT `ciclo_escolar_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `circuito_1`
--
ALTER TABLE `circuito_1`
  ADD CONSTRAINT `circuito_1_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `circuito_2`
--
ALTER TABLE `circuito_2`
  ADD CONSTRAINT `circuito_2_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `circuito_3`
--
ALTER TABLE `circuito_3`
  ADD CONSTRAINT `circuito_3_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `circuito_4`
--
ALTER TABLE `circuito_4`
  ADD CONSTRAINT `circuito_4_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `circuito_5`
--
ALTER TABLE `circuito_5`
  ADD CONSTRAINT `circuito_5_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `cuadros_informativos`
--
ALTER TABLE `cuadros_informativos`
  ADD CONSTRAINT `cuadros_informativos-anio` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`);

--
-- Filtros para la tabla `jefatura`
--
ALTER TABLE `jefatura`
  ADD CONSTRAINT `jefatura-anio` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`);

--
-- Filtros para la tabla `oferta_formativa`
--
ALTER TABLE `oferta_formativa`
  ADD CONSTRAINT `año-oferta_formativa` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`);

--
-- Filtros para la tabla `poa`
--
ALTER TABLE `poa`
  ADD CONSTRAINT `poa-anio` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`);

--
-- Filtros para la tabla `prap`
--
ALTER TABLE `prap`
  ADD CONSTRAINT `prap-anio` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`),
  ADD CONSTRAINT `prap-poa` FOREIGN KEY (`poa`) REFERENCES `poa` (`id_poa`);

--
-- Filtros para la tabla `progreso`
--
ALTER TABLE `progreso`
  ADD CONSTRAINT `progreso-anio` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`),
  ADD CONSTRAINT `progreso-prap` FOREIGN KEY (`prap`) REFERENCES `prap` (`id_prap`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `progreso-usuarios` FOREIGN KEY (`encargado`) REFERENCES `usuarios` (`id_usuarios`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `tipo_visita`
--
ALTER TABLE `tipo_visita`
  ADD CONSTRAINT `tipo_visita_ibfk_1` FOREIGN KEY (`anio`) REFERENCES `anio` (`id_anio`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios-anio` FOREIGN KEY (`fecha_creacion`) REFERENCES `anio` (`id_anio`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
