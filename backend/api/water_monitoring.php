<?php

/*
|--------------------------------------------------------------------------
| HydroControl - Water Monitoring API
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
    | GET CURRENT WATER SENSORS
    |--------------------------------------------------------------------------
    */

    $sensorQuery = "
        SELECT
            s.id,
            s.sensor_name,
            s.sensor_type,
            s.gpio,
            s.measurement_unit,
            s.status AS sensor_status,
            sr.reading_value,
            sr.reading_status,
            sr.recorded_at
        FROM sensors s

        LEFT JOIN LATERAL (
            SELECT
                reading_value,
                reading_status,
                recorded_at
            FROM sensor_readings
            WHERE sensor_id = s.id
            ORDER BY recorded_at DESC
            LIMIT 1
        ) sr ON TRUE

        WHERE s.sensor_type IN (
            'water_level',
            'temperature',
            'flow'
        )

        ORDER BY
            CASE s.sensor_type
                WHEN 'water_level' THEN 1
                WHEN 'temperature' THEN 2
                WHEN 'flow' THEN 3
                ELSE 4
            END
    ";

    $sensorStatement = $pdo->query($sensorQuery);

    $sensorRows = $sensorStatement->fetchAll();


    /*
    |--------------------------------------------------------------------------
    | FORMAT CURRENT SENSOR DATA
    |--------------------------------------------------------------------------
    */

    $waterLevel = null;
    $temperature = null;
    $flowRate = null;

    $sensors = [];

    foreach ($sensorRows as $sensor) {

        $type = $sensor["sensor_type"];

        $value = $sensor["reading_value"] !== null
            ? (float) $sensor["reading_value"]
            : null;


        $sensorData = [
            "id" => (int) $sensor["id"],

            "name" => $sensor["sensor_name"],

            "type" => $type,

            "gpio" => $sensor["gpio"],

            "unit" => $sensor["measurement_unit"],

            "value" => $value,

            "sensor_status" => $sensor["sensor_status"],

            "reading_status" =>
                $sensor["reading_status"] ?? "unknown",

            "recorded_at" => $sensor["recorded_at"]
        ];


        $sensors[$type] = $sensorData;


        /*
        |--------------------------------------------------------------------------
        | SAVE CURRENT VALUES
        |--------------------------------------------------------------------------
        */

        if ($type === "water_level") {

            $waterLevel = $value;

        }

        if ($type === "temperature") {

            $temperature = $value;

        }

        if ($type === "flow") {

            $flowRate = $value;

        }
    }


    /*
    |--------------------------------------------------------------------------
    | SYSTEM SETTINGS
    |--------------------------------------------------------------------------
    */

    $settingsQuery = "
        SELECT
            tank_capacity_liters,
            low_water_alert_liters,
            system_enabled
        FROM system_settings
        ORDER BY id DESC
        LIMIT 1
    ";

    $settingsStatement = $pdo->query($settingsQuery);

    $settings = $settingsStatement->fetch();


    if (!$settings) {

        $settings = [
            "tank_capacity_liters" => 500,
            "low_water_alert_liters" => 150,
            "system_enabled" => true
        ];
    }


    $tankCapacity =
        (float) $settings["tank_capacity_liters"];

    $lowWaterAlert =
        (float) $settings["low_water_alert_liters"];


    /*
    |--------------------------------------------------------------------------
    | CALCULATE WATER LITERS
    |--------------------------------------------------------------------------
    */

    if ($waterLevel !== null) {

        $waterLiters = round(
            ($waterLevel / 100) * $tankCapacity,
            1
        );

    } else {

        $waterLiters = null;
    }


    /*
    |--------------------------------------------------------------------------
    | WATER STATUS
    |--------------------------------------------------------------------------
    */

    if ($waterLevel === null) {

        $waterStatus = "Unknown";

    } elseif ($waterLiters <= $lowWaterAlert) {

        $waterStatus = "Critical";

    } elseif ($waterLiters <= ($lowWaterAlert * 1.5)) {

        $waterStatus = "Warning";

    } else {

        $waterStatus = "Normal";
    }


    /*
    |--------------------------------------------------------------------------
    | TEMPERATURE STATUS
    |--------------------------------------------------------------------------
    */

    if ($temperature === null) {

        $temperatureStatus = "Unknown";

    } elseif (
        $temperature >= 20 &&
        $temperature <= 28
    ) {

        $temperatureStatus = "Normal";

    } else {

        $temperatureStatus = "Warning";
    }


    /*
    |--------------------------------------------------------------------------
    | FLOW STATUS
    |--------------------------------------------------------------------------
    */

    if ($flowRate === null) {

        $flowStatus = "Unknown";

    } elseif ($flowRate >= 1) {

        $flowStatus = "Normal";

    } else {

        $flowStatus = "Warning";
    }


    /*
    |--------------------------------------------------------------------------
    | WATER QUALITY
    |--------------------------------------------------------------------------
    */

    $qualityScore = 0;

    if ($waterStatus === "Normal") {
        $qualityScore++;
    }

    if ($temperatureStatus === "Normal") {
        $qualityScore++;
    }

    if ($flowStatus === "Normal") {
        $qualityScore++;
    }


    if ($qualityScore === 3) {

        $quality = "GOOD";

        $qualityCondition = "Excellent";

    } elseif ($qualityScore >= 2) {

        $quality = "FAIR";

        $qualityCondition = "Good";

    } else {

        $quality = "CHECK";

        $qualityCondition = "Needs attention";
    }


    /*
    |--------------------------------------------------------------------------
    | SENSOR HISTORY
    |--------------------------------------------------------------------------
    |
    | We retrieve the latest readings from each water-related sensor
    | and combine them into one history table.
    |
    */

    $historyQuery = "
        SELECT
            sr.recorded_at,

            MAX(
                CASE
                    WHEN s.sensor_type = 'water_level'
                    THEN sr.reading_value
                END
            ) AS water_level,

            MAX(
                CASE
                    WHEN s.sensor_type = 'temperature'
                    THEN sr.reading_value
                END
            ) AS temperature,

            MAX(
                CASE
                    WHEN s.sensor_type = 'flow'
                    THEN sr.reading_value
                END
            ) AS flow_rate

        FROM sensor_readings sr

        INNER JOIN sensors s
            ON s.id = sr.sensor_id

        WHERE s.sensor_type IN (
            'water_level',
            'temperature',
            'flow'
        )

        GROUP BY sr.recorded_at

        ORDER BY sr.recorded_at DESC

        LIMIT 5
    ";

    $historyStatement = $pdo->query($historyQuery);

    $historyRows = $historyStatement->fetchAll();


    /*
    |--------------------------------------------------------------------------
    | FORMAT HISTORY
    |--------------------------------------------------------------------------
    */

    $readings = [];

    foreach ($historyRows as $reading) {

        $level = $reading["water_level"] !== null
            ? (float) $reading["water_level"]
            : null;

        $temp = $reading["temperature"] !== null
            ? (float) $reading["temperature"]
            : null;

        $flow = $reading["flow_rate"] !== null
            ? (float) $reading["flow_rate"]
            : null;


        /*
        |--------------------------------------------------------------------------
        | HISTORY STATUS
        |--------------------------------------------------------------------------
        */

        $historyStatus = "Normal";


        if (
            $level !== null &&
            $level < 30
        ) {

            $historyStatus = "Warning";
        }


        if (
            $temp !== null &&
            (
                $temp < 20 ||
                $temp > 28
            )
        ) {

            $historyStatus = "Warning";
        }


        if (
            $flow !== null &&
            $flow < 1
        ) {

            $historyStatus = "Warning";
        }


        $readings[] = [

            "time" => date(
                "h:i A",
                strtotime($reading["recorded_at"])
            ),

            "datetime" =>
                $reading["recorded_at"],

            "level" =>
                $level !== null
                    ? $level . "%"
                    : "--",

            "level_value" =>
                $level,

            "temperature" =>
                $temp !== null
                    ? $temp . "°C"
                    : "--",

            "temperature_value" =>
                $temp,

            "flow" =>
                $flow !== null
                    ? $flow . " L/min"
                    : "--",

            "flow_value" =>
                $flow,

            "status" =>
                $historyStatus
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | SENSOR STATUS
    |--------------------------------------------------------------------------
    */

    $sensorStatusQuery = "
        SELECT
            id,
            sensor_name,
            sensor_type,
            gpio,
            measurement_unit,
            status
        FROM sensors

        ORDER BY
            CASE sensor_type
                WHEN 'water_level' THEN 1
                WHEN 'temperature' THEN 2
                WHEN 'flow' THEN 3
                ELSE 4
            END
    ";

    $sensorStatusStatement =
        $pdo->query($sensorStatusQuery);

    $sensorStatusRows =
        $sensorStatusStatement->fetchAll();


    $sensorStatus = [];

    foreach ($sensorStatusRows as $sensor) {

        $sensorStatus[] = [

            "id" =>
                (int) $sensor["id"],

            "name" =>
                $sensor["sensor_name"],

            "type" =>
                $sensor["sensor_type"],

            "gpio" =>
                $sensor["gpio"],

            "unit" =>
                $sensor["measurement_unit"],

            "status" =>
                $sensor["status"]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | ESP32 DEVICE STATUS
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

    $deviceStatement =
        $pdo->query($deviceQuery);

    $device =
        $deviceStatement->fetch();


    /*
    |--------------------------------------------------------------------------
    | TODAY'S AVERAGE FLOW
    |--------------------------------------------------------------------------
    */

    $averageFlowQuery = "
        SELECT
            AVG(sr.reading_value) AS average_flow
        FROM sensor_readings sr

        INNER JOIN sensors s
            ON s.id = sr.sensor_id

        WHERE s.sensor_type = 'flow'

        AND sr.recorded_at >= CURRENT_DATE
    ";

    $averageFlowStatement =
        $pdo->query($averageFlowQuery);

    $averageFlow =
        $averageFlowStatement->fetch();


    $todayAverageFlow =
        $averageFlow["average_flow"] !== null
            ? round(
                (float) $averageFlow["average_flow"],
                2
            )
            : null;


    /*
    |--------------------------------------------------------------------------
    | LAST WATER LEVEL CHANGE
    |--------------------------------------------------------------------------
    */

    $changeQuery = "
        SELECT
            sr.reading_value
        FROM sensor_readings sr

        INNER JOIN sensors s
            ON s.id = sr.sensor_id

        WHERE s.sensor_type = 'water_level'

        ORDER BY sr.recorded_at DESC

        LIMIT 2
    ";

    $changeStatement =
        $pdo->query($changeQuery);

    $changeRows =
        $changeStatement->fetchAll();


    $lastChange = 0;


    if (count($changeRows) >= 2) {

        $current =
            (float) $changeRows[0]["reading_value"];

        $previous =
            (float) $changeRows[1]["reading_value"];

        $lastChange =
            round(
                $current - $previous,
                1
            );
    }


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    echo json_encode(

        [

            "success" => true,

            "data" => [

                /*
                |--------------------------------------------------------------------------
                | CURRENT READINGS
                |--------------------------------------------------------------------------
                */

                "current" => [

                    "water_level" => $waterLevel,

                    "water_liters" => $waterLiters,

                    "temperature" => $temperature,

                    "flow_rate" => $flowRate

                ],


                /*
                |--------------------------------------------------------------------------
                | WATER LEVEL
                |--------------------------------------------------------------------------
                */

                "water" => [

                    "level" =>
                        $waterLevel,

                    "percentage" =>
                        $waterLevel,

                    "liters" =>
                        $waterLiters,

                    "capacity" =>
                        $tankCapacity,

                    "low_alert" =>
                        $lowWaterAlert,

                    "status" =>
                        $waterStatus,

                    "last_change" =>
                        $lastChange
                ],


                /*
                |--------------------------------------------------------------------------
                | TEMPERATURE
                |--------------------------------------------------------------------------
                */

                "temperature" => [

                    "value" =>
                        $temperature,

                    "unit" =>
                        "°C",

                    "ideal_min" =>
                        20,

                    "ideal_max" =>
                        28,

                    "status" =>
                        $temperatureStatus
                ],


                /*
                |--------------------------------------------------------------------------
                | FLOW
                |--------------------------------------------------------------------------
                */

                "flow" => [

                    "value" =>
                        $flowRate,

                    "unit" =>
                        "L/min",

                    "today_average" =>
                        $todayAverageFlow,

                    "status" =>
                        $flowStatus
                ],


                /*
                |--------------------------------------------------------------------------
                | QUALITY
                |--------------------------------------------------------------------------
                */

                "quality" => [

                    "value" =>
                        $quality,

                    "condition" =>
                        $qualityCondition,

                    "score" =>
                        $qualityScore,

                    "maximum_score" =>
                        3
                ],


                /*
                |--------------------------------------------------------------------------
                | SENSOR STATUS
                |--------------------------------------------------------------------------
                */

                "sensors" =>
                    $sensorStatus,


                /*
                |--------------------------------------------------------------------------
                | SENSOR COUNT
                |--------------------------------------------------------------------------
                */

                "sensor_count" => [

                    "total" =>
                        count($sensorStatus),

                    "online" =>
                        count(
                            array_filter(
                                $sensorStatus,
                                function ($sensor) {
                                    return $sensor["status"]
                                        === "online";
                                }
                            )
                        )
                ],


                /*
                |--------------------------------------------------------------------------
                | ESP32
                |--------------------------------------------------------------------------
                */

                "device" =>
                    $device
                        ? [

                            "id" =>
                                (int) $device["id"],

                            "name" =>
                                $device["device_name"],

                            "type" =>
                                $device["device_type"],

                            "uid" =>
                                $device["device_uid"],

                            "firmware" =>
                                $device["firmware_version"],

                            "status" =>
                                $device["status"],

                            "last_seen" =>
                                $device["last_seen"]

                        ]
                        : null,


                /*
                |--------------------------------------------------------------------------
                | RECENT READINGS
                |--------------------------------------------------------------------------
                */

                "readings" =>
                    $readings,


                /*
                |--------------------------------------------------------------------------
                | SYSTEM
                |--------------------------------------------------------------------------
                */

                "system" => [

                    "enabled" =>
                        (bool) $settings["system_enabled"],

                    "status" =>
                        $device &&
                        $device["status"] === "online"
                            ? "online"
                            : "offline"
                ]
            ]
        ],

        JSON_PRETTY_PRINT
    );


} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode(

        [

            "success" => false,

            "message" =>
                "Unable to retrieve water monitoring data.",

            "error" =>
                $e->getMessage()
        ],

        JSON_PRETTY_PRINT
    );

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode(

        [

            "success" => false,

            "message" =>
                "Unexpected server error.",

            "error" =>
                $e->getMessage()
        ],

        JSON_PRETTY_PRINT
    );
}