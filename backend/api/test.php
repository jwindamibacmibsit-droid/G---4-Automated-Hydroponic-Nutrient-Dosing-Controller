<?php
// Suppress display of PHP errors so HTML doesn't break JSON responses
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// 1. Check if database connection file exists
$connPath = __DIR__ . "/../configure/connection.php";
if (!file_exists($connPath)) {
    die("ERROR: Connection file not found at " . realpath(__DIR__ . "/../configure/connection.php"));
}

require_once $connPath;

// 2. Check connection variable
if (!isset($dsn) || !$dsn) {
    die("ERROR: \$dsn variable is null or undefined. Check connection.php variable name.");
}

// 3. Test PostgreSQL Query
$query = "SELECT * FROM sensor_logs ORDER BY recorded_at DESC LIMIT 10";
$result = pg_query($dsn, $query);

if (!$result) {
    die("PGSQL QUERY ERROR: " . pg_last_error($dsn));
}

$data = pg_fetch_all($result) ?: [];

header("Content-Type: application/json; charset=UTF-8");
echo json_encode($data);

try {

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $ph = $data['ph_level'] ?? null;
        $water = $data['water_level'] ?? null;
        $relay = $data['solenoid_status'] ?? 'OFF';

        if ($ph !== null && $water !== null) {
            $query = "INSERT INTO sensor_logs (ph_level, water_level, solenoid_status) VALUES ($1, $2, $3)";
            $result = pg_query_params($dsn, $query, array($ph, $water, $relay));

            if ($result) {
                echo json_encode(["status" => "success", "message" => "Data logged"]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => pg_last_error($dsn)]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid payload"]);
        }
    } 
    elseif ($method === 'GET') {
        $query = "SELECT * FROM sensor_logs ORDER BY recorded_at DESC LIMIT 10";
        $result = pg_query($dsn, $query);

        if (!$result) {
            throw new Exception(pg_last_error($dsn));
        }

        $data = pg_fetch_all($result) ?: [];
        echo json_encode($data);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>