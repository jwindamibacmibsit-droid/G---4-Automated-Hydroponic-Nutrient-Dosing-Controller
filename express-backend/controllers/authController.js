const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, password_hash")
            .eq("email", email)
            .maybeSingle();

        if (error) {
            console.error("SUPABASE LOGIN ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Database error.",
                error: error.message
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!user.password_hash) {
            console.error("PASSWORD IS EMPTY FOR:", user.email);

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

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error."
        });
    }
};

module.exports = { login };