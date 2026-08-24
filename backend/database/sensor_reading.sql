CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,

    sensor_id BIGINT NOT NULL,

    reading_value NUMERIC(12,4) NOT NULL,

    reading_status VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (
            reading_status IN (
                'normal',
                'warning',
                'critical',
                'error'
            )
        ),

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reading_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensors(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sensor_readings_sensor_time
ON sensor_readings(sensor_id, recorded_at DESC);