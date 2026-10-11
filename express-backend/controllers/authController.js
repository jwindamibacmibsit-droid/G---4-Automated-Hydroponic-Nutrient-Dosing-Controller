
const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // ---------------------------------------------
        // VALIDATE INPUT
        // ---------------------------------------------
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // ---------------------------------------------
        // FIND ADMINISTRATOR
        // ---------------------------------------------
        const { data: user, error: userError } = await supabase
            .from("admin")
            .select(`
                id,
                name,
                email,
                password_hash,
                role,
                last_login
            `)
            .eq("email", normalizedEmail)
            .maybeSingle();

        if (userError) {
            console.error(
                "SUPABASE LOGIN ERROR:",
                userError.message
            );

            return res.status(500).json({
                success: false,
                message: "Database error."
            });
        }

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ---------------------------------------------
        // VERIFY PASSWORD
        // ---------------------------------------------
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const currentLogin = new Date().toISOString();

        // ---------------------------------------------
        // UPDATE LAST LOGIN
        // ---------------------------------------------
        const { error: updateError } = await supabase
            .from("admin")
            .update({
                last_login: currentLogin,
                updated_at: currentLogin
            })
            .eq("id", user.id);

        if (updateError) {
            // A timestamp update failure should not invalidate
            // otherwise valid credentials.
            console.error(
                "LAST LOGIN UPDATE ERROR:",
                updateError.message
            );
        }

        // ---------------------------------------------
        // REGENERATE SESSION AFTER AUTHENTICATION
        // ---------------------------------------------
        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                console.error(
                    "SESSION REGENERATION ERROR:",
                    regenerateError.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Could not establish login session."
                });
            }

            // Store only the user details needed by the app.
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            // -----------------------------------------
            // SAVE SESSION BEFORE SENDING RESPONSE
            // -----------------------------------------
            req.session.save(async (saveError) => {
                if (saveError) {
                    console.error(
                        "SESSION SAVE ERROR:",
                        saveError.message
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Failed to create login session."
                    });
                }

                // -------------------------------------
                // RECORD SUCCESSFUL LOGIN
                // -------------------------------------
                try {
                    const { error: logError } = await supabase
                        .from("system_logs")
                        .insert({
                            user_id: user.id,
                            timestamp: currentLogin,
                            level: "SUCCESS",
                            category: "SYSTEM",
                            event: `${user.name} logged in successfully`,
                            device: "Web Admin Portal",
                            details:
                                `Successful administrator login for ${user.email}`
                        });

                    if (logError) {
                        console.error(
                            "LOGIN SYSTEM LOG ERROR:",
                            logError.message
                        );
                    }
                } catch (logError) {
                    // Logging must not invalidate a saved session.
                    console.error(
                        "LOGIN SYSTEM LOG ERROR:",
                        logError.message
                    );
                }

                // -------------------------------------
                // RETURN SUCCESS
                // -------------------------------------
                return res.status(200).json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        last_login: currentLogin
                    }
                });
            });
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = {
    login
};