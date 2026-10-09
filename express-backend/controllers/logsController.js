
const supabase = require("../config/supabase");

const getSystemLogs = async (req, res) => {
    try {
        const {
            search = "",
            level = "All",
            category = "All",
            limit = "500"
        } = req.query;

        const parsedLimit = Number.parseInt(limit, 10);
        const safeLimit = Number.isFinite(parsedLimit)
            ? Math.min(Math.max(parsedLimit, 1), 500)
            : 500;

        let query = supabase
            .from("system_logs")
            .select(`
                id,
                user_id,
                device_id,
                level,
                category,
                event,
                details,
                timestamp
            `)
            .order("timestamp", { ascending: false })
            .limit(safeLimit);

        if (level !== "All") {
            query = query.eq("level", level.toUpperCase());
        }

        if (category !== "All") {
            query = query.eq("category", category.toUpperCase());
        }

        const term = String(search).trim();

        if (term) {
            // Escape PostgREST filter syntax characters.
            const escaped = term.replace(/[\\%_(),]/g, "\\$&");

            query = query.or(
                `event.ilike.%${escaped}%,details.ilike.%${escaped}%,category.ilike.%${escaped}%,level.ilike.%${escaped}%`
            );
        }

        const { data: logs, error } = await query;

        if (error) {
            console.error("SYSTEM LOGS QUERY ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to load system logs."
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

        if (deviceIds.length) {
            const { data, error: deviceError } = await supabase
                .from("devices")
                .select("id, device_name, device_uid, status, firmware_version")
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

        if (userIds.length) {
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
            devices.map((device) => [String(device.id), device])
        );

        const adminMap = new Map(
            admins.map((admin) => [String(admin.id), admin])
        );

        const formattedLogs = records.map((log) => {
            const device = log.device_id != null
                ? deviceMap.get(String(log.device_id))
                : null;

            const admin = log.user_id != null
                ? adminMap.get(String(log.user_id))
                : null;

            return {
                ...log,
                device: device?.device_name
                    || device?.device_uid
                    || (log.device_id != null
                        ? `Device #${log.device_id}`
                        : "System"),
                device_uid: device?.device_uid || null,
                device_status: device?.status || null,
                firmware_version: device?.firmware_version || null,
                user_name: admin?.name || null,
                user_email: admin?.email || null,
                user_role: admin?.role || null
            };
        });

        // Use actual database values for the category and level filters.
        // Fetch distinct options across the latest 500 records.
        const { data: filterRows, error: filterError } = await supabase
            .from("system_logs")
            .select("level, category")
            .order("timestamp", { ascending: false })
            .limit(500);

        if (filterError) {
            console.error("FILTER OPTIONS QUERY ERROR:", filterError);
        }

        const filters = filterRows || [];

        return res.status(200).json({
            success: true,
            count: formattedLogs.length,
            data: formattedLogs,
            filters: {
                levels: [
                    ...new Set(
                        filters.map((row) => row.level).filter(Boolean)
                    )
                ].sort(),
                categories: [
                    ...new Set(
                        filters.map((row) => row.category).filter(Boolean)
                    )
                ].sort()
            }
        });
    } catch (error) {
        console.error("GET SYSTEM LOGS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while loading system logs."
        });
    }
};

module.exports = {
    getSystemLogs
};
