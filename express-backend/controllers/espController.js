const supabase = require("../config/supabase");

/*
|--------------------------------------------------------------------------
| RECEIVE SENSOR DATA
|--------------------------------------------------------------------------
| ESP32 -> Express -> Supabase
|
| POST /api/iot/sensors
|
| Example:
| {
|   "device_uid": "ESP32-HYDRO-001",
|   "ph_value": 6.20,
|   "water_level": 24.50,
|   "temperature": 27.30,
|   "nutrient_a": 80,
|   "nutrient_b": 75
| }
|--------------------------------------------------------------------------
*/

exports.receiveSensorData = async (req, res) => {
    try {
        const {
            device_uid,
            ph_value,
            water_level,
            nutrient_a,
            nutrient_b
        } = req.body;

        if (!device_uid) {
            return res.status(400).json({
                success: false,
                message: "device_uid is required"
            });
        }

        // Find ESP32 device
        const { data: device, error: deviceError } = await supabase
            .from("devices")
            .select("id, device_uid")
            .eq("device_uid", device_uid)
            .single();

        if (deviceError || !device) {
            console.error("DEVICE ERROR:", deviceError);

            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        // Update device status
        const { error: updateError } = await supabase
            .from("devices")
            .update({
                status: "online",
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("id", device.id);

        if (updateError) {
            throw updateError;
        }

        // Save sensor reading
        const { data: reading, error: readingError } = await supabase
            .from("sensor_reading")
            .insert({
                device_id: device.id,
                ph_value: ph_value ?? null,
                water_level: water_level ?? null,
                temperature: temperature ?? null,
                nutrient_a: nutrient_a ?? null,
                nutrient_b: nutrient_b ?? null
            })
            .select()
            .single();

        if (readingError) {
            throw readingError;
        }

        return res.status(201).json({
            success: true,
            message: "Sensor data saved successfully",
            data: reading
        });

    } catch (error) {
        console.error("SENSOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save sensor data",
            error: error.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| RECEIVE PUMP EVENT
|--------------------------------------------------------------------------
| ESP32 -> Express -> Supabase
|
| POST /api/iot/pump-event
|
| Example:
| {
|   "device_uid": "ESP32-HYDRO-001",
|   "pump_id": 2,
|   "duration_seconds": 5,
|   "amount_ml": 75,
|   "dosing_type": "nutrient_a",
|   "control_mode": "auto",
|   "status": "completed"
| }
|--------------------------------------------------------------------------
*/

exports.receivePumpEvent = async (req, res) => {
    try {
        const {
            device_uid,
            pump_id,
            duration_seconds,
            amount_ml,
            dosing_type,
            control_mode,
            status
        } = req.body;

        // Validate required fields
        if (!device_uid) {
            return res.status(400).json({
                success: false,
                message: "device_uid is required"
            });
        }

        if (!pump_id) {
            return res.status(400).json({
                success: false,
                message: "pump_id is required"
            });
        }

        if (!amount_ml || Number(amount_ml) <= 0) {
            return res.status(400).json({
                success: false,
                message: "amount_ml must be greater than 0"
            });
        }

        // Find device
        const { data: device, error: deviceError } = await supabase
            .from("devices")
            .select("id, device_uid")
            .eq("device_uid", device_uid)
            .single();

        if (deviceError || !device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        // Update device online status
        const { error: deviceUpdateError } = await supabase
            .from("devices")
            .update({
                status: "online",
                last_seen: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq("id", device.id);

        if (deviceUpdateError) {
            throw deviceUpdateError;
        }

        // Find pump belonging to this ESP32
        const { data: pump, error: pumpError } = await supabase
            .from("pumps")
            .select("id, pump_name, pump_type, device_id")
            .eq("id", pump_id)
            .eq("device_id", device.id)
            .single();

        if (pumpError || !pump) {
            console.error("PUMP ERROR:", pumpError);

            return res.status(404).json({
                success: false,
                message: "Pump not found for this device"
            });
        }

        // Set pump active
        const { error: activeError } = await supabase
            .from("pumps")
            .update({
                status: "active"
            })
            .eq("id", pump.id);

        if (activeError) {
            throw activeError;
        }

        // Insert dosing log
        const { data: dosing, error: dosingError } = await supabase
            .from("dosing_logs")
            .insert({
                pump_id: pump.id,
                dosing_type: dosing_type || pump.pump_type,
                amount_ml: Number(amount_ml),
                duration_seconds: duration_seconds
                    ? Number(duration_seconds)
                    : null,
                control_mode: control_mode || "auto",
                status: status || "completed"
            })
            .select()
            .single();

        if (dosingError) {
            // If logging failed, mark pump as error
            await supabase
                .from("pumps")
                .update({
                    status: "error"
                })
                .eq("id", pump.id);

            throw dosingError;
        }

        // Pump finished
        const { error: inactiveError } = await supabase
            .from("pumps")
            .update({
                status: "inactive"
            })
            .eq("id", pump.id);

        if (inactiveError) {
            console.error("PUMP STATUS ERROR:", inactiveError);
        }

        return res.status(201).json({
            success: true,
            message: "Pump event saved successfully",
            data: {
                pump: pump,
                dosing_log: dosing
            }
        });

    } catch (error) {
        console.error("PUMP EVENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save pump event",
            error: error.message
        });
    }
};