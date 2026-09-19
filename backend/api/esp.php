<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


// =====================================================
// OPTIONS REQUEST
// =====================================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}


// =====================================================
// ONLY POST REQUESTS
// =====================================================

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ], JSON_PRETTY_PRINT);

    exit;
}


// =====================================================
// DATABASE CONNECTION
// =====================================================

require_once __DIR__ . "/../configure/connection.php";


try {

    // =================================================
    // READ JSON DATA
    // =================================================

    $input = file_get_contents("php://input");

    if (!$input) {
        throw new Exception("No data received from ESP32.");
    }

    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception(
            "Invalid JSON: " . json_last_error_msg()
        );
    }


    // =================================================
    // DETERMINE REQUEST TYPE
    // =================================================

    $type = trim($data["type"] ?? "");

    if ($type === "") {
        throw new Exception("Request type is required.");
    }


    // =================================================
    // DEVICE ID
    // =================================================

    $deviceCode = trim(
        $data["device_id"] ?? "ESP32-HYDRO-001"
    );

    if ($deviceCode === "") {
        throw new Exception("Device ID is required.");
    }


    // =================================================
    // START DATABASE TRANSACTION
    // =================================================

    $pdo->beginTransaction();


    // =================================================
    // DEVICE MANAGEMENT
    // =================================================

    $stmt = $pdo->prepare("
        SELECT id
        FROM devices
        WHERE device_code = :device_code
        LIMIT 1
    ");

    $stmt->execute([
        ":device_code" => $deviceCode
    ]);

    $device = $stmt->fetch(PDO::FETCH_ASSOC);


    // -------------------------------------------------
    // CREATE DEVICE IF IT DOES NOT EXIST
    // -------------------------------------------------

    if (!$device) {

        $stmt = $pdo->prepare("
            INSERT INTO devices (
                device_name,
                device_code,
                location,
                status,
                last_seen,
                created_at
            )
            VALUES (
                :device_name,
                :device_code,
                :location,
                'online',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            RETURNING id
        ");

        $stmt->execute([
            ":device_name" => "HydroControl ESP32",
            ":device_code" => $deviceCode,
            ":location" => "Hydroponic System"
        ]);

        $deviceId = (int)$stmt->fetchColumn();

    }

    // -------------------------------------------------
    // UPDATE EXISTING DEVICE
    // -------------------------------------------------

    else {

        $deviceId = (int)$device["id"];

        $stmt = $pdo->prepare("
            UPDATE devices
            SET
                status = 'online',
                last_seen = CURRENT_TIMESTAMP
            WHERE id = :id
        ");

        $stmt->execute([
            ":id" => $deviceId
        ]);
    }


    // =================================================
    // 1. SENSOR READING
    // =================================================

    if ($type === "sensor_reading") {

        // ---------------------------------------------
        // RECEIVE SENSOR DATA
        // ---------------------------------------------

        $phValue = isset($data["ph_value"])
            ? (float)$data["ph_value"]
            : null;

        $waterLevel = isset($data["water_level"])
            ? (float)$data["water_level"]
            : null;

        $temperature = isset($data["temperature"])
            ? (float)$data["temperature"]
            : null;

        $nutrientA = isset($data["nutrient_a"])
            ? (float)$data["nutrient_a"]
            : null;

        $nutrientB = isset($data["nutrient_b"])
            ? (float)$data["nutrient_b"]
            : null;


        // ---------------------------------------------
        // VALIDATE SENSOR DATA
        // ---------------------------------------------

        if ($phValue === null && $waterLevel === null) {

            throw new Exception(
                "At least one sensor value is required."
            );
        }


        // ---------------------------------------------
        // INSERT SENSOR READING
        // ---------------------------------------------

        $stmt = $pdo->prepare("
            INSERT INTO sensor_reading (
                device_id,
                ph_value,
                water_level,
                temperature,
                nutrient_a,
                nutrient_b,
                recorded_at
            )
            VALUES (
                :device_id,
                :ph_value,
                :water_level,
                :temperature,
                :nutrient_a,
                :nutrient_b,
                CURRENT_TIMESTAMP
            )
            RETURNING id
        ");


        $stmt->execute([

            ":device_id" => $deviceId,

            ":ph_value" => $phValue,

            ":water_level" => $waterLevel,

            ":temperature" => $temperature,

            ":nutrient_a" => $nutrientA,

            ":nutrient_b" => $nutrientB
        ]);


        $readingId = (int)$stmt->fetchColumn();


        // ---------------------------------------------
        // COMMIT
        // ---------------------------------------------

        $pdo->commit();


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        http_response_code(200);

        echo json_encode([

            "success" => true,

            "message" =>
                "Sensor reading saved successfully.",

            "data" => [

                "reading_id" => $readingId,

                "device_id" => $deviceId,

                "device_code" => $deviceCode,

                "ph_value" => $phValue,

                "water_level" => $waterLevel,

                "temperature" => $temperature,

                "nutrient_a" => $nutrientA,

                "nutrient_b" => $nutrientB
            ]

        ], JSON_PRETTY_PRINT);

        exit;
    }


    // =================================================
    // 2. DOSING LOG
    // =================================================

    if ($type === "dosing_log") {

        // ---------------------------------------------
        // RECEIVE DOSING DATA
        // ---------------------------------------------

        $dosingType = trim(
            $data["dosing_type"] ?? ""
        );

        $amountML = isset($data["amount_ml"])
            ? (float)$data["amount_ml"]
            : 0;

        $durationMS = isset($data["duration_ms"])
            ? (int)$data["duration_ms"]
            : 0;

        $triggerType = trim(
            $data["trigger_type"] ?? "automatic"
        );

        $targetParameter = trim(
            $data["target_parameter"] ?? ""
        );

        $beforeValue = isset($data["before_value"])
            ? (float)$data["before_value"]
            : null;

        $afterValue = isset($data["after_value"])
            ? (float)$data["after_value"]
            : null;

        $status = trim(
            $data["status"] ?? "completed"
        );


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if ($dosingType === "") {

            throw new Exception(
                "Dosing type is required."
            );
        }


        if ($targetParameter === "") {

            throw new Exception(
                "Target parameter is required."
            );
        }


        if ($amountML < 0) {

            throw new Exception(
                "Amount cannot be negative."
            );
        }


        if ($durationMS < 0) {

            throw new Exception(
                "Duration cannot be negative."
            );
        }


        // ---------------------------------------------
        // INSERT DOSING LOG
        // ---------------------------------------------

        $stmt = $pdo->prepare("
            INSERT INTO dosing_log (

                device_id,

                dosing_type,

                amount_ml,

                duration_ms,

                trigger_type,

                target_parameter,

                before_value,

                after_value,

                status,

                timestamp

            )
            VALUES (

                :device_id,

                :dosing_type,

                :amount_ml,

                :duration_ms,

                :trigger_type,

                :target_parameter,

                :before_value,

                :after_value,

                :status,

                CURRENT_TIMESTAMP

            )

            RETURNING id
        ");


        $stmt->execute([

            ":device_id" =>
                $deviceId,

            ":dosing_type" =>
                $dosingType,

            ":amount_ml" =>
                $amountML,

            ":duration_ms" =>
                $durationMS,

            ":trigger_type" =>
                $triggerType,

            ":target_parameter" =>
                $targetParameter,

            ":before_value" =>
                $beforeValue,

            ":after_value" =>
                $afterValue,

            ":status" =>
                $status
        ]);


        $dosingLogId =
            (int)$stmt->fetchColumn();


        // ---------------------------------------------
        // COMMIT
        // ---------------------------------------------

        $pdo->commit();


        // ---------------------------------------------
        // RESPONSE
        // ---------------------------------------------

        http_response_code(200);

        echo json_encode([

            "success" => true,

            "message" =>
                "Dosing log saved successfully.",

            "data" => [

                "dosing_log_id" =>
                    $dosingLogId,

                "device_id" =>
                    $deviceId,

                "device_code" =>
                    $deviceCode,

                "dosing_type" =>
                    $dosingType,

                "amount_ml" =>
                    $amountML,

                "duration_ms" =>
                    $durationMS,

                "trigger_type" =>
                    $triggerType,

                "target_parameter" =>
                    $targetParameter,

                "before_value" =>
                    $beforeValue,

                "after_value" =>
                    $afterValue,

                "status" =>
                    $status
            ]

        ], JSON_PRETTY_PRINT);

        exit;
    }


    // =================================================
    // UNKNOWN REQUEST TYPE
    // =================================================

    throw new Exception(
        "Invalid request type. Use 'sensor_reading' or 'dosing_log'."
    );


} catch (Throwable $e) {

    // =================================================
    // ROLLBACK
    // =================================================

    if (
        isset($pdo) &&
        $pdo instanceof PDO &&
        $pdo->inTransaction()
    ) {

        $pdo->rollBack();
    }


    // =================================================
    // ERROR RESPONSE
    // =================================================

    http_response_code(500);

    echo json_encode([

        "success" => false,

        "message" =>
            "Failed to process ESP32 data.",

        "error" =>
            $e->getMessage()

    ], JSON_PRETTY_PRINT);
}