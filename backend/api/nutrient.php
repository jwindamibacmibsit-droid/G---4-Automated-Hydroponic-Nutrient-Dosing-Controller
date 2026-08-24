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

const DEFAULT_DEVICE_UID = "ESP32-HYDRO-001";

const TARGET_PH = 6.0;
const MIN_PH = 5.8;
const MAX_PH = 6.5;

function sendResponse(
    bool $success,
    string $message,
    $data = null,
    int $statusCode = 200
) {
    http_response_code($statusCode);

    echo json_encode(
        [
            "success" => $success,
            "message" => $message,
            "data" => $data
        ],
        JSON_PRETTY_PRINT
    );

    exit;
}

try {

    /*
    |--------------------------------------------------------------------------
    | GET
    |--------------------------------------------------------------------------
    */

    if ($_SERVER["REQUEST_METHOD"] === "GET") {

        $deviceUid =
            $_GET["device_uid"]
            ?? DEFAULT_DEVICE_UID;

        /*
        |--------------------------------------------------------------------------
        | FIND DEVICE
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

        $device =
            $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$device) {

            sendResponse(
                false,
                "ESP32 device not found.",
                null,
                404
            );
        }

        $deviceId =
            (int)$device["id"];

        /*
        |--------------------------------------------------------------------------
        | FIND PH SENSOR
        |--------------------------------------------------------------------------
        */

        $stmt = $pdo->prepare("
            SELECT
                id,
                sensor_name,
                gpio,
                measurement_unit,
                min_value,
                max_value,
                status
            FROM sensors
            WHERE device_id = :device_id
            AND sensor_type = 'ph'
            LIMIT 1
        ");

        $stmt->execute([
            ":device_id" => $deviceId
        ]);

        $phSensor =
            $stmt->fetch(PDO::FETCH_ASSOC);

        /*
        |--------------------------------------------------------------------------
        | FIND WATER SENSOR
        |--------------------------------------------------------------------------
        */

        $stmt = $pdo->prepare("
            SELECT
                id,
                sensor_name,
                gpio,
                measurement_unit,
                min_value,
                max_value,
                status
            FROM sensors
            WHERE device_id = :device_id
            AND sensor_type = 'water_level'
            LIMIT 1
        ");

        $stmt->execute([
            ":device_id" => $deviceId
        ]);

        $waterSensor =
            $stmt->fetch(PDO::FETCH_ASSOC);

        /*
        |--------------------------------------------------------------------------
        | DEFAULT PH DATA
        |--------------------------------------------------------------------------
        */

        $ph = 0;
        $phRaw = 0;
        $phStatus = "unknown";

        /*
        |--------------------------------------------------------------------------
        | GET LATEST PH READING
        |--------------------------------------------------------------------------
        */

        if ($phSensor) {

            $stmt = $pdo->prepare("
                SELECT
                    reading_value,
                    reading_status,
                    recorded_at
                FROM sensor_readings
                WHERE sensor_id = :sensor_id
                ORDER BY recorded_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                ":sensor_id" =>
                    $phSensor["id"]
            ]);

            $latestPh =
                $stmt->fetch(PDO::FETCH_ASSOC);

            if ($latestPh) {

                $ph =
                    (float)$latestPh[
                        "reading_value"
                    ];

                $phStatus =
                    $latestPh[
                        "reading_status"
                    ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | WATER DATA
        |--------------------------------------------------------------------------
        */

        $waterPercentage = 0;
        $waterRaw = 0;
        $waterStatus = "unknown";

        if ($waterSensor) {

            $stmt = $pdo->prepare("
                SELECT
                    reading_value,
                    reading_status,
                    recorded_at
                FROM sensor_readings
                WHERE sensor_id = :sensor_id
                ORDER BY recorded_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                ":sensor_id" =>
                    $waterSensor["id"]
            ]);

            $latestWater =
                $stmt->fetch(PDO::FETCH_ASSOC);

            if ($latestWater) {

                $waterPercentage =
                    (float)$latestWater[
                        "reading_value"
                    ];

                $waterStatus =
                    $latestWater[
                        "reading_status"
                    ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PH HISTORY
        |--------------------------------------------------------------------------
        */

        $stmt = $pdo->query("
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

        $historyRows =
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );

        $history = [];

        foreach ($historyRows as $row) {

            $createdAt =
                new DateTime(
                    $row["created_at"]
                );

            $amount = "—";

            if (
                $row["amount_ml"] !== null
            ) {

                $amount =
                    number_format(
                        (float)$row["amount_ml"],
                        2
                    ) . " mL";
            }

            $history[] = [

                "id" =>
                    (int)$row["id"],

                "time" =>
                    $createdAt->format(
                        "h:i A"
                    ),

                "ph" =>
                    (float)$row["ph_value"],

                "action" =>
                    $row["action"],

                "amount" =>
                    $amount,

                "status" =>
                    $row["status"],

                "created_at" =>
                    $row["created_at"]
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | CURRENT RELAY STATE
        |--------------------------------------------------------------------------
        |
        | These are initially false because your current database structure
        | does not contain a relay-state table.
        |
        */

        $phUp = false;
        $phDown = false;
        $nutrientA = false;
        $nutrientB = false;

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        sendResponse(
            true,
            "pH control data loaded successfully.",
            [

                "device" => [

                    "id" =>
                        $deviceId,

                    "device_uid" =>
                        $device["device_uid"],

                    "name" =>
                        $device["device_name"],

                    "type" =>
                        $device["device_type"],

                    "firmware" =>
                        $device["firmware_version"],

                    "status" =>
                        $device["status"],

                    "last_seen" =>
                        $device["last_seen"]
                ],

                "ph" => [

                    "value" =>
                        round($ph, 2),

                    "raw" =>
                        $phRaw,

                    "status" =>
                        $phStatus
                ],

                "water" => [

                    "percentage" =>
                        round(
                            $waterPercentage,
                            2
                        ),

                    "raw" =>
                        $waterRaw,

                    "status" =>
                        $waterStatus
                ],

                "relays" => [

                    "ph_up" =>
                        $phUp,

                    "ph_down" =>
                        $phDown,

                    "nutrient_a" =>
                        $nutrientA,

                    "nutrient_b" =>
                        $nutrientB
                ],

                "settings" => [

                    "target_ph" =>
                        TARGET_PH,

                    "minimum_ph" =>
                        MIN_PH,

                    "maximum_ph" =>
                        MAX_PH,

                    "deadband" =>
                        0.2,

                    "dose_limit_ml" =>
                        15
                ],

                "history" =>
                    $history
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | POST
    |--------------------------------------------------------------------------
    */

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $input =
            file_get_contents(
                "php://input"
            );

        if (!$input) {

            sendResponse(
                false,
                "No request data received.",
                null,
                400
            );
        }

        $data =
            json_decode(
                $input,
                true
            );

        if (
            json_last_error() !==
            JSON_ERROR_NONE
        ) {

            sendResponse(
                false,
                "Invalid JSON: " .
                json_last_error_msg(),
                null,
                400
            );
        }

        $action =
            $data["action"] ?? "";

        $deviceUid =
            $data["device_uid"]
            ?? DEFAULT_DEVICE_UID;

        /*
        |--------------------------------------------------------------------------
        | RELAY
        |--------------------------------------------------------------------------
        */

        if ($action === "relay") {

            $pump =
                $data["pump"] ?? "";

            $state =
                !empty(
                    $data["state"]
                );

            if (
                !in_array(
                    $pump,
                    [
                        "ph_up",
                        "ph_down"
                    ],
                    true
                )
            ) {

                sendResponse(
                    false,
                    "Invalid pH pump.",
                    null,
                    400
                );
            }

            /*
            |--------------------------------------------------------------------------
            | FIND LATEST PH VALUE
            |--------------------------------------------------------------------------
            */

            $stmt = $pdo->prepare("
                SELECT
                    sr.reading_value
                FROM sensor_readings sr
                INNER JOIN sensors s
                    ON s.id = sr.sensor_id
                INNER JOIN devices d
                    ON d.id = s.device_id
                WHERE d.device_uid = :device_uid
                AND s.sensor_type = 'ph'
                ORDER BY sr.recorded_at DESC
                LIMIT 1
            ");

            $stmt->execute([
                ":device_uid" =>
                    $deviceUid
            ]);

            $latestPh =
                $stmt->fetchColumn();

            $latestPh =
                $latestPh !== false
                    ? (float)$latestPh
                    : 0;

            /*
            |--------------------------------------------------------------------------
            | INSERT PH HISTORY ONLY WHEN PUMP TURNS ON
            |--------------------------------------------------------------------------
            */

            if ($state) {

                $historyAction =
                    $pump === "ph_up"
                        ? "ph_up"
                        : "ph_down";

                /*
                |--------------------------------------------------------------------------
                | Amount
                |--------------------------------------------------------------------------
                |
                | Your current ESP32 data does not send dosing amount,
                | therefore this remains NULL.
                |
                */

                $amountMl = null;

                $stmt = $pdo->prepare("
                    INSERT INTO ph_history (
                        ph_value,
                        action,
                        amount_ml,
                        status
                    )
                    VALUES (
                        :ph_value,
                        :action,
                        :amount_ml,
                        :status
                    )
                ");

                $stmt->execute([

                    ":ph_value" =>
                        round(
                            $latestPh,
                            2
                        ),

                    ":action" =>
                        $historyAction,

                    ":amount_ml" =>
                        $amountMl,

                    ":status" =>
                        "adjusted"
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            sendResponse(
                true,
                "pH pump command accepted.",
                [

                    "device_uid" =>
                        $deviceUid,

                    "pump" =>
                        $pump,

                    "state" =>
                        $state,

                    "relays" => [

                        "ph_up" =>
                            $pump === "ph_up"
                                ? $state
                                : false,

                        "ph_down" =>
                            $pump === "ph_down"
                                ? $state
                                : false
                    ]
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO / MANUAL MODE
        |--------------------------------------------------------------------------
        */

        if ($action === "mode") {

            $autoMode =
                !empty(
                    $data["auto_mode"]
                );

            sendResponse(
                true,
                "Control mode updated successfully.",
                [

                    "device_uid" =>
                        $deviceUid,

                    "auto_mode" =>
                        $autoMode
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNKNOWN ACTION
        |--------------------------------------------------------------------------
        */

        sendResponse(
            false,
            "Unknown action.",
            null,
            400
        );
    }

    /*
    |--------------------------------------------------------------------------
    | METHOD NOT ALLOWED
    |--------------------------------------------------------------------------
    */

    sendResponse(
        false,
        "Method not allowed.",
        null,
        405
    );

} catch (Throwable $e) {

    if (
        isset($pdo) &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    sendResponse(
        false,
        "Failed to process pH control request.",
        [
            "error" =>
                $e->getMessage()
        ],
        500
    );
}