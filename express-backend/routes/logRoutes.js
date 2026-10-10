
const express = require("express");

const {
    getSystemLogs,
    getEventHistory
} = require("../controllers/logsController");

const router = express.Router();

// System audit logs from public.system_logs
router.get("/logs", getSystemLogs);

// Sensor event history from public.sensor_reading
router.get("/events", getEventHistory);

module.exports = router;
