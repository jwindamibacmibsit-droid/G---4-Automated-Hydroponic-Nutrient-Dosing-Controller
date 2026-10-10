
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const supabase = require("./config/supabase");

const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const systemLogsRoutes = require("./routes/logRoutes");
const espRoutes = require("./routes/espRoutes");

const app = express();

// =====================================================
// SERVER CONFIGURATION
// =====================================================

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hydrocontrol.site",
    "https://www.hydrocontrol.site"
]);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        console.error(`Blocked CORS origin: ${origin}`);
        return callback(new Error("Origin not allowed by CORS"));
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-device-token"
    ],

    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle CORS preflight requests before API routes.
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SESSION CONFIGURATION
// =====================================================

if (!process.env.SESSION_SECRET) {
    throw new Error(
        "SESSION_SECRET is missing from your environment configuration."
    );
}

app.use(
    session({
        name: "hydrocontrol.sid",
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        rolling: true,

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// =====================================================
// AUTHENTICATION SESSION CHECK
// GET /api/auth/session
// =====================================================

app.get("/api/auth/session", (req, res) => {
    if (!req.session?.user?.id) {
        return res.status(401).json({
            success: false,
            authenticated: false,
            message: "Authentication required."
        });
    }

    return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
            id: req.session.user.id,
            name: req.session.user.name,
            email: req.session.user.email,
            role: req.session.user.role
        }
    });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/system", systemLogsRoutes);
app.use("/api/esp", espRoutes);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HydroControl API is running"
    });
});

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "HydroControl API is running smoothly!"
    });
});

// =====================================================
// DATABASE TEST
// GET /api/test
// =====================================================

app.get("/api/test", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("pumps")
            .select("*");

        if (error) {
            console.error("Supabase error:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve pumps.",
                error: error.message
            });
        }

        return res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Database test error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error("API ERROR:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

module.exports = app;

// =====================================================
// START SERVER
// =====================================================

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`HydroControl API listening on port ${PORT}`);
    });
}
