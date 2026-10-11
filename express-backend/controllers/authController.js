
const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

// =====================================================
// LOGIN — POST /api/auth/login
// =====================================================
const login = async (req, res) => {
    try {
        const { email, password, rememberMe = false } = req.body || {};

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

        // 1. Find administrator.
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

        if (!user || !user.password_hash) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // 2. Verify password.
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

        // 3. Update last login.
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

        // 4. Regenerate session ID after authentication.
        req.session.regenerate(async (sessionError) => {
            if (sessionError) {
                console.error("SESSION REGENERATION ERROR:", sessionError);

                return res.status(500).json({
                    success: false,
                    message: "Could not establish login session."
                });
            }

            try {
                // Never store the password or password hash in a session.
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };

                // Remember me: persistent cookie for 7 days.
                // Otherwise: browser-session cookie.
                if (rememberMe === true) {
                    req.session.cookie.maxAge =
                        7 * 24 * 60 * 60 * 1000;
                } else {
                    req.session.cookie.expires = false;
                }

                // 5. Save session BEFORE responding.
                req.session.save(async (saveError) => {
                    if (saveError) {
                        console.error("SESSION SAVE ERROR:", saveError);

                        return res.status(500).json({
                            success: false,
                            message: "Failed to create login session."
                        });
                    }

                    // 6. Log successful login.
                    // A logging failure must not invalidate the session.
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
                        console.error("LOGIN SYSTEM LOG ERROR:", logError);
                    }

                    // 7. Send ONE response only.
                    return res.status(200).json({
                        success: true,
                        authenticated: true,
                        message: "Login successful.",
                        user: {
                            ...req.session.user,
                            last_login: currentLogin
                        }
                    });
                });
            } catch (error) {
                console.error("SESSION SETUP ERROR:", error);

                if (!res.headersSent) {
                    return res.status(500).json({
                        success: false,
                        message: "Could not establish login session."
                    });
                }
            }
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Server error."
            });
        }
    }
};

// =====================================================
// GET CURRENT SESSION
// GET /api/auth/session
// =====================================================
const getSession = (req, res) => {
    if (!req.session?.user?.id) {
        return res.status(401).json({
            success: false,
            authenticated: false,
            message: "Authentication required."
        });
    }

    return res.status(200).json({
        success: true,
        authenticated: true,
        user: req.session.user
    });
};

// =====================================================
// LOGOUT — POST /api/auth/logout
// =====================================================
const logout = (req, res) => {
    if (!req.session) {
        res.clearCookie("hydrocontrol.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("SESSION DESTROY ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Could not log out."
            });
        }

        res.clearCookie("hydrocontrol.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        return res.status(200).json({
            success: true,
            authenticated: false,
            message: "Logged out successfully."
        });
    });
};

module.exports = {
    login,
    getSession,
    logout
};
