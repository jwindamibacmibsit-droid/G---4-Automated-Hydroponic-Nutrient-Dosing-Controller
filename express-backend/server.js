const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Hide Express information
app.disable("x-powered-by");

// ============================================================
// SECURITY HEADERS
// ============================================================
app.use(helmet());

// ============================================================
// BLOCK ?url= QUERY PARAMETER
// ============================================================
app.use((req, res, next) => {
    if (req.query.url !== undefined) {
        return res.status(403).json({
            success: false,
            message: "URL parameter is not allowed"
        });
    }

    next();
});

// ============================================================
// BLOCK SENSITIVE FILES
// ============================================================
app.use((req, res, next) => {
    const path = req.path.toLowerCase();

    if (
        path === "/.env" ||
        path.startsWith("/.env.") ||
        path === "/.git" ||
        path.startsWith("/.git/") ||
        path === "/.gitignore"
    ) {
        return res.status(404).json({
            success: false,
            message: "Not found"
        });
    }

    next();
});

// ============================================================
// CORS
// ============================================================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hydrocontrol-seven.vercel.app"
];

app.use(
    cors({
        origin: function (origin, callback) {

            // Allow requests with no origin
            // such as ESP32/Postman/server-to-server
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.log("CORS BLOCKED:", origin);

            return callback(
                new Error("Not allowed by CORS")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept"
        ],

        credentials: true
    })
);

// ============================================================
// JSON BODY LIMIT
// ============================================================
app.use(
    express.json({
        limit: "10kb"
    })
);

// ============================================================
// RATE LIMITING
// ============================================================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later."
    }
});

app.use("/api", apiLimiter);

// ============================================================
// IMPORT ROUTES
// ============================================================
const authRoutes = require("./routes/authRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const logRoutes = require("./routes/logRoutes");

/* Debug check
console.log("authRoutes:", typeof authRoutes);
console.log("sensorRoutes:", typeof sensorRoutes);
console.log("logRoutes:", typeof logRoutes);*/

// ============================================================
// API ROUTES
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/logs", logRoutes);

// ============================================================
// ROOT
// ============================================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HydroControl backend is running!"
    });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// module.exports = app;
module.exports = app;

// Start server only when running locally
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(
            `HydroControl backend running on http://localhost:${PORT}`
        );
    });
}
