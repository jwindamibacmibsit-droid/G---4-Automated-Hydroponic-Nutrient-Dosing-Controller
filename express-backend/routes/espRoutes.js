
const express = require("express");
const router = express.Router();

const {
    receiveSensorData,
    getNextPumpCommand,
    reportPumpResult
} = require("../controllers/espController");

router.post("/sensors", receiveSensorData);

router.get("/commands/next", getNextPumpCommand);

router.post("/commands/:id/result", reportPumpResult);

module.exports = router;
