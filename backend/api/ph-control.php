<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../configure/connection.php";

try {

    /*
    |--------------------------------------------------------------------------
    | DEVICE
    |--------------------------------------------------------------------------
    */

    $deviceUid = $_GET["device_uid"] ?? null;

    if (!$deviceUid) {
        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        $deviceUid = $input["device_uid"] ?? "ESP32-HYDRO-001";
    }

    /*
    |--------------------------------------------------------------------------
    | GET DEVICE
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            device_name,
            device_type,
            device_uid,
            firmware_version,
            status,
            last_seen
        FROM devices
        WHERE device_uid = :device_uid
        LIMIT 1
    ");

    $stmt->execute([
        ":device_uid" => $deviceUid
    ]);

    $device = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$device) {

        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "ESP32 device not found."
        ]);

        exit;
    }

    $deviceId = (int) $device["id"];

    /*
    |--------------------------------------------------------------------------
    | POST COMMANDS
    |--------------------------------------------------------------------------
    */

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $input = json_decode(
            file_get_contents("php://input"),
            true
        );

        if (!is_array($input)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Invalid JSON request."
            ]);

            exit;
        }

        $action = $input["action"] ?? "";

        /*
        |--------------------------------------------------------------------------
        | RELAY COMMAND
        |--------------------------------------------------------------------------
        */

        if ($action === "relay") {

            $pump = $input["pump"] ?? "";
            $state = !empty($input["state"]);

            $allowedPumps = [
                "ph_up",
                "ph_down"
            ];

            if (!in_array($pump, $allowedPumps, true)) {

                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Invalid pump."
                ]);

                exit;
            }

            /*
            |--------------------------------------------------------------------------
            | Store relay command
            |--------------------------------------------------------------------------
            |
            | This endpoint accepts the command.
            |
            | Your ESP32 should receive/process the command and report
            | its actual relay state back to the backend.
            |
            */

            echo json_encode([
                "success" => true,
                "message" => "Relay command accepted.",
                "data" => [
                    "device_uid" => $deviceUid,
                    "pump" => $pump,
                    "state" => $state
                ]
            ]);

            exit;
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO / MANUAL MODE
        |--------------------------------------------------------------------------
        */

        if ($action === "mode") {

            $autoMode = !empty($input["auto_mode"]);

            echo json_encode([
                "success" => true,
                "message" => $autoMode
                    ? "Automatic mode enabled."
                    : "Manual mode enabled.",
                "data" => [
                    "auto_mode" => $autoMode
                ]
            ]);

            exit;
        }

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Unknown action."
        ]);

        exit;
    }

    /*
    |--------------------------------------------------------------------------
    | LATEST PH SENSOR READING
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            sr.reading_value,
            sr.reading_status,
            sr.recorded_at
        FROM sensor_readings sr
        INNER JOIN sensors s
            ON s.id = sr.sensor_id
        WHERE
            s.device_id = :device_id
            AND s.sensor_type = 'ph'
        ORDER BY sr.recorded_at DESC
        LIMIT 1
    ");

    $stmt->execute([
        ":device_id" => $deviceId
    ]);

    $phReading = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($phReading) {

        $currentPh = (float) $phReading["reading_value"];

        $phStatus = $phReading["reading_status"];

        $phRecordedAt = $phReading["recorded_at"];

    } else {

        $currentPh = 0;

        $phStatus = "unknown";

        $phRecordedAt = null;
    }

    /*
    |--------------------------------------------------------------------------
    | LATEST WATER LEVEL
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            sr.reading_value,
            sr.reading_status,
            sr.recorded_at
        FROM sensor_readings sr
        INNER JOIN sensors s
            ON s.id = sr.sensor_id
        WHERE
            s.device_id = :device_id
            AND s.sensor_type = 'water_level'
        ORDER BY sr.recorded_at DESC
        LIMIT 1
    ");

    $stmt->execute([
        ":device_id" => $deviceId
    ]);

    $waterReading = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($waterReading) {

        $waterPercentage =
            (float) $waterReading["reading_value"];

        $waterStatus =
            $waterReading["reading_status"];

        $waterRecordedAt =
            $waterReading["recorded_at"];

    } else {

        $waterPercentage = 0;

        $waterStatus = "unknown";

        $waterRecordedAt = null;
    }

    /*
    |--------------------------------------------------------------------------
    | PH HISTORY
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT
            id,
            ph_value,
            action,
            amount_ml,
            status,
            created_at
        FROM ph_history
        ORDER BY created_at DESC
        LIMIT 20
    ");

    $stmt->execute();

    $phHistoryRows =
        $stmt->fetchAll(PDO::FETCH_ASSOC);

    $phHistory = [];

    foreach ($phHistoryRows as $row) {

        /*
        |--------------------------------------------------------------------------
        | ACTION DISPLAY
        |--------------------------------------------------------------------------
        */

        switch ($row["action"]) {

            case "ph_up":
                $actionText = "pH Up";
                break;

            case "ph_down":
                $actionText = "pH Down";
                break;

            default:
                $actionText = "Stable";
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | AMOUNT
        |--------------------------------------------------------------------------
        */

        if ($row["amount_ml"] === null) {

            $amount = "—";

        } else {

            $amount =
                number_format(
                    (float) $row["amount_ml"],
                    2
                ) . " mL";
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        $status = ucfirst(
            $row["status"]
        );

        /*
        |--------------------------------------------------------------------------
        | TIME
        |--------------------------------------------------------------------------
        */

        $time = date(
            "h:i A",
            strtotime($row["created_at"])
        );

        /*
        |--------------------------------------------------------------------------
        | HISTORY OBJECT
        |--------------------------------------------------------------------------
        */

        $phHistory[] = [

            "id" =>
                (int) $row["id"],

            "time" =>
                $time,

            "ph" =>
                (float) $row["ph_value"],

            "action" =>
                $actionText,

            "action_code" =>
                $row["action"],

            "amount" =>
                $amount,

            "amount_ml" =>
                $row["amount_ml"] === null
                    ? null
                    : (float) $row["amount_ml"],

            "status" =>
                $status,

            "status_code" =>
                $row["status"],

            "created_at" =>
                $row["created_at"]
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PH STATUS
    |--------------------------------------------------------------------------
    */

    if ($currentPh <= 0) {

        $calculatedPhStatus = "unknown";

    } elseif ($currentPh < 5.8) {

        $calculatedPhStatus = "low";

    } elseif ($currentPh > 6.5) {

        $calculatedPhStatus = "high";

    } else {

        $calculatedPhStatus = "normal";
    }

    /*
    |--------------------------------------------------------------------------
    | DEVICE ONLINE CHECK
    |--------------------------------------------------------------------------
    */

    $deviceStatus = $device["status"];

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    echo json_encode([

        "success" => true,

        "data" => [

            /*
            |--------------------------------------------------------------------------
            | DEVICE
            |--------------------------------------------------------------------------
            */

            "device" => [

                "id" =>
                    $deviceId,

                "name" =>
                    $device["device_name"],

                "uid" =>
                    $device["device_uid"],

                "type" =>
                    $device["device_type"],

                "firmware" =>
                    $device["firmware_version"],

                "status" =>
                    $deviceStatus,

                "last_seen" =>
                    $device["last_seen"]
            ],

            /*
            |--------------------------------------------------------------------------
            | PH
            |--------------------------------------------------------------------------
            */

            "ph" => [

                "value" =>
                    $currentPh,

                "raw" =>
                    0,

                "status" =>
                    $calculatedPhStatus,

                "recorded_at" =>
                    $phRecordedAt
            ],

            /*
            |--------------------------------------------------------------------------
            | WATER
            |--------------------------------------------------------------------------
            */

            "water" => [

                "percentage" =>
                    $waterPercentage,

                "raw" =>
                    0,

                "status" =>
                    $waterStatus,

                "recorded_at" =>
                    $waterRecordedAt
            ],

            /*
            |--------------------------------------------------------------------------
            | RELAYS
            |--------------------------------------------------------------------------
            |
            | These remain false until you connect them to the actual
            | ESP32 relay-state storage/API.
            |
            */

            "relays" => [

                "ph_up" =>
                    false,

                "ph_down" =>
                    false,

                "nutrient_a" =>
                    false,

                "nutrient_b" =>
                    false
            ],

            /*
            |--------------------------------------------------------------------------
            | HISTORY
            |--------------------------------------------------------------------------
            */

            "history" =>
                $phHistory
        ]

    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Failed to load pH control data.",

        "error" =>
            $e->getMessage()

    ], JSON_PRETTY_PRINT);
}