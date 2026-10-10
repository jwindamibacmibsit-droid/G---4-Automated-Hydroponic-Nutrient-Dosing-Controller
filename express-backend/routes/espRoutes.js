const express = require("express");
const router = express.Router();

const {
    validDevice,
    requireUser,
    receiveSensorData,
    getLatestSensorData,
    createPumpCommand,
    getNextPumpCommand,
    reportPumpResult,
} = require("../controllers/espController");

// ESP32-only endpoints
router.post("/sensors", validDevice, receiveSensorData);
router.get("/commands/next", validDevice, getNextPumpCommand);
router.post("/commands/:id/result", validDevice, reportPumpResult);

// Website/user endpoints
router.post("/pumps/commands", requireUser, createPumpCommand);
router.get("/dashboard/latest", requireUser, getLatestSensorData);

module.exports = router;