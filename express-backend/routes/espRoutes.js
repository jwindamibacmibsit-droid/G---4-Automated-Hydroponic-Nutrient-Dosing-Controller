
const express = require("express");
const router = express.Router();

const {
    validDevice,
    requireUser,
    receiveSensorData,
    getLatestSensorData,
    createPumpCommand,
    getNextPumpCommand,
    reportPumpResult
} = require("../controllers/espController");

// =====================================================
// ESP32: SENSOR DATA
// POST /api/esp/sensors
// Authentication: x-device-token
// =====================================================
router.post(
    "/sensors",
    validDevice,
    receiveSensorData
);

// =====================================================
// WEBSITE: LATEST SENSOR DATA
// GET /api/esp/dashboard/latest
// =====================================================
router.get(
    "/dashboard/latest",
    getLatestSensorData
);

// =====================================================
// WEBSITE: CREATE PUMP COMMAND
// POST /api/esp/pumps/commands
// Authentication: Express login session
// =====================================================
router.post(
    "/pumps/commands",
    requireUser,
    createPumpCommand
);

// =====================================================
// ESP32: GET NEXT PUMP COMMAND
// GET /api/esp/commands/next
// Authentication: x-device-token
// =====================================================
router.get(
    "/commands/next",
    validDevice,
    getNextPumpCommand
);

// =====================================================
// ESP32: REPORT PUMP RESULT
// POST /api/esp/commands/:id/result
// Authentication: x-device-token
// =====================================================
router.post(
    "/commands/:id/result",
    validDevice,
    reportPumpResult
);

module.exports = router;
