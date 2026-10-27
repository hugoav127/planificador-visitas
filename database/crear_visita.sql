
CREATE OR REPLACE FUNCTION crear_visita(
    p_tecnico INTEGER,
    p_obra INTEGER,
    p_inicio TIMESTAMP,
    p_fin TIMESTAMP
)
RETURNS TABLE (
    valido BOOLEAN,
    error TEXT,
    visita_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    tecnico INTEGER;
    nueva_id INTEGER;
BEGIN
    -- Comprueba que el técnico existe y bloquea su agenda.
    SELECT id INTO tecnico
    FROM tecnicos
    WHERE id = p_tecnico
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'El técnico no existe'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Comprueba que la obra existe.
    PERFORM 1 FROM obras WHERE id = p_obra;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'La obra no existe'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Comprueba que la visita se realiza en un día laborable.
    IF EXTRACT(ISODOW FROM p_inicio) IN (6, 7) THEN
        RETURN QUERY SELECT FALSE, 'Las visitas solo pueden programarse de lunes a viernes.'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Comprueba que la visita respeta la jornada laboral.
    IF p_inicio IS NULL OR p_fin IS NULL
       OR p_inicio::DATE <> p_fin::DATE
       OR p_inicio::TIME < TIME '08:00'
       OR p_fin::TIME > TIME '17:00'
       OR p_fin <= p_inicio THEN

        RETURN QUERY SELECT FALSE, 'Horario fuera de la jornada laboral'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Comprueba que no existen visitas solapadas.
    IF EXISTS (
        SELECT 1 FROM visitas v
        WHERE v.tecnico_id = p_tecnico
          AND v.estado = 'Programada'
          AND p_inicio < v.fecha_fin
          AND p_fin > v.fecha_inicio
    ) THEN
        RETURN QUERY SELECT FALSE, 'El técnico ya tiene una visita en ese horario'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Comprueba los 30 minutos entre obras diferentes.
    IF EXISTS (
        SELECT 1 FROM visitas v
        WHERE v.tecnico_id = p_tecnico
          AND v.obra_id <> p_obra
          AND v.estado = 'Programada'
          AND p_inicio < v.fecha_fin + INTERVAL '30 minutes'
          AND p_fin > v.fecha_inicio - INTERVAL '30 minutes'
    ) THEN
        RETURN QUERY SELECT FALSE, 'Se necesitan 30 minutos entre obras diferentes'::TEXT, NULL::INTEGER;
        RETURN;
    END IF;

    -- Guarda la visita después de superar las comprobaciones.
    INSERT INTO visitas (
        tecnico_id,
        obra_id,
        fecha_inicio,
        fecha_fin,
        estado
    )
    VALUES (
        p_tecnico,
        p_obra,
        p_inicio,
        p_fin,
        'Programada'
    )
    RETURNING id INTO nueva_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT, nueva_id;
END;
$$;
