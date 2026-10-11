
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
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

// =====================================================
// SERVER CONFIGURATION
// =====================================================

const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 5000;

if (isProduction) {
    // Required when HTTPS is terminated by a trusted proxy.
    app.set("trust proxy", 1);
}

if (!process.env.SESSION_SECRET) {
    throw new Error(
        "SESSION_SECRET is missing from environment variables."
    );
}

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hydrocontrol.site",
    "https://www.hydrocontrol.site"
]);

const corsOptions = {
    origin(origin, callback) {
        // Requests without Origin may include ESP32/API clients.
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        console.error("Blocked CORS origin:", origin);

        return callback(
            new Error("Origin not allowed by CORS")
        );
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

// Handle preflight requests before API routes.
app.options(/.*/, cors(corsOptions));

// =====================================================
// REQUEST BODY PARSING
// =====================================================

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SESSION CONFIGURATION
// =====================================================

app.use(
    session({
        name: "hydrocontrol.sid",
        secret: process.env.SESSION_SECRET,

        resave: false,
        saveUninitialized: false,
        rolling: true,

        cookie: {
            httpOnly: true,

            // Production must use HTTPS.
            secure: isProduction,

            // The frontend and API are subdomains of the
            // same site, so Lax normally works.
            sameSite: "lax",

            path: "/",
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

// IMPORTANT:
// express-session's default MemoryStore is not suitable
// for multi-instance production deployments. Configure a
// shared persistent session store if you run multiple
// API instances or require sessions to survive restarts.

// =====================================================
// SESSION AUTHENTICATION CHECK
// GET /api/auth/session
// =====================================================

app.get("/api/auth/session", (req, res) => {
    res.set("Cache-Control", "no-store");

    if (!req.session?.user?.id) {
        return res.status(401).json({
            success: false,
            authenticated: false,
            message: "Authentication required. Please log in again."
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
// OPTIONAL SESSION DEBUG ENDPOINT
// GET /api/auth/session-debug
//
// Enable only temporarily when debugging.
// Never expose session IDs, cookies, or secrets.
// =====================================================

if (!isProduction) {
    app.get("/api/auth/session-debug", (req, res) => {
        return res.json({
            hasSession: Boolean(req.session),
            hasUser: Boolean(req.session?.user),
            hasUserId: Boolean(req.session?.user?.id),
            authenticated: Boolean(req.session?.user?.id),
            cookieReceived: Boolean(req.headers.cookie)
        });
    });
}

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/sensors", sensorRoutes);

app.use("/api/health", healthRoutes);

app.use("/api/system", systemLogsRoutes);

app.use("/api/esp", espRoutes);

app.use("/api/settings", settingsRoutes);

// =====================================================
// ROOT HEALTH CHECK
// GET /
// =====================================================

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "HydroControl API is running"
    });
});

// =====================================================
// API HEALTH CHECK
// GET /api
// =====================================================

app.get("/api", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "HydroControl API is running smoothly!"
    });
});

// =====================================================
// DATABASE TEST
// GET /api/test
// =====================================================

app.get("/api/test", async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from("pumps")
            .select("*");

        if (error) {
            console.error(
                "Supabase database test failed:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve pumps."
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return next(error);
    }
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API endpoint not found.",
        path: req.path
    });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
    console.error(
        "API ERROR:",
        err.message
    );

    if (res.headersSent) {
        return next(err);
    }

    // Handle CORS errors without exposing internal details.
    if (err.message === "Origin not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "Origin not allowed."
        });
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred."
    });
});

// =====================================================
// START SERVER
// =====================================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(
            `HydroControl API listening on port ${PORT}`
        );

        console.log(
            `Environment: ${isProduction ? "production" : "development"}`
        );
    });
}

module.exports = app;