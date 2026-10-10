
const crypto = require("crypto");
const supabase = require("../config/supabase");

const DEVICE_UID =
    process.env.DEVICE_UID || "ESP32-HYDRO-001";

const DEVICE_API_KEY =
    process.env.DEVICE_API_KEY ||
    "1578d8bde8d521949ce8495618a32791f48cb0c70ff59c474da5da022a860374";

// ========================================
// 1. ESP32 AUTHENTICATION
// ========================================
function validDevice(req, res, next) {
    const supplied = req.get("x-device-token") || "";

    if (!DEVICE_API_KEY || !supplied) {
        return res.status(401).json({
            success: false,
            message: "Invalid device credentials",
        });
    }

    const expectedBuffer = Buffer.from(DEVICE_API_KEY);
    const suppliedBuffer = Buffer.from(supplied);

    if (
        expectedBuffer.length !== suppliedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid device credentials",
        });
    }

    next();
}

// ========================================
// 2. WEBSITE AUTHENTICATION
// ========================================
function requireUser(req, res, next) {
    if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in again."
        });
    }

    req.user = req.session.user.id;
    return next();
}

// ========================================
// 3. FIND REGISTERED DEVICE
// ========================================
async function findDevice() {
    const { data, error } = await supabase
        .from("devices")
        .select("id, device_uid, device_name, status, last_seen")
        .eq("device_uid", DEVICE_UID)
        .maybeSingle();

    if (error) throw error;

    return data;
}

