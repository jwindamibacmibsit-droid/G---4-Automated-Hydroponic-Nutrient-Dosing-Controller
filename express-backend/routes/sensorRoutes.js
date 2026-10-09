const express = require("express");

const router = express.Router();

const {
    getLatestReading,
    getSensorHistory,
    getDeviceStatus
} = require("../controllers/sensorController");


router.get("/latest", getLatestReading);

router.get("/history", getSensorHistory);

router.get("/device-status", getDeviceStatus);


module.exports = router;