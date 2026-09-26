const pool = require("../config/database");
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
            SELECT
                id,
                name,
                email,
                password_hash,
                role
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
        // UPDATE LAST LOGIN
        // ==========================================

        await pool.query(
            `
            UPDATE users
            SET
                last_login = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [user.id]
        );

        // ==========================================
        // RECORD SUCCESSFUL LOGIN
        // ==========================================

        await pool.query(
            `
            INSERT INTO system_logs
            (
                user_id,
                level,
                category,
                event,
                details
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                user.id,
                "SUCCESS",
                "AUTH",
                "User login successful",
                `User ${user.email} logged into HydroControl.`
            ]
        );

        // ==========================================
        // LOGIN RESPONSE
        // ==========================================

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};

module.exports = {
    login
};
