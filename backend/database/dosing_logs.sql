CREATE TABLE dosing_logs (
    id BIGSERIAL PRIMARY KEY,

    pump_id BIGINT,

    nutrient_tank_id BIGINT,

    user_id BIGINT,

    dosing_type VARCHAR(30) NOT NULL
        CHECK (
            dosing_type IN (
                'nutrient_a',
                'nutrient_b',
                'ph_up',
                'ph_down'
            )
        ),

    amount_ml NUMERIC(10,2) NOT NULL
        CHECK (amount_ml > 0),

    duration_seconds NUMERIC(10,2),

    control_mode VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (control_mode IN ('auto', 'manual')),

    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (
            status IN (
                'pending',
                'running',
                'completed',
                'failed'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dosing_pump
        FOREIGN KEY (pump_id)
        REFERENCES pumps(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_dosing_tank
        FOREIGN KEY (nutrient_tank_id)
        REFERENCES nutrient_tanks(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_dosing_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


CREATE INDEX idx_dosing_logs_created
ON dosing_logs(created_at DESC);
