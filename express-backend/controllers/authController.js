const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

// =====================================================
// LOGIN
// =====================================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

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

        // Find administrator.
        const { data: user, error } = await supabase
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

        if (error) {
            console.error("SUPABASE LOGIN ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Database error."
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.password_hash) {
            console.error("Password hash is missing for:", user.email);

            return res.status(500).json({
                success: false,
                message: "User password is not configured."
            });
        }

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

        const previousLastLogin = user.last_login;
        const currentLogin = new Date().toISOString();

        // Update login timestamp.
        const { error: updateError } = await supabase
            .from("admin")
            .update({
                last_login: currentLogin,
                updated_at: currentLogin
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("LAST LOGIN UPDATE ERROR:", updateError);
        }


        // Regenerate the session after successful authentication.
        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                console.error("SESSION REGENERATION ERROR:", regenerateError);

                return res.status(500).json({
                    success: false,
                    message: "Could not establish login session."
                });
            }

            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            req.session.save((sessionError) => {
                if (sessionError) {
                    console.error("SESSION SAVE ERROR:", sessionError);

                    return res.status(500).json({
                        success: false,
                        message: "Could not establish login session."
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Login successful.",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        last_login: previousLastLogin
                    }
                });
            });
        });


        // Record the login in system_logs.
        const { error: logError } = await supabase
            .from("system_logs")
            .insert({
                user_id: user.id,
                timestamp: currentLogin,
                level: "SUCCESS",
                category: "SYSTEM",
                event: `${user.name} logged in successfully`,
                device: "Web Admin Portal",
                details: `Successful administrator login for ${user.email}`
            });

        if (logError) {
            // Logging failure should not invalidate valid credentials.
            console.error("LOGIN SYSTEM LOG ERROR:", logError);
        }

        // Ensure the session is saved before returning success.
        req.session.save((sessionError) => {
            if (sessionError) {
                console.error("SESSION SAVE ERROR:", sessionError);

                return res.status(500).json({
                    success: false,
                    message: "Could not establish login session."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    last_login: previousLastLogin
                }
            });
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = {
    login
};
