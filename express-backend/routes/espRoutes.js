const express = require("express");

const router = express.Router();

const {
    receiveSensorData,
    receivePumpEvent
} = require("../controllers/espController");


// ==========================================
// ESP32 SENSOR DATA
// POST /api/iot/sensors
// ==========================================

router.post(
    "/sensors",
    receiveSensorData
);


// ==========================================
// ESP32 PUMP EVENTS
// POST /api/iot/pump-event
// ==========================================

router.post(
    "/pump-event",
    receivePumpEvent
);


module.exports = router;