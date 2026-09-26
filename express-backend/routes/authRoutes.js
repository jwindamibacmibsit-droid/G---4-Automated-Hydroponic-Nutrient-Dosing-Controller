const express = require("express");

const router = express.Router();

const { login } = require("../controllers/authController");

router.post("/login", login);

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Authentication API is working."
    });
});

module.exports = router;