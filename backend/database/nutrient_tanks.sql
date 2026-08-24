CREATE TABLE nutrient_tanks (
    id BIGSERIAL PRIMARY KEY,

    tank_name VARCHAR(100) NOT NULL,

    nutrient_type VARCHAR(20) NOT NULL
        CHECK (nutrient_type IN ('A', 'B', 'other')),

    capacity_ml NUMERIC(10,2) NOT NULL
        CHECK (capacity_ml >= 0),

    remaining_ml NUMERIC(10,2) NOT NULL
        CHECK (remaining_ml >= 0),

    low_level_ml NUMERIC(10,2) NOT NULL DEFAULT 100,

    status VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (
            status IN (
                'normal',
                'low',
                'empty'
            )
        ),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);