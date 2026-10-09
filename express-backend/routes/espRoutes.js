
const express = require("express");


const router = express.Router();

const espController = require("../controllers/espController");

// ESP32 endpoints
router.post(
    "/sensors",
    espController.validDevice,
    espController.receiveSensorData
);

router.get(
    "/commands/next",
    espController.validDevice,
    espController.getNextPumpCommand
);

router.post(
    "/commands/:id/result",
    espController.validDevice,
    espController.reportPumpResult
);

// Website endpoints
router.get(
    "/dashboard/latest",
    espController.requireUser,
    espController.getLatestSensorData
);

router.post(
    "/pumps/commands",
    espController.requireUser,
    espController.createPumpCommand
);

module.exports = router;
