const express = require("express");
const router = express.Router();

const {
    getSystemLogs,
    getEventHistory
} = require("../controllers/logController");

router.get("/events", getEventHistory);
router.get("/logs", getSystemLogs);

module.exports = router;