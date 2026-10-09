
const supabase = require("../config/supabase");

const DEVICE_UID = process.env.DEVICE_UID || "ESP32-HYDRO-001";
const OFFLINE_TIMEOUT_MS = 60 * 1000;
const HISTORY_LIMIT = 20;

function sendError(res, message, error) {
    console.error(message, error);
    return res.status(500).json({
        success: false,
        message,
        error: error?.message || String(error),
    });
}

async function findDevice() {
    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("device_uid", DEVICE_UID)
        .maybeSingle();

    if (error) throw error;
    return data;
}

// GET /api/sensors/latest
async function getLatestReading(req, res) {
    try {
        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "HydroControl device is not registered.",
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

        return res.json({
            success: true,
            device: {
                id: device.id,
                device_uid: device.device_uid,
                device_name: device.device_name,
                status: device.status,
                last_seen: device.last_seen,
            },
            data: data || null,
        });
    } catch (error) {
        return sendError(res, "Failed to retrieve latest sensor reading", error);
    }
}

// GET /api/sensors/history
async function getSensorHistory(req, res) {
    try {
        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "HydroControl device is not registered.",
            });
        }

        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requestedLimit)
            ? Math.max(1, Math.min(requestedLimit, 100))
            : HISTORY_LIMIT;

        const { data, error } = await supabase
            .from("sensor_reading")
            .select("*")
            .eq("device_id", device.id)
            .order("timestamp", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return res.json({
            success: true,
            count: data.length,
            data: data.reverse(),
        });
    } catch (error) {
        return sendError(res, "Failed to retrieve sensor history", error);
    }
}

// GET /api/sensors/device-status
async function getDeviceStatus(req, res) {
    try {
        const device = await findDevice();

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "HydroControl device is not registered.",
                online: false,
            });
        }

        const lastSeenMs = device.last_seen
            ? new Date(device.last_seen).getTime()
            : 0;

        const online =
            Number.isFinite(lastSeenMs) &&
            lastSeenMs > 0 &&
            Date.now() - lastSeenMs <= OFFLINE_TIMEOUT_MS;

        return res.json({
            success: true,
            online,
            device: {
                id: device.id,
                device_uid: device.device_uid,
                device_name: device.device_name,
                status: online ? "online" : "offline",
                last_seen: device.last_seen,
            },
        });
    } catch (error) {
        return sendError(res, "Failed to retrieve device status", error);
    }
}

module.exports = {
    getLatestReading,
    getSensorHistory,
    getDeviceStatus,
};
