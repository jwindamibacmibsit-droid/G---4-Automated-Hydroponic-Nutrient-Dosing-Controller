const express = require("express");

const router = express.Router();

const { login } = require("../controllers/authController");

// ============================================================
// POST /api/auth/login
// ============================================================

router.post("/login", login);

// ============================================================
// GET /api/auth
// ============================================================

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Authentication API is working."
    });
});

module.exports = router;
