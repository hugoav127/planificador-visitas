INSERT INTO tecnicos (nombre)
SELECT datos.nombre
FROM (
    VALUES
        ('Carlos Martínez'),
        ('Laura Fernández'),
        ('David Romero'),
        ('Marta Sánchez')
) AS datos(nombre)
WHERE NOT EXISTS (
    SELECT 1
    FROM tecnicos t
    WHERE t.nombre = datos.nombre
);


-- Inserta las obras de ejemplo.

INSERT INTO obras (nombre, municipio)
SELECT datos.nombre, datos.municipio
FROM (
    VALUES
        ('Reforma Centro Cívico', 'Terrassa'),
        ('Construcción Residencial Norte', 'Sabadell'),
        ('Rehabilitación Biblioteca', 'Barcelona'),
        ('Instalación Polideportivo', 'Rubí'),
        ('Ampliación Escuela Municipal', 'Sant Cugat'),
        ('Reforma Hospital Municipal', 'Badalona'),
        ('Construcción Centro Comercial', 'Granollers'),
        ('Rehabilitación Edificio Histórico', 'Barcelona'),
        ('Instalación Planta Fotovoltaica', 'Mataró'),
        ('Ampliación Centro de Salud', 'Cerdanyola del Vallès')
) AS datos(nombre, municipio)
WHERE NOT EXISTS (
    SELECT 1
    FROM obras o
    WHERE o.nombre = datos.nombre
      AND o.municipio = datos.municipio
);