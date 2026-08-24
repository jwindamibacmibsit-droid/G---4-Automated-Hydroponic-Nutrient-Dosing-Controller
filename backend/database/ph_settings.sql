CREATE TABLE ph_settings (
    id BIGSERIAL PRIMARY KEY,

    target_ph NUMERIC(4,2) NOT NULL DEFAULT 6.00,

    minimum_ph NUMERIC(4,2) NOT NULL DEFAULT 5.50,

    maximum_ph NUMERIC(4,2) NOT NULL DEFAULT 6.50,

    auto_mode BOOLEAN NOT NULL DEFAULT TRUE,

    ph_up_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    ph_down_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    dose_amount_ml NUMERIC(10,2) NOT NULL DEFAULT 5,

    dose_interval_seconds INTEGER NOT NULL DEFAULT 30,

    updated_by BIGINT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ph_settings_user
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);