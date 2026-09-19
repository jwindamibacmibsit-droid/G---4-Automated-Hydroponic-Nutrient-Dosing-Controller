CREATE TABLE dosing_log (
    id SERIAL PRIMARY KEY,

    device_id INT NOT NULL,

    dosing_type VARCHAR(30) NOT NULL,
    amount_ml NUMERIC(10,2),
    duration_ms INT,

    trigger_type VARCHAR(30) NOT NULL,
    target_parameter VARCHAR(30) NOT NULL,

    before_value NUMERIC(6,2),
    after_value NUMERIC(6,2),

    status VARCHAR(20) NOT NULL DEFAULT 'completed',

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dosing_device
        FOREIGN KEY (device_id)
        REFERENCES devices(id)
        ON DELETE CASCADE
);