CREATE TABLE pump_logs (
    id BIGSERIAL PRIMARY KEY,

    pump_id BIGINT NOT NULL,

    user_id BIGINT,

    action VARCHAR(30) NOT NULL
        CHECK (
            action IN (
                'started',
                'stopped',
                'speed_changed',
                'automatic',
                'manual'
            )
        ),

    previous_status BOOLEAN,
    new_status BOOLEAN,

    previous_speed NUMERIC(5,2),
    new_speed NUMERIC(5,2),

    control_mode VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (control_mode IN ('auto', 'manual')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pump_log_pump
        FOREIGN KEY (pump_id)
        REFERENCES pumps(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pump_log_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);