const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // ==========================================
        // VALIDATE INPUT
        // ==========================================

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // ==========================================
        // FIND USER
        // ==========================================

        const { data: user, error } = await supabase
            .from("users")
            .select(`
                id,
                name,
                email,
                password_hash,
                role,
                last_login
            `)
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error(
                "SUPABASE LOGIN ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Database error."
            });
        }

        // ==========================================
        // USER NOT FOUND
        // ==========================================

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // ==========================================
        // CHECK PASSWORD
        // ==========================================

        if (!user.password_hash) {
            console.error(
                "PASSWORD IS EMPTY FOR:",
                user.email
            );

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

        // ==========================================
        // SAVE PREVIOUS LOGIN
        // ==========================================
        //
        // IMPORTANT:
        // This must happen BEFORE updating last_login.
        //

        const previousLastLogin = user.last_login;

        console.log(
            "PREVIOUS LOGIN:",
            previousLastLogin
        );

        // ==========================================
        // UPDATE LAST LOGIN
        // ==========================================

        const currentLogin = new Date().toISOString();

        const { error: updateError } = await supabase
            .from("users")
            .update({
                last_login: currentLogin,
                updated_at: currentLogin
            })
            .eq("id", user.id);

        if (updateError) {
            console.error(
                "LAST LOGIN UPDATE ERROR:",
                updateError
            );

            // We don't stop the login if only the
            // last_login update failed.
        }

        // ==========================================
        // RETURN LOGIN RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Login successful.",

            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,

                // IMPORTANT:
                // This is the PREVIOUS login.
                last_login: previousLastLogin
            }
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = {
    login
};