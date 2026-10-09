
const express = require("express");
const router = express.Router();

const {
    validDevice,
    receiveSensorData,
    getNextPumpCommand,
    reportPumpResult,
} = require("../controllers/espController");

router.post("/sensors", validDevice, receiveSensorData);
router.get("/commands/next", validDevice, getNextPumpCommand);
router.post("/commands/:id/result", validDevice, reportPumpResult);

module.exports = router;
