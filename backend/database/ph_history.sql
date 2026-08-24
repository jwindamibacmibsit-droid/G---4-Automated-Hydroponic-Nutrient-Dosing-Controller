CREATE TABLE ph_history (
    id BIGSERIAL PRIMARY KEY,

    ph_value NUMERIC(4,2) NOT NULL,

    action VARCHAR(20) NOT NULL
        CHECK (
            action IN (
                'stable',
                'ph_up',
                'ph_down'
            )
        ),

    amount_ml NUMERIC(10,2),

    status VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (
            status IN (
                'normal',
                'adjusted',
                'warning',
                'critical'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ph_history_created
ON ph_history(created_at DESC);