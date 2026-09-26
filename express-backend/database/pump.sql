CREATE TABLE pumps (
    id BIGSERIAL NOT NULL,
    device_id BIGINT,
    pump_name VARCHAR(50) NOT NULL,
    pump_type VARCHAR(30) NOT NULL,
    pin_number INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_pump_device
        FOREIGN KEY (device_id) REFERENCES devices(id),

    CONSTRAINT pumps_pump_type_check
        CHECK (
            pump_type IN (
                'nutrient_a',
                'nutrient_b',
                'ph_up',
                'ph_down'
            )
        ),

    CONSTRAINT pumps_status_check
        CHECK (
            status IN (
                'active',
                'inactive',
                'error'
            )
        )
);