const pool = require("../config/database");
const bcrypt = require("bcrypt");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input type
        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request."
            });
        }

        // Basic length limits
        if (
            email.length > 254 ||
            password.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Parameterized query protects against SQL injection
        const result = await pool.query(
            `
            SELECT id, email, password_hash
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = result.rows[0];

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
                email: user.email
            }
        });
    } catch (error) {
        // Log the real error server-side
        console.error("Login error:", error);

        // Do not expose database/internal details
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    login
};