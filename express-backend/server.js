const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(helmet());

// Block ?url=
app.use((req, res, next) => {
    if (req.query.url !== undefined) {
        return res.status(403).json({
            success: false,
            message: "URL parameter is not allowed"
        });
    }

    next();
});

// Block sensitive files
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

// CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    })
);

// Limit JSON request size
app.use(
    express.json({
        limit: "10kb"
    })
);

// General API rate limit
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

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/sensors", require("./routes/sensorRoutes"));

// Root
app.get("/", (req, res) => {
    res.json({
        message: "HydroControl backend is running!"
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});