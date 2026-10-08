const express = require("express");

const router = express.Router();

const {
    receiveSensorData,
    receivePumpEvent
} = require("../controllers/iotController");


// ESP32 sensor data
router.post("/sensors", receiveSensorData);


// ESP32 pump events
router.post("/pump-event", receivePumpEvent);


module.exports = router;