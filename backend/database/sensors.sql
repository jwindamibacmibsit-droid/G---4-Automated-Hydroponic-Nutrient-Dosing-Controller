CREATE TABLE sensors (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT NOT NULL,

    sensor_name VARCHAR(100) NOT NULL,

    sensor_type VARCHAR(30) NOT NULL
        CHECK (
            sensor_type IN (
                'water_level',
                'temperature',
                'flow',
                'ph',
                'ec',
                'other'
            )
        ),

    gpio VARCHAR(30),
    measurement_unit VARCHAR(30),

    min_value NUMERIC(12,4),
    max_value NUMERIC(12,4),

    status VARCHAR(20) NOT NULL DEFAULT 'offline'
        CHECK (status IN ('online', 'offline', 'error')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sensor_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE CASCADE
);