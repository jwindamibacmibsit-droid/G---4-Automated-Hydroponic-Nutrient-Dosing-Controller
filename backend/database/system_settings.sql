CREATE TABLE system_settings (
    id BIGSERIAL PRIMARY KEY,

    control_mode VARCHAR(20) NOT NULL DEFAULT 'auto'
        CHECK (control_mode IN ('auto', 'manual')),

    system_name VARCHAR(100) NOT NULL DEFAULT 'HydroControl',

    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Manila',

    low_water_alert_liters NUMERIC(10,2) DEFAULT 150,

    tank_capacity_liters NUMERIC(10,2) DEFAULT 500,

    system_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    updated_by BIGINT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_system_settings_user
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);