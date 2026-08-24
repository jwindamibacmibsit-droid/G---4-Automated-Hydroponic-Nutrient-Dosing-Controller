CREATE TABLE pumps (
    id BIGSERIAL PRIMARY KEY,

    device_id BIGINT NOT NULL,

    pump_name VARCHAR(100) NOT NULL,

    pump_type VARCHAR(30) NOT NULL
        CHECK (
            pump_type IN (
                'circulation',
                'nutrient_a',
                'nutrient_b',
                'ph_up',
                'ph_down',
                'other'
            )
        ),

    gpio VARCHAR(30) NOT NULL,

    status BOOLEAN NOT NULL DEFAULT FALSE,

    speed NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (speed >= 0 AND speed <= 100),

    flow_rate NUMERIC(10,3) NOT NULL DEFAULT 0,

    runtime_seconds BIGINT NOT NULL DEFAULT 0,

    power_watts NUMERIC(10,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pump_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE CASCADE
);