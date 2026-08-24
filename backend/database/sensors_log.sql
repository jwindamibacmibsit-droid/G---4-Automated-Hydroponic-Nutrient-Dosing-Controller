CREATE TABLE sensor_logs (
    id SERIAL PRIMARY KEY,
    ph_level NUMERIC(4,2) NOT NULL,
    water_level NUMERIC(5,2) NOT NULL,
    solenoid_status VARCHAR(20) DEFAULT 'OFF',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
