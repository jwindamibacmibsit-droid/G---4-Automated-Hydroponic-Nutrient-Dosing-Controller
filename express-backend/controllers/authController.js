const pool = require("../config/supabase");
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

        const result = await pool.query(
            `
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

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
        console.error("LOGIN DATABASE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Database error."
        });
    }
};

module.exports = { login };