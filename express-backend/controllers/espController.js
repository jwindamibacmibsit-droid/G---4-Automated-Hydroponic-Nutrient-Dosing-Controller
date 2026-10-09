
const supabase = require("../config/supabase");

const DEVICE_UID = "ESP32-HYDRO-001";

// ========================================
// ESP32 AUTHENTICATION
// ========================================
function validDevice(req, res, next) {
    const expected = process.env.DEVICE_API;
    const supplied = req.get("x-device-token");

    if (!expected || !supplied || supplied !== expected) {
        return res.status(401).json({
            success: false,
            message: "Invalid device credentials"
        });
    }

    next();
}

// ========================================
// WEBSITE AUTHENTICATION
// Requires a valid Supabase access token.
// ========================================
async function requireUser(req, res, next) {
    try {
        const authorization = req.get("authorization") || "";
        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired session"
            });
        }

        req.user = data.user;
        next();
    } catch (error) {
        next(error);
    }
}

// ========================================
// 1. RECEIVE SENSOR DATA FROM ESP32
// POST /api/esp/sensors
// ========================================
async function receiveSensorData(req, res, next) {
    try {
        const {
            device_uid,
            ph,
            water_distance_cm,
            water_level_cm,
            water_percentage
        } = req.body || {};

        if (device_uid !== DEVICE_UID) {
            return res.status(400).json({
                success: false,
                message: "Invalid device UID"
            });
        }

        const readings = {
            ph,
            water_distance_cm,
            water_level_cm,
            water_percentage
        };

        for (const [key, value] of Object.entries(readings)) {
            if (
                value !== null &&
                value !== undefined &&
                (typeof value !== "number" || !Number.isFinite(value))
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid sensor value: ${key}`
                });
            }
        }

        const { data: device, error: deviceError } = await supabase
            .from("devices")
            .select("id")
            .eq("device_uid", DEVICE_UID)
            .maybeSingle();

        if (deviceError) throw deviceError;

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered in Supabase"
            });
        }

        const { data, error } = await supabase
            .from("sensor_logs")
            .insert([{
                device_uid: DEVICE_UID,
                ph: ph ?? null,
                water_distance_cm: water_distance_cm ?? null,
                water_level_cm: water_level_cm ?? null,
                water_percentage: water_percentage ?? null
            }])
            .select()
            .single();

        if (error) throw error;

        const { error: updateError } = await supabase
            .from("devices")
            .update({
                status: "online",
                last_seen: new Date().toISOString()
            })
            .eq("device_uid", DEVICE_UID);

        if (updateError) throw updateError;

        return res.status(201).json({
            success: true,
            message: "Sensor data saved successfully",
            data
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 2. GET LATEST SENSOR DATA FOR WEBSITE
// GET /api/esp/dashboard/latest
// ========================================
async function getLatestSensorData(req, res, next) {
    try {
        const { data, error } = await supabase
            .from("sensor_logs")
            .select("*")
            .eq("device_uid", DEVICE_UID)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        res.set("Cache-Control", "no-store");

        return res.json({
            success: true,
            data: data || null
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 3. QUEUE A PUMP COMMAND FROM WEBSITE
// POST /api/esp/pumps/commands
// ========================================
async function createPumpCommand(req, res, next) {
    try {
        const { pump, duration_ms } = req.body || {};

        const allowedPumps = [
            "ph",
            "nutrient_a",
            "nutrient_b"
        ];

        if (
            !allowedPumps.includes(pump) ||
            !Number.isInteger(duration_ms) ||
            duration_ms < 100 ||
            duration_ms > 5000
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pump or duration. Maximum duration is 5000 ms."
            });
        }

        const { data: device, error: deviceError } = await supabase
            .from("devices")
            .select("id")
            .eq("device_uid", DEVICE_UID)
            .maybeSingle();

        if (deviceError) throw deviceError;

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device is not registered"
            });
        }

        const { data: pending, error: pendingError } = await supabase
            .from("pump_commands")
            .select("id")
            .eq("device_uid", DEVICE_UID)
            .in("status", ["pending", "claimed"])
            .limit(1);

        if (pendingError) throw pendingError;

        if (pending?.length) {
            return res.status(409).json({
                success: false,
                message: "Another pump command is pending or running"
            });
        }

        const { data, error } = await supabase
            .from("pump_commands")
            .insert([{
                device_uid: DEVICE_UID,
                pump,
                duration_ms,
                status: "pending"
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: "Pump command queued",
            data
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 4. ESP32 POLLS FOR A PUMP COMMAND
// GET /api/esp/commands/next
// ========================================
async function getNextPumpCommand(req, res, next) {
    try {
        const cutoff = new Date(
            Date.now() - 60000
        ).toISOString();

        // Expire commands not collected within 60 seconds.
        const { error: expireError } = await supabase
            .from("pump_commands")
            .update({ status: "expired" })
            .eq("device_uid", DEVICE_UID)
            .eq("status", "pending")
            .lt("requested_at", cutoff);

        if (expireError) throw expireError;

        const { data: command, error } = await supabase
            .from("pump_commands")
            .select("id, pump, duration_ms")
            .eq("device_uid", DEVICE_UID)
            .eq("status", "pending")
            .order("requested_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!command) {
            return res.json({
                success: true,
                command: null
            });
        }

        // Conditional claim prevents most duplicate claims.
        const { data: claimed, error: claimError } = await supabase
            .from("pump_commands")
            .update({
                status: "claimed",
                claimed_at: new Date().toISOString()
            })
            .eq("id", command.id)
            .eq("status", "pending")
            .select("id, pump, duration_ms")
            .maybeSingle();

        if (claimError) throw claimError;

        return res.json({
            success: true,
            command: claimed || null
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// 5. REPORT PUMP COMMAND RESULT
// POST /api/esp/commands/:id/result
// ========================================
async function reportPumpResult(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status, message } = req.body || {};

        if (
            !Number.isSafeInteger(id) ||
            id <= 0 ||
            !["completed", "failed"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid command result"
            });
        }

        const { data, error } = await supabase
            .from("pump_commands")
            .update({
                status,
                completed_at: new Date().toISOString(),
                result_message:
                    typeof message === "string"
                        ? message.slice(0, 250)
                        : null
            })
            .eq("id", id)
            .eq("device_uid", DEVICE_UID)
            .eq("status", "claimed")
            .select("id, status")
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Claimed command not found"
            });
        }

        return res.json({
            success: true,
            message: "Pump result recorded",
            data
        });
    } catch (error) {
        next(error);
    }
}

// ========================================
// EXPORT CONTROLLER FUNCTIONS
// ========================================
module.exports = {
    validDevice,
    requireUser,
    receiveSensorData,
    getLatestSensorData,
    createPumpCommand,
    getNextPumpCommand,
    reportPumpResult
};
