const pool = require("../config/database");

// GET SYSTEM LOGS
const getSystemLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sl.id,
                sl.user_id,
                sl.device_id,
                sl.level,
                sl.category,
                sl.event,
                sl.details,
                sl.timestamp,
                u.email AS user_email
            FROM system_logs sl
            LEFT JOIN users u
                ON sl.user_id = u.id
            ORDER BY sl.timestamp DESC
            LIMIT 100
        `);

        const logs = result.rows.map((log) => ({
            id: log.id,
            user_id: log.user_id,
            user_email: log.user_email,
            device_id: log.device_id,
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
        console.error("SYSTEM LOG DATABASE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve system logs."
        });
    }
};

module.exports = {
    getSystemLogs
};