// ========================================
// 4. RECEIVE ESP32 SENSOR DATA
// POST /api/esp/sensors
//
// pH is OPTIONAL.
// Water readings can be saved without pH.
// ========================================
// ========================================
// RECEIVE ESP32 SENSOR DATA
// POST /api/esp/sensors
// ========================================
async function receiveSensorData(req, res, next) {
    try {
        const body = req.body || {};

        const {
            device_uid,
            water_distance_cm = null,
            water_level_cm = null,
            water_percentage = null,
        } = body;

        const rawPH =
            body.ph !== undefined ? body.ph : body.ph_value;

        const validPH =
            typeof rawPH === "number" &&
            Number.isFinite(rawPH) &&
            rawPH >= 0 &&
            rawPH <= 14;

        const validWater =
            typeof water_distance_cm === "number" &&
            Number.isFinite(water_distance_cm) &&
            water_distance_cm >= 0 &&
            typeof water_level_cm === "number" &&
            Number.isFinite(water_level_cm) &&
            water_level_cm >= 0 &&
            typeof water_percentage === "number" &&
            Number.isFinite(water_percentage) &&
            water_percentage >= 0 &&
            water_percentage <= 100;

        if (device_uid !== DEVICE_UID) {
            return res.status(400).json({
                success: false,
                message: "Invalid device UID",
            });
        }

        const { data: device, error: deviceError } =
            await supabase
                .from("devices")
                .select("id, device_uid")
                .eq("device_uid", DEVICE_UID)
                .maybeSingle();

        if (deviceError) throw deviceError;

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered",
            });
        }

        const now = new Date().toISOString();

        // Save the readings that are actually valid.
        const readingPayload = {
            device_id: device.id,
            ph_value: validPH ? rawPH : null,
            water_distance_cm: validWater
                ? water_distance_cm
                : null,
            water_level_cm: validWater
                ? water_level_cm
                : null,
            water_percentage: validWater
                ? water_percentage
                : null,
            timestamp: now,
        };

        const { data: reading, error: readingError } =
            await supabase
                .from("sensor_reading")
                .insert(readingPayload)
                .select()
                .single();

        if (readingError) throw readingError;

        // Both required sensors must be valid for Online.
        const deviceStatus =
            validPH && validWater ? "online" : "offline";

        const { error: statusError } = await supabase
            .from("devices")
            .update({
                status: deviceStatus,
                last_seen: now,
            })
            .eq("id", device.id);

        if (statusError) throw statusError;

        return res.status(201).json({
            success: true,
            message: "Sensor data processed",
            device_status: deviceStatus,
            sensors: {
                ph: validPH ? "online" : "offline",
                ultrasonic: validWater ? "online" : "offline",
            },
            data: reading,
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 5. GET LATEST SENSOR READING
// GET /api/esp/dashboard/latest
// ========================================
async function getLatestSensorData(req, res, next) {
    try {
        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered",
                data: null,
            });
        }

        const { data, error } = await supabase
            .from("sensor_reading")
            .select("*")
            .eq("device_id", device.id)
            .order("timestamp", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        res.set("Cache-Control", "no-store");

        return res.json({
            success: true,
            device,
            data: data || null,
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 6. QUEUE PUMP COMMAND
// POST /api/esp/pumps/commands
// Requires website authentication.
// ========================================
async function createPumpCommand(req, res, next) {
    try {
        const { pump, duration_ms } = req.body || {};

        const allowedPumps = [
            "ph",
            "nutrient_a",
            "nutrient_b",
        ];

        if (
            !allowedPumps.includes(pump) ||
            !Number.isInteger(duration_ms) ||
            duration_ms < 100 ||
            duration_ms > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pump or duration",
            });
        }

        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered",
            });
        }

        const { data: pending, error: pendingError } =
            await supabase
                .from("pump_commands")
                .select("id")
                .eq("device_id", device.id)
                .in("status", ["pending", "processing"])
                .limit(1);

        if (pendingError) throw pendingError;

        if (pending?.length) {
            return res.status(409).json({
                success: false,
                message:
                    "Another pump command is pending or running",
            });
        }

        const { data, error } = await supabase
            .from("pump_commands")
            .insert({
                device_id: device.id,
                pump,
                duration_ms,
                status: "pending",
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: "Pump command queued",
            data,
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 7. ESP32 POLLS FOR PUMP COMMAND
// GET /api/esp/commands/next
// ========================================
async function getNextPumpCommand(req, res, next) {
    try {
        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered",
            });
        }

        const cutoff = new Date(
            Date.now() - 60_000
        ).toISOString();

        const { error: expireError } = await supabase
            .from("pump_commands")
            .update({
                status: "failed",
                result_message: "Command expired before pickup",
                updated_at: new Date().toISOString(),
            })
            .eq("device_id", device.id)
            .eq("status", "pending")
            .lt("created_at", cutoff);

        if (expireError) throw expireError;

        const { data: command, error } = await supabase
            .from("pump_commands")
            .select("id, pump, duration_ms")
            .eq("device_id", device.id)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!command) {
            return res.json({
                success: true,
                command: null,
            });
        }

        const { data: claimed, error: claimError } =
            await supabase
                .from("pump_commands")
                .update({
                    status: "processing",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", command.id)
                .eq("device_id", device.id)
                .eq("status", "pending")
                .select("id, pump, duration_ms")
                .maybeSingle();

        if (claimError) throw claimError;

        return res.json({
            success: true,
            command: claimed || null,
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 8. REPORT PUMP RESULT
// POST /api/esp/commands/:id/result
// ========================================
async function reportPumpResult(req, res, next) {
    try {
        const { id } = req.params;
        const { status, message } = req.body || {};

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (
            !uuidRegex.test(id) ||
            !["completed", "failed"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid command result",
            });
        }

        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered",
            });
        }

        const resultMessage =
            typeof message === "string"
                ? message.slice(0, 250)
                : null;

        const { data, error } = await supabase
            .from("pump_commands")
            .update({
                status,
                result_message: resultMessage,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("device_id", device.id)
            .eq("status", "processing")
            .select("*")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Processing command not found",
            });
        }

        const { error: eventError } = await supabase
            .from("pump_events")
            .insert({
                command_id: data.id,
                device_id: device.id,
                pump: data.pump,
                duration_ms: data.duration_ms,
                status: data.status,
                message: resultMessage,
            });

        if (eventError) {
            console.error(
                "Pump event insert failed:",
                eventError
            );
        }

        return res.json({
            success: true,
            message: "Pump result recorded",
            data,
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// EXPORT CONTROLLERS
// ========================================
module.exports = {
    validDevice,
    requireUser,
    receiveSensorData,
    getLatestSensorData,
    createPumpCommand,
    getNextPumpCommand,
    reportPumpResult,
};
