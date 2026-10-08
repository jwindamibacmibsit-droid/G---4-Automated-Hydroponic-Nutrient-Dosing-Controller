const express = require("express");

const router = express.Router();

const {
    receiveSensorData,
    receivePumpEvent
} = require("../controllers/espController");


// ESP32 sensor data
router.get("/sensors", receiveSensorData);


// ESP32 pump events
router.get("/pump-event", receivePumpEvent);


module.exports = router;