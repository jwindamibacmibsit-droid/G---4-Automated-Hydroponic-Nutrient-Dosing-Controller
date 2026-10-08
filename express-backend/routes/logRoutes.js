const express = require("express");

const router = express.Router();

const {
    getSystemLogs
} = require("../controllers/logsController");


// GET /api/logs
router.get("/logs", getSystemLogs);


module.exports = router;