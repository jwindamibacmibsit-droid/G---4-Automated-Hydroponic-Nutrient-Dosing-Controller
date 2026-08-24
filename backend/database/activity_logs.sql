CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT,

    device_id BIGINT,

    activity_type VARCHAR(40) NOT NULL
        CHECK (
            activity_type IN (
                'login',
                'logout',
                'sensor_update',
                'pump_started',
                'pump_stopped',
                'pump_speed_changed',
                'nutrient_dosed',
                'ph_adjusted',
                'water_checked',
                'system_update',
                'error',
                'other'
            )
        ),

    message VARCHAR(255) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_activity_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE SET NULL
);


CREATE INDEX idx_activity_logs_created
ON activity_logs(created_at DESC);