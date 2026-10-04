const express = require("express");

const router = express.Router();

const {
    getLatestReading,
    getSensorHistory
} = require("../controllers/sensorController");


router.get("/latest", getLatestReading);

router.get("/history", getSensorHistory);


module.exports = router;