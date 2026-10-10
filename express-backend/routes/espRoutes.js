
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
router.post(
    "/commands/:id/result",
    validDevice,
    reportPumpResult
);

// Website endpoints
router.post(
    "/pumps/commands",
    requireUser,
    createPumpCommand
);

// Dashboard endpoint; add your existing user authentication
// middleware if this data should only be available to logged-in users.
router.get("/dashboard/latest", getLatestSensorData);

module.exports = router;
