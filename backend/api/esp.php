<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ], JSON_PRETTY_PRINT);
    exit;
}

require_once __DIR__ . "/../configure/connection.php";

try {

    /*
    |--------------------------------------------------------------------------
    | READ & DECODE JSON
    |--------------------------------------------------------------------------
    */

    $input = file_get_contents("php://input");

    if (!$input) {
        throw new Exception("No data received from ESP32.");
    }

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON: " . json_last_error_msg());
    }

    /*
    |--------------------------------------------------------------------------
    | RECEIVE ESP32 DATA
    |--------------------------------------------------------------------------
    */

    $deviceUid = trim($data["device_uid"] ?? "ESP32-HYDRO-001");
    $phRaw     = (int)($data["ph_raw"] ?? 0);
    $ph        = (float)($data["ph"] ?? 0);
    $waterRaw  = (int)($data["water_raw"] ?? 0);

    $phUp      = !empty($data["ph_up"]);
    $phDown    = !empty($data["ph_down"]);
    $nutrientA = !empty($data["nutrient_a"]);
    $nutrientB = !empty($data["nutrient_b"]);

    if ($deviceUid === "") {
        throw new Exception("Device UID is required.");
    }

    /*
    |--------------------------------------------------------------------------
    | DATA METRICS COMPUTATION
    |--------------------------------------------------------------------------
    */

    $waterPercentage = round(($waterRaw / 4095) * 100, 2);
    $waterPercentage = max(0, min(100, $waterPercentage));

    if ($ph <= 0) {
        $phStatus = "error";
    } elseif ($ph < 5.8 || $ph > 6.5) {
        $phStatus = "warning";
    } else {
        $phStatus = "normal";
    }

    if ($waterRaw < 1200) {
        $waterStatus = "critical";
    } elseif ($waterPercentage < 40) {
        $waterStatus = "warning";
    } else {
        $waterStatus = "normal";
    }

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION START
    |--------------------------------------------------------------------------
    */

    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | 1. DEVICE MANAGEMENT (MATCHES `last_seen_timestamp`)
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("SELECT id FROM devices WHERE device_uid = :device_uid LIMIT 1");
    $stmt->execute([":device_uid" => $deviceUid]);
    $device = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$device) {
        $stmt = $pdo->prepare("
            INSERT INTO devices (
                device_name,
                device_type,
                device_uid,
                firmware_version,
                status,
                last_seen,
                created_at,
                updated_at
            )
            VALUES (
                :device_name,
                'ESP32',
                :device_uid,
                '1.0.0',
                'online',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            RETURNING id
        ");

        $stmt->execute([
            ":device_name" => "HydroControl ESP32",
            ":device_uid" => $deviceUid
        ]);

        $deviceId = (int)$stmt->fetchColumn();
    } else {
        $deviceId = (int)$device["id"];

        $stmt = $pdo->prepare("
            UPDATE devices
            SET
                status = 'online',
                last_seen = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->execute([":id" => $deviceId]);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. pH SENSOR & READINGS
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT id FROM sensors
        WHERE device_id = :device_id AND sensor_type = 'ph'
        LIMIT 1
    ");
    $stmt->execute([":device_id" => $deviceId]);
    $phSensor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$phSensor) {
        $stmt = $pdo->prepare("
            INSERT INTO sensors (
                device_id,
                sensor_name,
                sensor_type,
                measurement_unit,
                min_value,
                max_value,
                status,
                created_at
            )
            VALUES (
                :device_id,
                'pH Sensor',
                'ph',
                'pH',
                5.8,
                6.5,
                'online',
                CURRENT_TIMESTAMP
            )
            RETURNING id
        ");
        $stmt->execute([":device_id" => $deviceId]);
        $phSensorId = (int)$stmt->fetchColumn();
    } else {
        $phSensorId = (int)$phSensor["id"];
    }

    // Insert pH Reading into sensor_readings
    $stmt = $pdo->prepare("
        INSERT INTO sensor_readings (
            sensor_id,
            reading_value,
            reading_status,
            recorded_at
        )
        VALUES (:sensor_id, :reading_value, :reading_status, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([
        ":sensor_id" => $phSensorId,
        ":reading_value" => $ph,
        ":reading_status" => $phStatus
    ]);

    /*
    |--------------------------------------------------------------------------
    | 3. WATER LEVEL SENSOR & READINGS
    |--------------------------------------------------------------------------
    */

    $stmt = $pdo->prepare("
        SELECT id FROM sensors
        WHERE device_id = :device_id AND sensor_type = 'water_level'
        LIMIT 1
    ");
    $stmt->execute([":device_id" => $deviceId]);
    $waterSensor = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$waterSensor) {
        $stmt = $pdo->prepare("
            INSERT INTO sensors (
                device_id,
                sensor_name,
                sensor_type,
                measurement_unit,
                min_value,
                max_value,
                status,
                created_at
            )
            VALUES (
                :device_id,
                'Water Level Sensor',
                'water_level',
                '%',
                40,
                100,
                'online',
                CURRENT_TIMESTAMP
            )
            RETURNING id
        ");
        $stmt->execute([":device_id" => $deviceId]);
        $waterSensorId = (int)$stmt->fetchColumn();
    } else {
        $waterSensorId = (int)$waterSensor["id"];
    }

    // Insert Water Level Reading into sensor_readings
    $stmt = $pdo->prepare("
        INSERT INTO sensor_readings (
            sensor_id,
            reading_value,
            reading_status,
            recorded_at
        )
        VALUES (:sensor_id, :reading_value, :reading_status, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([
        ":sensor_id" => $waterSensorId,
        ":reading_value" => $waterPercentage,
        ":reading_status" => $waterStatus
    ]);

    /*
    |--------------------------------------------------------------------------
    | 4. ACTIVITY LOGS
    |--------------------------------------------------------------------------
    */

    $relayActivities = [];
    if ($phUp)      $relayActivities[] = ["type" => "ph_adjusted", "msg" => "pH UP pump activated by ESP32."];
    if ($phDown)    $relayActivities[] = ["type" => "ph_adjusted", "msg" => "pH DOWN pump activated by ESP32."];
    if ($nutrientA) $relayActivities[] = ["type" => "nutrient_dosed", "msg" => "Nutrient A pump activated by ESP32."];
    if ($nutrientB) $relayActivities[] = ["type" => "nutrient_dosed", "msg" => "Nutrient B pump activated by ESP32."];
    if ($waterStatus === "critical") {
        $relayActivities[] = ["type" => "error", "msg" => "Critical water level detected. Dosing suspended."];
    }

    if (!empty($relayActivities)) {
        $stmt = $pdo->prepare("
            INSERT INTO activity_logs (
                device_id,
                activity_type,
                message,
                created_at
            )
            VALUES (:device_id, :activity_type, :message, CURRENT_TIMESTAMP)
        ");

        foreach ($relayActivities as $act) {
            $stmt->execute([
                ":device_id" => $deviceId,
                ":activity_type" => $act["type"],
                ":message" => $act["msg"]
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 5. pH HISTORY LOGS
    |--------------------------------------------------------------------------
    */

    $phAction = $phUp ? "ph_up" : ($phDown ? "ph_down" : "stable");
    $phHistoryStatus = ($phUp || $phDown) ? "adjusted" : $phStatus;

    $stmt = $pdo->prepare("
        INSERT INTO ph_history (
            ph_value,
            action,
            amount_ml,
            status,
            created_at
        )
        VALUES (:ph_value, :action, :amount_ml, :status, CURRENT_TIMESTAMP)
    ");

    $stmt->execute([
        ":ph_value" => $ph,
        ":action" => $phAction,
        ":amount_ml" => ($phUp || $phDown) ? 5.00 : 0.00,
        ":status" => $phHistoryStatus
    ]);

    /*
    |--------------------------------------------------------------------------
    | COMMIT & RESPONSE
    |--------------------------------------------------------------------------
    */

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "ESP32 data saved successfully.",
        "data" => [
            "device" => ["id" => $deviceId, "device_uid" => $deviceUid, "status" => "online"],
            "ph" => ["sensor_id" => $phSensorId, "raw" => $phRaw, "value" => $ph, "status" => $phStatus],
            "water" => ["sensor_id" => $waterSensorId, "raw" => $waterRaw, "percentage" => $waterPercentage, "status" => $waterStatus],
            "relays" => ["ph_up" => $phUp, "ph_down" => $phDown, "nutrient_a" => $nutrientA, "nutrient_b" => $nutrientB]
        ]
    ], JSON_PRETTY_PRINT);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to save ESP32 data.",
        "error" => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}