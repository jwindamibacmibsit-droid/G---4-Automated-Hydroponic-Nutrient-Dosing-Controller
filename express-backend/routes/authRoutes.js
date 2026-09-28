const express = require("express");

const router = express.Router();

const { login } = require("../controllers/authController");

console.log("AUTH ROUTES LOADED");

router.get("/login", (req, res) => {
    res.json({
        success: true,
        message: "Authentication API is working."
    });
});

router.post("/login", login);

module.exports = router;
