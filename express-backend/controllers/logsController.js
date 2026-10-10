
const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| GET SENSOR EVENT HISTORY
|--------------------------------------------------------------------------
| Source: public.sensor_reading
| Endpoint: GET /api/system/events
|--------------------------------------------------------------------------
*/

const getEventHistory = async (req, res) => {
    try {
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 500, 1),
            500
        );

        const page = Math.max(
            Number.parseInt(req.query.page, 10) || 1,
            1
        );

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        // Fetch sensor readings from public.sensor_reading.
        const {
            data: readings,
            error,
            count
        } = await supabase
            .from("sensor_reading")
            .select(
                `
                    id,
                    device_id,
                    ph_value,
                    water_level,
                    nutrient_a,
                    nutrient_b,
                    timestamp,
                    water_distance_cm,
                    water_level_cm,
                    water_percentage
                `,
                { count: "exact" }
            )
            .order("timestamp", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("SENSOR EVENT HISTORY ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch sensor readings.",
                error: error.message
            });
        }

        const records = readings || [];

        // Get device details for the readings.
        const deviceIds = [
            ...new Set(
                records
                    .map((row) => row.device_id)
                    .filter((id) => id != null)
            )
        ];

        let devices = [];

        if (deviceIds.length > 0) {
            const {
                data,
                error: deviceError
            } = await supabase
                .from("devices")
                .select("id, device_name, device_uid, status")
                .in("id", deviceIds);

            if (deviceError) {
                console.error("SENSOR DEVICE LOOKUP ERROR:", deviceError);

                return res.status(500).json({
                    success: false,
                    message: "Failed to fetch device details.",
                    error: deviceError.message
                });
            }

            devices = data || [];
        }

        const deviceMap = new Map(
            devices.map((device) => [
                String(device.id),
                device
            ])
        );

        const events = records.map((row) => {
            const device = deviceMap.get(String(row.device_id));

            const details = [
                `pH: ${row.ph_value ?? "N/A"}`,
                `Water level: ${row.water_level ?? "N/A"}`,
                `Nutrient A: ${row.nutrient_a ?? "N/A"}`,
                `Nutrient B: ${row.nutrient_b ?? "N/A"}`,
                `Water distance: ${row.water_distance_cm ?? "N/A"} cm`,
                `Water height: ${row.water_level_cm ?? "N/A"} cm`,
                `Water percentage: ${row.water_percentage ?? "N/A"}%`
            ].join(" | ");

            return {
                id: row.id,
                timestamp: row.timestamp,

                level: "INFO",
                category: "SENSOR",
                event: "Sensor reading recorded",
                details,

                device_id: row.device_id,
                device:
                    device?.device_name ||
                    device?.device_uid ||
                    `Device #${row.device_id}`,

                device_uid: device?.device_uid || null,
                device_status: device?.status || null,

                ph_value: row.ph_value,
                water_level: row.water_level,
                nutrient_a: row.nutrient_a,
                nutrient_b: row.nutrient_b,
                water_distance_cm: row.water_distance_cm,
                water_level_cm: row.water_level_cm,
                water_percentage: row.water_percentage,

                user_id: null,
                user_name: null,
                user_email: null
            };
        });

        return res.status(200).json({
            success: true,
            message: "Sensor event history retrieved successfully.",
            count: events.length,
            total: count ?? 0,
            page,
            limit,
            data: events
        });
    } catch (error) {
        console.error("GET EVENT HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching sensor events."
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET SYSTEM LOGS
|--------------------------------------------------------------------------
| Source: public.system_logs
|--------------------------------------------------------------------------
*/

const getSystemLogs = async (req, res) => {
    try {
        const {
            search = "",
            level = "All",
            category = "All",
            limit = "500"
        } = req.query;

        const parsedLimit = Number.parseInt(limit, 10);
        const safeLimit =
            Number.isFinite(parsedLimit) && parsedLimit > 0
                ? Math.min(parsedLimit, 500)
                : 500;

        let query = supabase
            .from("system_logs")
            .select(
                `
                    id,
                    user_id,
                    device_id,
                    level,
                    category,
                    event,
                    details,
                    timestamp
                `
            )
            .order("timestamp", { ascending: false })
            .limit(safeLimit);

        if (
            level &&
            level.toLowerCase() !== "all"
        ) {
            query = query.eq("level", level.toUpperCase());
        }

        if (
            category &&
            category.toLowerCase() !== "all"
        ) {
            query = query.eq("category", category.toUpperCase());
        }

        const term = String(search).trim();

        if (term) {
            // Escape PostgREST filter syntax characters.
            const escaped = term.replace(
                /[%_\\,()."]/g,
                "\\$&"
            );

            query = query.or(
                [
                    `event.ilike.%${escaped}%`,
                    `details.ilike.%${escaped}%`,
                    `category.ilike.%${escaped}%`,
                    `level.ilike.%${escaped}%`
                ].join(",")
            );
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error("SENSOR EVENT HISTORY ERROR:", JSON.stringify(error, null, 2));

            return res.status(500).json({
                success: false,
                message: "Failed to fetch sensor readings.",
                error: error.message,
                code: error.code || null,
                details: error.details || null,
                hint: error.hint || null
            });
        }

        const records = logs || [];

        const deviceIds = [
            ...new Set(
                records
                    .map((log) => log.device_id)
                    .filter((id) => id != null)
            )
        ];

        const userIds = [
            ...new Set(
                records
                    .map((log) => log.user_id)
                    .filter((id) => id != null)
            )
        ];

        let devices = [];
        let admins = [];

        if (deviceIds.length > 0) {
            const { data, error: deviceError } = await supabase
                .from("devices")
                .select(
                    "id, device_name, device_uid, status, firmware_version"
                )
                .in("id", deviceIds);

            if (deviceError) {
                console.error("DEVICE LOOKUP ERROR:", deviceError);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load device information."
                });
            }

            devices = data || [];
        }

        if (userIds.length > 0) {
            const { data, error: adminError } = await supabase
                .from("admin")
                .select("id, name, email, role")
                .in("id", userIds);

            if (adminError) {
                console.error("ADMIN LOOKUP ERROR:", adminError);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load user information."
                });
            }

            admins = data || [];
        }

        const deviceMap = new Map(
            devices.map((device) => [
                String(device.id),
                device
            ])
        );

        const adminMap = new Map(
            admins.map((admin) => [
                String(admin.id),
                admin
            ])
        );

        const formattedLogs = records.map((log) => {
            const device =
                log.device_id != null
                    ? deviceMap.get(String(log.device_id))
                    : null;

            const admin =
                log.user_id != null
                    ? adminMap.get(String(log.user_id))
                    : null;

            return {
                ...log,

                device:
                    device?.device_name ||
                    device?.device_uid ||
                    (
                        log.device_id != null
                            ? `Device #${log.device_id}`
                            : "System"
                    ),

                device_uid: device?.device_uid || null,
                device_status: device?.status || null,
                firmware_version: device?.firmware_version || null,

                user_name: admin?.name || null,
                user_email: admin?.email || null,
                user_role: admin?.role || null
            };
        });

        const { data: filterRows, error: filterError } = await supabase
            .from("system_logs")
            .select("level, category")
            .order("timestamp", { ascending: false })
            .limit(500);

        if (filterError) {
            console.error(
                "FILTER OPTIONS QUERY ERROR:",
                filterError
            );
        }

        const filterRecords = filterRows || [];

        return res.status(200).json({
            success: true,
            count: formattedLogs.length,
            data: formattedLogs,
            filters: {
                levels: [
                    ...new Set(
                        filterRecords
                            .map((row) => row.level)
                            .filter(Boolean)
                    )
                ].sort(),

                categories: [
                    ...new Set(
                        filterRecords
                            .map((row) => row.category)
                            .filter(Boolean)
                    )
                ].sort()
            }
        });
    } catch (error) {
        console.error("GET EVENT HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching sensor events.",
            error: error.message,
            code: error.code || null,
            details: error.details || null,
            hint: error.hint || null
        });
    }
};

module.exports = {
    getSystemLogs,
    getEventHistory
};
