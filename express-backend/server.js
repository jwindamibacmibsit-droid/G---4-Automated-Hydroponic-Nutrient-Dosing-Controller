require("dotenv").config();


const express = require("express");
const cors = require("cors");


const supabase = require("./config/supabase");

const authRoutes = require("./routes/authRoutes");
const healthRoutes = require("./routes/healthRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const systemLogsRoutes = require("./routes/logRoutes");
const iotRoutes = require("./routes/espRoutes");


const app = express();

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


app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/system", systemLogsRoutes);
app.use("/api/iot", iotRoutes);




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