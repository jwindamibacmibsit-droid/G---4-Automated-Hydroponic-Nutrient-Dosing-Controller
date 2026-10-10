const supabase = require("../config/supabase");

async function createSystemLog({
    device_id = null,
    user_id = null,
    level = "INFO",
    category = "SYSTEM",
    event,
    details = null
}) {
    if (!event) {
        throw new Error("System log event is required.");
    }

    const { data, error } = await supabase
        .from("system_logs")
        .insert([{
            device_id,
            user_id,
            level,
            category,
            event,
            details
        }])
        .select()
        .single();

    if (error) {
        console.error("SYSTEM LOG INSERT ERROR:", error.message);
        throw error;
    }

    return data;
}

module.exports = { createSystemLog };