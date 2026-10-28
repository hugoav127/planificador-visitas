CREATE TABLE IF NOT EXISTS tecnicos (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS obras (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    municipio VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS visitas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    tecnico_id INTEGER NOT NULL
        REFERENCES tecnicos(id),

    obra_id INTEGER NOT NULL
        REFERENCES obras(id),

    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    fecha_fin TIMESTAMP WITHOUT TIME ZONE NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Programada',

    CONSTRAINT estado_valido
        CHECK (estado IN (
            'Programada',
            'Cancelada',
            'Completada'
        )),

    CONSTRAINT duracion_valida
        CHECK (fecha_fin > fecha_inicio)
);

-- Facilita la consulta de la agenda de cada técnico.
CREATE INDEX IF NOT EXISTS idx_visitas_tecnico_inicio
    ON visitas (tecnico_id, fecha_inicio);