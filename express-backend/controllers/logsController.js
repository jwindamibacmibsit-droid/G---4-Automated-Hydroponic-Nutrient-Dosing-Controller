const supabase = require("../config/supabase");

// GET SYSTEM LOGS
const getSystemLogs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("system_logs")
            .select(`
                id,
                user_id,
                device_id,
                level,
                category,
                event,
                details,
                timestamp,
                users (
                    email
                ),
                devices (
                    device_name
                )
            `)
            .order("timestamp", {
                ascending: false
            })
            .limit(100);

        if (error) {
            console.error("SUPABASE SYSTEM LOG ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve system logs.",
                error: error.message
            });
        }

        const logs = data.map((log) => ({
            id: log.id,
            user_id: log.user_id,
            user_email: log.users?.email || null,

            device_id: log.device_id,
            device: log.devices?.device_name || null,

            level: log.level,
            category: log.category,
            event: log.event,
            details: log.details,
            timestamp: log.timestamp
        }));

        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error("SYSTEM LOG SERVER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve system logs."
        });
    }
};

module.exports = {
    getSystemLogs
};