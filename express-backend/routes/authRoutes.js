
const express = require("express");

const {
    login,
    getSession,
    logout
} = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.get("/session", getSession);
router.post("/logout", logout);

// Optional API connectivity check.
router.get("/login", (req, res) => {
    res.json({
        success: true,
        message: "Authentication API is working."
    });
});

module.exports = router;
