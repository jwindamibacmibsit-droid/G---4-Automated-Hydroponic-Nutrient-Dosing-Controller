<?php

/*
|--------------------------------------------------------------------------
| HydroControl PostgreSQL Database Connection
|--------------------------------------------------------------------------
*/

$host = "localhost";
$port = "5432";
$dbname = "HydroControl";
$username = "postgres";
$password = "@liklikwindam";


try {

    $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

    $pdo = new PDO(
        $dsn,
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

} catch (PDOException $e) {

    http_response_code(500);

    die(
        json_encode([
            "success" => false,
            "message" => "Database connection failed."
        ])
    );
}