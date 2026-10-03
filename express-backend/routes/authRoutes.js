const express = require("express");

const { login } = require("../controllers/authController");

const router = express.Router();

console.log("AUTH ROUTES LOADED");

router.get("/login", (req, res) => {
    res.json({
        success: true,
        message: "Authentication API is working."
    });
});

router.post("/login", login);

module.exports = router;