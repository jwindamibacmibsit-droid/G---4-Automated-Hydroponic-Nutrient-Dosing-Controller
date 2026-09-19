const express = require("express");

const router = express.Router();

const {
    getLatestReading,
    getSensorHistory
} = require("../controllers/sensorController");

// ==========================================
// GET LATEST SENSOR READING
// ==========================================

router.get("/latest", getLatestReading);

// ==========================================
// GET SENSOR HISTORY
// ==========================================

router.get("/history", getSensorHistory);

module.exports = router;