<?php
// php/config_superadmin.php

// Usuario súper-admin (solo en backend)
const SUPERADMIN_USER = 'Administrador';

// Genera este hash con un script aparte:
// echo password_hash('Adm¡n¡str@d0r', PASSWORD_DEFAULT);
const SUPERADMIN_HASH = '$2y$10$PON_AQUI_EL_HASH_REAL_GENERADO';
