
const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| GET SYSTEM LOGS / EVENT HISTORY
|--------------------------------------------------------------------------
| Endpoint:
| GET /api/system/logs
|
| Query parameters:
| ?limit=500
| ?search=pump
| ?level=ERROR
| ?category=SENSOR
| ?page=1
| ?limit=50
|
| Returns:
| - System logs and event history
| - Device name, UID, status, firmware version
| - User name, email, and role
| - Available level and category filter options
|--------------------------------------------------------------------------
*/

const getSystemLogs = async (req, res) => {
    try {
        const {
            search = "",
            level = "All",
            category = "All",
            limit = "500",
            page = "1"
        } = req.query;

        // Validate pagination parameters.
        const parsedLimit = Number.parseInt(limit, 10);
        const parsedPage = Number.parseInt(page, 10);

        const safeLimit =
            Number.isFinite(parsedLimit) && parsedLimit > 0
                ? Math.min(parsedLimit, 500)
                : 500;

        const safePage =
            Number.isFinite(parsedPage) && parsedPage > 0
                ? parsedPage
                : 1;

        const from = (safePage - 1) * safeLimit;
        const to = from + safeLimit - 1;

        // Build the main system logs query.
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
                `,
                { count: "exact" }
            )
            .order("timestamp", { ascending: false })
            .range(from, to);

        // Filter by severity level.
        if (
            typeof level === "string" &&
            level.trim() &&
            level.toLowerCase() !== "all"
        ) {
            query = query.eq("level", level.trim().toUpperCase());
        }

        // Filter by event category.
        if (
            typeof category === "string" &&
            category.trim() &&
            category.toLowerCase() !== "all"
        ) {
            query = query.eq(
                "category",
                category.trim().toUpperCase()
            );
        }

        // Search event, details, category, or level.
        const term =
            typeof search === "string" ? search.trim() : "";

        if (term) {
            /*
             * Escape characters that have special meaning in
             * PostgREST filter expressions.
             */
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

        const {
            data: logs,
            error: logsError,
            count
        } = await query;

        if (logsError) {
            console.error("SYSTEM LOGS QUERY ERROR:", logsError);

            return res.status(500).json({
                success: false,
                message: "Failed to load system logs.",
                error: logsError.message
            });
        }

        const records = logs || [];

        // Collect associated device IDs and user IDs.
        const deviceIds = [
            ...new Set(
                records
                    .map((log) => log.device_id)
                    .filter((id) => id !== null && id !== undefined)
            )
        ];

        const userIds = [
            ...new Set(
                records
                    .map((log) => log.user_id)
                    .filter((id) => id !== null && id !== undefined)
            )
        ];

        let devices = [];
        let admins = [];

        // Retrieve associated devices.
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
                console.error(
                    "DEVICE LOOKUP ERROR:",
                    deviceError
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to load device information.",
                    error: deviceError.message
                });
            }

            devices = data || [];
        }

        // Retrieve associated users from the admin table.
        if (userIds.length > 0) {
            const {
                data,
                error: adminError
            } = await supabase
                .from("admin")
                .select("id, name, email, role")
                .in("id", userIds);

            if (adminError) {
                console.error(
                    "ADMIN LOOKUP ERROR:",
                    adminError
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to load user information.",
                    error: adminError.message
                });
            }

            admins = data || [];
        }

        // Build lookup maps for faster formatting.
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

        // Add readable device and user information to each log.
        const formattedLogs = records.map((log) => {
            const device =
                log.device_id !== null &&
                log.device_id !== undefined
                    ? deviceMap.get(String(log.device_id))
                    : null;

            const admin =
                log.user_id !== null &&
                log.user_id !== undefined
                    ? adminMap.get(String(log.user_id))
                    : null;

            return {
                ...log,

                device:
                    device?.device_name ||
                    device?.device_uid ||
                    (
                        log.device_id !== null
                            ? `Device #${log.device_id}`
                            : "System"
                    ),

                device_uid: device?.device_uid || null,
                device_status: device?.status || null,
                firmware_version:
                    device?.firmware_version || null,

                user_name: admin?.name || null,
                user_email: admin?.email || null,
                user_role: admin?.role || null
            };
        });

        // Load available filter options from recent records.
        const {
            data: filterRows,
            error: filterError
        } = await supabase
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

        const filters = filterRows || [];

        const levels = [
            ...new Set(
                filters
                    .map((row) => row.level)
                    .filter(Boolean)
            )
        ].sort();

        const categories = [
            ...new Set(
                filters
                    .map((row) => row.category)
                    .filter(Boolean)
            )
        ].sort();

        // Return logs and pagination information.
        return res.status(200).json({
            success: true,
            message: "System logs retrieved successfully.",

            count: formattedLogs.length,
            total: count ?? formattedLogs.length,

            pagination: {
                page: safePage,
                limit: safeLimit,
                totalPages: Math.ceil(
                    (count ?? formattedLogs.length) / safeLimit
                )
            },

            data: formattedLogs,

            filters: {
                levels,
                categories
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


/*
|--------------------------------------------------------------------------
| CREATE SYSTEM LOG / EVENT
|--------------------------------------------------------------------------
| Use this function from other controllers when an event occurs.
|
| Examples:
| - Sensor data received
| - Pump activated
| - Pump deactivated
| - Device connected
| - Device disconnected
| - Sensor upload failed
|--------------------------------------------------------------------------
*/

const createSystemLog = async ({
    user_id = null,
    device_id = null,
    level = "INFO",
    category = "SYSTEM",
    event,
    details = null
} = {}) => {
    if (!event || typeof event !== "string" || !event.trim()) {
        throw new Error("A valid system log event is required.");
    }

    const allowedLevels = [
        "INFO",
        "SUCCESS",
        "WARNING",
        "ERROR"
    ];

    const normalizedLevel = String(level).toUpperCase();
    const normalizedCategory = String(category).toUpperCase();

    if (!allowedLevels.includes(normalizedLevel)) {
        throw new Error(
            `Invalid log level: ${normalizedLevel}`
        );
    }

    const { data, error } = await supabase
        .from("system_logs")
        .insert([
            {
                user_id,
                device_id,
                level: normalizedLevel,
                category: normalizedCategory,
                event: event.trim(),
                details
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("CREATE SYSTEM LOG ERROR:", error);
        throw error;
    }

    return data;
};

module.exports = {
    getSystemLogs,
    createSystemLog
};
