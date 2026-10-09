
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

// ESP32 endpoints: device token required.
router.post("/sensors", validDevice, receiveSensorData);
router.get("/commands/next", validDevice, getNextPumpCommand);
router.post("/commands/:id/result", validDevice, reportPumpResult);

// Website endpoints: Supabase user session required.
router.get("/dashboard/latest", requireUser, getLatestSensorData);
router.post("/pumps/commands", requireUser, createPumpCommand);

module.exports = router;
