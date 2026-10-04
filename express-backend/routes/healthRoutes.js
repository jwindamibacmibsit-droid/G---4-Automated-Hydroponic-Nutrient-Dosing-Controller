const express = require("express");
const pool = require("../config/supabase");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Health API is working"
    });
});

router.get("/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");

        res.json({
            success: true,
            message: "Supabase PostgreSQL connected successfully",
            database: "Supabase",
            time: result.rows[0].current_time
        });

    } catch (error) {
        console.error("DATABASE HEALTH ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

module.exports = router;