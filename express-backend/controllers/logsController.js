const supabase = require("../config/supabase");


// =====================================================
// GET SYSTEM LOGS
// =====================================================

const getSystemLogs = async (req, res) => {
    try {

        const {
            data,
            error
        } = await supabase
            .from("system_logs")
            .select(`
                id,
                user_id,
                timestamp,
                level,
                category,
                event,
                device,
                details,
                created_at
            `)
            .order("timestamp", {
                ascending: false
            })
            .limit(500);


        if (error) {

            console.error(
                "SUPABASE SYSTEM LOGS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to load system logs.",
                error: error.message
            });
        }


        return res.status(200).json({
            success: true,
            data: data || []
        });

    } catch (error) {

        console.error(
            "GET SYSTEM LOGS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while loading system logs."
        });
    }
};


module.exports = {
    getSystemLogs
};