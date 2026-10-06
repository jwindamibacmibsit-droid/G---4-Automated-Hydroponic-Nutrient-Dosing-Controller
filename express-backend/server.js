require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/supabase");

const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const sensorRoutes = require("./routes/sensorRoutes");

const app = express();

// ==========================================
// CORS
// ==========================================

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
        "Authorization"
    ],

    credentials: false,

    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Explicitly handle browser preflight requests
app.options(/.*/, cors(corsOptions));


app.use(express.json());

// ==========================================
// ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/health", healthRoutes);

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "HydroControl API is running"
    });
});


app.get('/api', (req, res) => {
  res.json({ message: "HydroControl API is running smoothly!" });
});

// ==========================================
// DATABASE TEST
// ==========================================

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "Supabase database connected!",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("DATABASE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}