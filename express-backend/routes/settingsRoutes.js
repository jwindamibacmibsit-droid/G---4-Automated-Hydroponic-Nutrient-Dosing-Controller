
const express = require("express");
const router = express.Router();

const {
    getSettings,
    updateSettings,
    resetSettings,
} = require("../controllers/settingsController");

// Retrieve current configuration
router.get("/", getSettings);

// Save supplied configuration fields
router.put("/", updateSettings);

// Reset preferences while preserving maintenance mode
router.post("/reset", resetSettings);

module.exports = router;
