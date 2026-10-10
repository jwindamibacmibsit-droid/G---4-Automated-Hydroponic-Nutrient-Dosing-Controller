
const supabase = require("../config/supabase");

const DEFAULT_SETTINGS = {
    language: "English",
    measurement_units: "Metric",
    notifications: true,
    email_alerts: true,
    system_sounds: false,
    auto_refresh: true,
    maintenance_mode: false,
};

const BOOLEAN_FIELDS = [
    "notifications",
    "email_alerts",
    "system_sounds",
    "auto_refresh",
    "maintenance_mode",
];

const ALLOWED_FIELDS = [
    "language",
    "measurement_units",
    ...BOOLEAN_FIELDS,
];

const SELECT_FIELDS = [
    "id",
    ...ALLOWED_FIELDS,
    "updated_at",
].join(", ");

function validateSettings(body) {
    const errors = [];
    const updates = {};

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return {
            errors: ["Request body must be a JSON object."],
            updates,
        };
    }

    const unknownFields = Object.keys(body).filter(
        (key) => !ALLOWED_FIELDS.includes(key)
    );

    if (unknownFields.length > 0) {
        errors.push(
            `Unsupported settings: ${unknownFields.join(", ")}`
        );
    }

    for (const key of Object.keys(body)) {
        if (!ALLOWED_FIELDS.includes(key)) continue;

        const value = body[key];

        if (BOOLEAN_FIELDS.includes(key)) {
            if (typeof value !== "boolean") {
                errors.push(`${key} must be true or false.`);
            } else {
                updates[key] = value;
            }
        }

        if (key === "language") {
            if (!["English", "Filipino"].includes(value)) {
                errors.push(
                    "language must be English or Filipino."
                );
            } else {
                updates.language = value;
            }
        }

        if (key === "measurement_units") {
            if (!["Metric", "Imperial"].includes(value)) {
                errors.push(
                    "measurement_units must be Metric or Imperial."
                );
            } else {
                updates.measurement_units = value;
            }
        }
    }

    if (Object.keys(body).length === 0) {
        errors.push("Provide at least one setting to update.");
    }

    return { errors, updates };
}

// GET /api/settings
async function getSettings(req, res) {
    try {
        const { data, error } = await supabase
            .from("system_settings")
            .select(SELECT_FIELDS)
            .eq("id", 1)
            .maybeSingle();

        if (error) throw error;

        // Initialize the configuration if it does not exist.
        if (!data) {
            const { data: created, error: insertError } =
                await supabase
                    .from("system_settings")
                    .insert({ id: 1 })
                    .select(SELECT_FIELDS)
                    .single();

            if (insertError) throw insertError;

            return res.status(200).json({
                success: true,
                message: "Settings retrieved successfully.",
                data: created,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Settings retrieved successfully.",
            data,
        });
    } catch (error) {
        console.error("Get settings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve system settings.",
        });
    }
}

// PUT /api/settings
// Accepts a partial update; only supplied settings are changed.
async function updateSettings(req, res) {
    try {
        const { errors, updates } = validateSettings(req.body);

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid settings.",
                errors,
            });
        }

        const { data: existing, error: readError } = await supabase
            .from("system_settings")
            .select("id")
            .eq("id", 1)
            .maybeSingle();

        if (readError) throw readError;

        let query;

        if (!existing) {
            query = supabase
                .from("system_settings")
                .insert({
                    id: 1,
                    ...DEFAULT_SETTINGS,
                    ...updates,
                    updated_at: new Date().toISOString(),
                });
        } else {
            query = supabase
                .from("system_settings")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", 1);
        }

        const { data, error } = await query
            .select(SELECT_FIELDS)
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Settings saved successfully.",
            data,
        });
    } catch (error) {
        console.error("Update settings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to save system settings.",
        });
    }
}

// POST /api/settings/reset
// Resets preferences. Maintenance mode is intentionally preserved.
async function resetSettings(req, res) {
    try {
        const { data: existing, error: readError } = await supabase
            .from("system_settings")
            .select("maintenance_mode")
            .eq("id", 1)
            .maybeSingle();

        if (readError) throw readError;

        const maintenanceMode =
            existing?.maintenance_mode ?? false;

        const { data, error } = await supabase
            .from("system_settings")
            .upsert({
                id: 1,
                ...DEFAULT_SETTINGS,
                maintenance_mode: maintenanceMode,
                updated_at: new Date().toISOString(),
            })
            .select(SELECT_FIELDS)
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: "Preferences reset successfully.",
            data,
        });
    } catch (error) {
        console.error("Reset settings error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to reset preferences.",
        });
    }
}

module.exports = {
    getSettings,
    updateSettings,
    resetSettings,
};
