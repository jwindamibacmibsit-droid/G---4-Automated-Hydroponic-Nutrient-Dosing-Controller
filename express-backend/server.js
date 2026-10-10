require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session"); // <-- 1. Import express-session

const supabase = require("./config/supabase");

const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const systemLogsRoutes = require("./routes/logRoutes");
const esp = require("./routes/espRoutes");

const app = express();

// Required if hosted behind a reverse proxy (Nginx, Render, Heroku, etc.) with HTTPS
app.set("trust proxy", 1);

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://hydrocontrol.site",
        "https://www.hydrocontrol.site"
    ],
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
        "x-device-token"
    ],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // <-- Add this line to force-handle preflight requests

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. ADD SESSION MIDDLEWARE (MUST BE BEFORE ROUTES)
// ==========================================
app.use(
    session({
        secret: process.env.SESSION_SECRET || "31973faf6920834c752afddf09d24e0f0505374907be33869984d3c8291a73ac",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" is required for cross-subdomain cookies
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 1 day session validity
        }
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/system", systemLogsRoutes);
app.use("/api/esp", esp);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HydroControl API is running"
    });
});

app.get("/api", (req, res) => {
    res.json({
        message: "HydroControl API is running smoothly!"
    });
});

app.get("/api/test", async (req, res) => {
    const { data, error } = await supabase
        .from("pumps")
        .select("*");

    if (error) {
        console.error("Supabase error:", error);

        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json({
        success: true,
        data
    });
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}