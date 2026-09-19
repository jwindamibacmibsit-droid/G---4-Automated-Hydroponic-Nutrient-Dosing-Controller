CREATE TABLE sensor_reading (
    id SERIAL PRIMARY KEY,
    device_id INT NOT NULL,
    ph_value NUMERIC(4,2),
    water_level NUMERIC(6,2),
    temperature NUMERIC(5,2),
    nutrient_a NUMERIC(6,2),
    nutrient_b NUMERIC(6,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sensor_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE CASCADE
);