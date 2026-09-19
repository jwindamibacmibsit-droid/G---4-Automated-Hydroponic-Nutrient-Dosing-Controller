const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const { login } = require("../controllers/authController");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    }
});

router.post("/login", loginLimiter, login);

module.exports = router;