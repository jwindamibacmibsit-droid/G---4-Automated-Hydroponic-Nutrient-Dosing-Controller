const supabase = require("../config/supabase");

// ==========================================
// GET LATEST SENSOR READING
// ==========================================

const getLatestReading = async (req, res) => {
    try {
        const { data: reading, error } = await supabase
            .from("sensor_reading")
            .select(`
                id,
                device_id,
                ph_value,
                water_level,

                nutrient_a,
                nutrient_b,
                timestamp
            `)
            .order("timestamp", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error("SUPABASE SENSOR ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve sensor reading.",
                error: error.message
            });
        }

        // No data
        if (!reading) {
            return res.status(404).json({
                success: false,
                message: "No sensor readings found."
            });
        }


        // Send data to React
        return res.status(200).json({
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
        console.error("SENSOR DATABASE ERROR:", error);

        return res.status(500).json({
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
        const { data: readings, error } = await supabase
            .from("sensor_reading")
            .select(`
                id,
                device_id,
                ph_value,
                water_level,
                
                nutrient_a,
                nutrient_b,
                timestamp
            `)
            .order("timestamp", { ascending: false })
            .limit(20);

        if (error) {
            console.error(
                "SUPABASE SENSOR HISTORY ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve sensor history.",
                error: error.message
            });
        }

        const history = (readings || [])
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

        return res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error(
            "SENSOR HISTORY DATABASE ERROR:",
            error
        );

        return res.status(500).json({
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