const express = require("express");

const {
    getSystemLogs
} = require("../controllers/logsController");

const router = express.Router();

router.get("/logs", getSystemLogs);

module.exports = router;