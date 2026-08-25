<?php

/*
|--------------------------------------------------------------------------
| HydroControl Dashboard API
|--------------------------------------------------------------------------
*/

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../configure/connection.php";

try {

    /*
    |--------------------------------------------------------------------------
    | DEVICE / ESP32
    |--------------------------------------------------------------------------
    */

    $deviceQuery = "
        SELECT
            id,
            device_name,
            device_type,
            device_uid,
            firmware_version,
            status,
            last_seen
        FROM devices
        ORDER BY id ASC
        LIMIT 1
    ";

    $deviceStatement = $pdo->query($deviceQuery);
    $device = $deviceStatement->fetch();


    /*
    |--------------------------------------------------------------------------
    | CURRENT SENSOR READINGS
    |--------------------------------------------------------------------------
    */

    $sensorQuery = "
        SELECT DISTINCT ON (s.sensor_type)
            s.id,
            s.sensor_name,
            s.sensor_type,
            s.measurement_unit,
            sr.reading_value,
            sr.reading_status,
            sr.recorded_at
        FROM sensors s

        LEFT JOIN sensor_readings sr
            ON sr.sensor_id = s.id

        ORDER BY
            s.sensor_type,
            sr.recorded_at DESC
    ";

    $sensorStatement = $pdo->query($sensorQuery);
    $sensorRows = $sensorStatement->fetchAll();


    /*
    |--------------------------------------------------------------------------
    | FORMAT SENSOR DATA
    |--------------------------------------------------------------------------
    */

    $sensors = [];

    foreach ($sensorRows as $sensor) {

        $sensors[$sensor["sensor_type"]] = [
            "id" => (int) $sensor["id"],
            "name" => $sensor["sensor_name"],
            "value" => $sensor["reading_value"] !== null
                ? (float) $sensor["reading_value"]
                : null,
            "unit" => $sensor["measurement_unit"],
            "status" => $sensor["reading_status"] ?? "unknown",
            "recorded_at" => $sensor["recorded_at"]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | WATER LEVEL
    |--------------------------------------------------------------------------
    */

    $waterLevel = $sensors["water_level"]["value"] ?? 0;

    $tankCapacity = 500;

    $waterLiters = round(
        ($waterLevel / 100) * $tankCapacity,
        1
    );

    if ($waterLevel >= 50) {

        $waterStatus = "normal";

    } elseif ($waterLevel >= 25) {

        $waterStatus = "warning";

    } else {

        $waterStatus = "critical";
    }


    /*
    |--------------------------------------------------------------------------
    | PH
    |--------------------------------------------------------------------------
    */

    $ph = $sensors["ph"]["value"] ?? null;

    $phSettingsQuery = "
        SELECT
            target_ph,
            minimum_ph,
            maximum_ph,
            auto_mode
        FROM ph_settings
        ORDER BY id DESC
        LIMIT 1
    ";

    $phSettingsStatement = $pdo->query($phSettingsQuery);
    $phSettings = $phSettingsStatement->fetch();

    if (!$phSettings) {

        $phSettings = [
            "target_ph" => 6.00,
            "minimum_ph" => 5.50,
            "maximum_ph" => 6.50,
            "auto_mode" => true
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | PH STATUS
    |--------------------------------------------------------------------------
    */

    if ($ph === null) {

        $phStatus = "unknown";

    } elseif (
        $ph >= (float) $phSettings["minimum_ph"] &&
        $ph <= (float) $phSettings["maximum_ph"]
    ) {

        $phStatus = "normal";

    } elseif (
        $ph >= ((float) $phSettings["minimum_ph"] - 0.5) &&
        $ph <= ((float) $phSettings["maximum_ph"] + 0.5)
    ) {

        $phStatus = "warning";

    } else {

        $phStatus = "critical";
    }


    /*
    |--------------------------------------------------------------------------
    | NUTRIENT / EC
    |--------------------------------------------------------------------------
    */

    $ec = $sensors["ec"]["value"] ?? null;

    $ecSettingsQuery = "
        SELECT
            target_ec,
            minimum_ec,
            maximum_ec,
            auto_mode
        FROM ec_settings
        ORDER BY id DESC
        LIMIT 1
    ";

    $ecSettingsStatement = $pdo->query($ecSettingsQuery);
    $ecSettings = $ecSettingsStatement->fetch();

    if (!$ecSettings) {

        $ecSettings = [
            "target_ec" => 1.800,
            "minimum_ec" => 1.200,
            "maximum_ec" => 2.400,
            "auto_mode" => true
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | NUTRIENT CONCENTRATION
    |
    | Your current React dashboard displays 820 ppm.
    | EC is also returned separately for the monitoring pages.
    |--------------------------------------------------------------------------
    */

    $nutrientPpm = $ec !== null
        ? round($ec * 445, 0)
        : null;


    /*
    |--------------------------------------------------------------------------
    | NUTRIENT TANKS
    |--------------------------------------------------------------------------
    */

    $nutrientQuery = "
        SELECT
            id,
            tank_name,
            nutrient_type,
            capacity_ml,
            remaining_ml,
            low_level_ml,
            status
        FROM nutrient_tanks
        ORDER BY nutrient_type
    ";

    $nutrientStatement = $pdo->query($nutrientQuery);
    $nutrientRows = $nutrientStatement->fetchAll();

    $nutrients = [];

    foreach ($nutrientRows as $nutrient) {

        $nutrients[] = [
            "id" => (int) $nutrient["id"],
            "name" => $nutrient["tank_name"],
            "type" => $nutrient["nutrient_type"],
            "capacity_ml" => (float) $nutrient["capacity_ml"],
            "remaining_ml" => (float) $nutrient["remaining_ml"],
            "low_level_ml" => (float) $nutrient["low_level_ml"],
            "status" => $nutrient["status"]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | PUMPS
    |--------------------------------------------------------------------------
    */

    $pumpQuery = "
        SELECT
            id,
            pump_name,
            pump_type,
            gpio,
            status,
            speed,
            flow_rate,
            runtime_seconds,
            power_watts
        FROM pumps
        ORDER BY id ASC
    ";

    $pumpStatement = $pdo->query($pumpQuery);
    $pumpRows = $pumpStatement->fetchAll();

    $pumps = [];

    foreach ($pumpRows as $pump) {

        $pumps[] = [
            "id" => (int) $pump["id"],
            "name" => $pump["pump_name"],
            "type" => $pump["pump_type"],
            "gpio" => $pump["gpio"],
            "status" => (bool) $pump["status"],
            "speed" => (float) $pump["speed"],
            "flow_rate" => (float) $pump["flow_rate"],
            "runtime_seconds" => (int) $pump["runtime_seconds"],
            "power_watts" => (float) $pump["power_watts"]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | SYSTEM SETTINGS
    |--------------------------------------------------------------------------
    */

    $systemQuery = "
        SELECT
            control_mode,
            system_name,
            timezone,
            low_water_alert_liters,
            tank_capacity_liters,
            system_enabled
        FROM system_settings
        ORDER BY id DESC
        LIMIT 1
    ";

    $systemStatement = $pdo->query($systemQuery);
    $system = $systemStatement->fetch();

    if (!$system) {

        $system = [
            "control_mode" => "auto",
            "system_name" => "HydroControl",
            "timezone" => "Asia/Manila",
            "low_water_alert_liters" => 150,
            "tank_capacity_liters" => 500,
            "system_enabled" => true
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | RECENT ACTIVITY
    |--------------------------------------------------------------------------
    */

    $activityQuery = "
        SELECT
            al.id,
            al.activity_type,
            al.message,
            al.created_at,
            u.name AS user_name
        FROM activity_logs al

        LEFT JOIN users u
            ON u.id = al.user_id

        ORDER BY al.created_at DESC

        LIMIT 5
    ";

    $activityStatement = $pdo->query($activityQuery);
    $activityRows = $activityStatement->fetchAll();

    $activities = [];

    foreach ($activityRows as $activity) {

        $activities[] = [
            "id" => (int) $activity["id"],
            "type" => $activity["activity_type"],
            "message" => $activity["message"],
            "user" => $activity["user_name"],
            "created_at" => $activity["created_at"]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | SYSTEM STATUS
    |--------------------------------------------------------------------------
    */

    $deviceOnline = false;

    if ($device) {

        $deviceOnline =
            $device["status"] === "online";
    }

    $systemOnline =
        $deviceOnline &&
        (bool) $system["system_enabled"];


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    echo json_encode(
        [
            "success" => true,

            "data" => [

                "system" => [
                    "name" => $system["system_name"],
                    "enabled" => (bool) $system["system_enabled"],
                    "control_mode" => $system["control_mode"],
                    "timezone" => $system["timezone"],
                    "status" => $systemOnline
                        ? "online"
                        : "offline"
                ],

                "device" => $device
                    ? [
                        "id" => (int) $device["id"],
                        "name" => $device["device_name"],
                        "type" => $device["device_type"],
                        "uid" => $device["device_uid"],
                        "firmware" => $device["firmware_version"],
                        "status" => $device["status"],
                        "last_seen" => $device["last_seen"]
                    ]
                    : null,

                "water" => [
                    "percentage" => round($waterLevel, 1),
                    "liters" => $waterLiters,
                    "capacity_liters" => (float)
                        $system["tank_capacity_liters"],
                    "status" => $waterStatus
                ],

                "ph" => [
                    "value" => $ph,
                    "target" => (float)
                        $phSettings["target_ph"],
                    "minimum" => (float)
                        $phSettings["minimum_ph"],
                    "maximum" => (float)
                        $phSettings["maximum_ph"],
                    "status" => $phStatus,
                    "auto_mode" => (bool)
                        $phSettings["auto_mode"]
                ],

                "nutrient" => [
                    "ppm" => $nutrientPpm,
                    "ec" => $ec,
                    "target_ec" => (float)
                        $ecSettings["target_ec"],
                    "minimum_ec" => (float)
                        $ecSettings["minimum_ec"],
                    "maximum_ec" => (float)
                        $ecSettings["maximum_ec"],
                    "status" => "normal",
                    "auto_mode" => (bool)
                        $ecSettings["auto_mode"],
                    "tanks" => $nutrients
                ],

                "sensors" => $sensors,

                "pumps" => $pumps,

                "automation" => [
                    "enabled" => (bool)
                        $system["system_enabled"],
                    "mode" => $system["control_mode"],
                    "active" =>
                        $system["control_mode"] === "auto",
                    "message" =>
                        $system["control_mode"] === "auto"
                            ? "Automatic Control Active"
                            : "Manual Control Active"
                ],

                "activity" => $activities
            ]
        ],
        JSON_PRETTY_PRINT
    );

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "message" => "Unable to load dashboard data.",
            "error" => $e->getMessage()
        ],
        JSON_PRETTY_PRINT
    );

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode(
        [
            "success" => false,
            "message" => "Unexpected server error.",
            "error" => $e->getMessage()
        ],
        JSON_PRETTY_PRINT
    );
}