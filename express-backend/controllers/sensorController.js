const pool = require("../config/database");

// ==========================================
// GET LATEST SENSOR READING
// ==========================================

const getLatestReading = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                device_id,
                ph_value,
                water_level,
                temperature,
                nutrient_a,
                nutrient_b,
                timestamp
            FROM sensor_reading
            ORDER BY timestamp DESC
            LIMIT 1
        `);

        console.log(
            "Latest sensor reading:",
            result.rows
        );

        // No data
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sensor readings found."
            });
        }

        const reading = result.rows[0];

        // Send data to React
        res.status(200).json({
            success: true,
            data: {
                id: reading.id,

                device_id: reading.device_id,

                ph_value:
                    reading.ph_value !== null
                        ? Number(reading.ph_value)
                        : null,

                water_level:
                    reading.water_level !== null
                        ? Number(reading.water_level)
                        : null,

                temperature:
                    reading.temperature !== null
                        ? Number(reading.temperature)
                        : null,

                nutrient_a:
                    reading.nutrient_a !== null
                        ? Number(reading.nutrient_a)
                        : null,

                nutrient_b:
                    reading.nutrient_b !== null
                        ? Number(reading.nutrient_b)
                        : null,

                timestamp: reading.timestamp
            }
        });

    } catch (error) {
        console.error(
            "SENSOR DATABASE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve sensor reading.",
            error: error.message
        });
    }
};

// ==========================================
// GET SENSOR HISTORY
// ==========================================

const getSensorHistory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                device_id,
                ph_value,
                water_level,
                temperature,
                nutrient_a,
                nutrient_b,
                timestamp
            FROM sensor_reading
            ORDER BY timestamp DESC
            LIMIT 20
        `);

        console.log(
            "Sensor history:",
            result.rows.length,
            "readings"
        );

        const history = result.rows
            .reverse()
            .map((reading) => ({
                id: reading.id,

                device_id: reading.device_id,

                ph_value:
                    reading.ph_value !== null
                        ? Number(reading.ph_value)
                        : null,

                water_level:
                    reading.water_level !== null
                        ? Number(reading.water_level)
                        : null,

                temperature:
                    reading.temperature !== null
                        ? Number(reading.temperature)
                        : null,

                nutrient_a:
                    reading.nutrient_a !== null
                        ? Number(reading.nutrient_a)
                        : null,

                nutrient_b:
                    reading.nutrient_b !== null
                        ? Number(reading.nutrient_b)
                        : null,

                timestamp: reading.timestamp
            }));

        res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error(
            "SENSOR HISTORY DATABASE ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve sensor history.",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getLatestReading,
    getSensorHistory
};