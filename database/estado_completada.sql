BEGIN;

-- Amplía los estados admitidos sin modificar las visitas existentes.
ALTER TABLE visitas DROP CONSTRAINT estado_valido;
ALTER TABLE visitas ADD CONSTRAINT estado_valido
    CHECK (estado IN ('Programada', 'Cancelada', 'Completada'));

COMMIT;
