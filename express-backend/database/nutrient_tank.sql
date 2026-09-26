CREATE TABLE nutrient_tanks (
    id BIGSERIAL NOT NULL,
    tank_name VARCHAR(50) NOT NULL,
    nutrient_type VARCHAR(30) NOT NULL,
    capacity_ml NUMERIC(10,2) NOT NULL,
    current_level_ml NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT nutrient_tanks_type_check
        CHECK (
            nutrient_type IN (
                'nutrient_a',
                'nutrient_b',
                'ph_up',
                'ph_down'
            )
        ),

    CONSTRAINT nutrient_tanks_capacity_check
        CHECK (capacity_ml > 0),

    CONSTRAINT nutrient_tanks_level_check
        CHECK (
            current_level_ml >= 0
            AND current_level_ml <= capacity_ml
        ),

    CONSTRAINT nutrient_tanks_status_check
        CHECK (
            status IN (
                'available',
                'low',
                'empty'
            )
        )
);