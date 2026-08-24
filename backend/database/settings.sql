CREATE TABLE ec_settings (
    id BIGSERIAL PRIMARY KEY,

    target_ec NUMERIC(6,3) NOT NULL DEFAULT 1.800,

    minimum_ec NUMERIC(6,3) NOT NULL DEFAULT 1.200,

    maximum_ec NUMERIC(6,3) NOT NULL DEFAULT 2.400,

    auto_mode BOOLEAN NOT NULL DEFAULT TRUE,

    updated_by BIGINT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ec_settings_user
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);
