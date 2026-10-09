
const supabase = require("../config/supabase");

const MAX_LIMIT = 500;

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
            ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
            : MAX_LIMIT;

        let query = supabase
            .from("system_logs")
            .select(`
                id,
                user_id,
                device_id,
                timestamp,
                level,
                category,
                event,
                details
            `)
            .order("timestamp", { ascending: false })
            .limit(safeLimit);

        if (level !== "All") {
            query = query.eq("level", level.toUpperCase());
        }

        if (category !== "All") {
            query = query.eq("category", category.toUpperCase());
        }

        const normalizedSearch = String(search).trim();

        if (normalizedSearch) {
            const escapedSearch = normalizedSearch.replace(
                /[%_(),]/g,
                (character) => `\\${character}`
            );

            query = query.or(
                `event.ilike.%${escapedSearch}%,details.ilike.%${escapedSearch}%,category.ilike.%${escapedSearch}%,level.ilike.%${escapedSearch}%`
            );
        }

        const { data: rows, error } = await query;

        if (error) {
            console.error("SUPABASE SYSTEM LOGS ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to load system logs."
            });
        }

        const logs = rows || [];

        const deviceIds = [
            ...new Set(
                logs
                    .map((log) => log.device_id)
                    .filter((id) => id !== null && id !== undefined)
            )
        ];

        const userIds = [
            ...new Set(
                logs
                    .map((log) => log.user_id)
                    .filter((id) => id !== null && id !== undefined)
            )
        ];

        let devices = [];
        let users = [];

        if (deviceIds.length > 0) {
            const result = await supabase
                .from("devices")
                .select("id, device_name, device_uid")
                .in("id", deviceIds);

            if (result.error) {
                console.error("DEVICE LOOKUP ERROR:", result.error);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load device information."
                });
            }

            devices = result.data || [];
        }

        if (userIds.length > 0) {
            const result = await supabase
                .from("users")
                .select("id, email")
                .in("id", userIds);

            if (result.error) {
                console.error("USER LOOKUP ERROR:", result.error);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load user information."
                });
            }

            users = result.data || [];
        }

        const deviceMap = new Map(
            devices.map((device) => [
                String(device.id),
                device
            ])
        );

        const userMap = new Map(
            users.map((user) => [
                String(user.id),
                user
            ])
        );

        const formattedLogs = logs.map((log) => {
            const device = log.device_id != null
                ? deviceMap.get(String(log.device_id))
                : null;

            const user = log.user_id != null
                ? userMap.get(String(log.user_id))
                : null;

            return {
                ...log,
                device: device?.device_name
                    || device?.device_uid
                    || (log.device_id != null
                        ? `Device #${log.device_id}`
                        : "System"),
                device_uid: device?.device_uid || null,
                user_email: user?.email || null
            };
        });

        // Fetch the distinct values for dynamic filter options.
        const { data: filterRows, error: filterError } =
            await supabase
                .from("system_logs")
                .select("level, category")
                .limit(MAX_LIMIT);

        if (filterError) {
            console.error("LOG FILTER LOOKUP ERROR:", filterError);
        }

        const levels = [
            ...new Set(
                (filterRows || [])
                    .map((row) => row.level)
                    .filter(Boolean)
            )
        ].sort();

        const categories = [
            ...new Set(
                (filterRows || [])
                    .map((row) => row.category)
                    .filter(Boolean)
            )
        ].sort();

        return res.status(200).json({
            success: true,
            count: formattedLogs.length,
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
            message: "Server error while loading system logs."
        });
    }
};

module.exports = {
    getSystemLogs
};
