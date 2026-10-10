
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
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        const parsedPage = Number.parseInt(req.query.page, 10);

        const limit =
            Number.isFinite(parsedLimit) && parsedLimit > 0
                ? Math.min(parsedLimit, 500)
                : 500;

        const page =
            Number.isFinite(parsedPage) && parsedPage > 0
                ? parsedPage
                : 1;

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim().toLowerCase()
                : "";

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
                message: "Failed to retrieve sensor event history.",
                error: error.message
            });
        }

        const records = readings || [];

        const deviceIds = [
            ...new Set(
                records
                    .map((reading) => reading.device_id)
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
                .select(
                    "id, device_name, device_uid, status, firmware_version"
                )
                .in("id", deviceIds);

            if (deviceError) {
                console.error("EVENT DEVICE LOOKUP ERROR:", deviceError);

                return res.status(500).json({
                    success: false,
                    message: "Failed to retrieve device information.",
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

        const formattedEvents = records.map((reading) => {
            const device = deviceMap.get(
                String(reading.device_id)
            );

            const details = [
                `pH: ${reading.ph_value ?? "N/A"}`,
                `Water level: ${reading.water_level ?? "N/A"}`,
                `Nutrient A: ${reading.nutrient_a ?? "N/A"}`,
                `Nutrient B: ${reading.nutrient_b ?? "N/A"}`,
                `Distance: ${reading.water_distance_cm ?? "N/A"} cm`,
                `Water height: ${reading.water_level_cm ?? "N/A"} cm`,
                `Water percentage: ${reading.water_percentage ?? "N/A"}%`
            ].join(" | ");

            return {
                id: reading.id,
                device_id: reading.device_id,
                timestamp: reading.timestamp,

                level: "INFO",
                category: "SENSOR",
                event: "Sensor reading recorded",
                details,

                ph_value: reading.ph_value,
                water_level: reading.water_level,
                nutrient_a: reading.nutrient_a,
                nutrient_b: reading.nutrient_b,
                water_distance_cm: reading.water_distance_cm,
                water_level_cm: reading.water_level_cm,
                water_percentage: reading.water_percentage,

                device:
                    device?.device_name ||
                    device?.device_uid ||
                    `Device #${reading.device_id}`,

                device_uid: device?.device_uid || null,
                device_status: device?.status || null,
                firmware_version: device?.firmware_version || null,

                user_id: null,
                user_name: null,
                user_email: null,
                user_role: null
            };
        });

        // Search the returned sensor history.
        // For reliable pagination, use server-side search if the
        // history grows beyond the current page.
        const filteredEvents = search
            ? formattedEvents.filter((event) => {
                const searchable = [
                    event.event,
                    event.details,
                    event.category,
                    event.device,
                    event.device_uid,
                    event.device_id
                ];

                return searchable.some((value) =>
                    String(value ?? "")
                        .toLowerCase()
                        .includes(search)
                );
            })
            : formattedEvents;

        return res.status(200).json({
            success: true,
            message: "Sensor event history retrieved successfully.",
            count: filteredEvents.length,
            total: count ?? records.length,
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(
                    (count ?? records.length) / limit
                )
            },
            data: filteredEvents,
            filters: {
                levels: ["INFO"],
                categories: ["SENSOR"]
            }
        });
    } catch (error) {
        console.error("GET EVENT HISTORY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving event history.",
            error: error.message
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
            console.error("SYSTEM LOGS QUERY ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to load system logs.",
                error: error.message
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
        console.error("GET SYSTEM LOGS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading system logs.",
            error: error.message
        });
    }
};

module.exports = {
    getSystemLogs,
    getEventHistory
};
