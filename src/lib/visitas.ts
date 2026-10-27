
import { sql } from "./db";
import {
  validarVisita,
  type NuevaVisita,
  type Resultado,
  type Visita,
} from "./validaciones";

export type VisitaDB = {
  id: number;
  tecnicoId: number;
  tecnico: string;
  obraId: number;
  obra: string;
  municipio: string;
  inicio: string;
  fin: string;
  estado: Visita["estado"];
};

export type ResultadoVisita = Resultado & {
  id?: number;
};

// Recupera las visitas con sus técnicos y obras.
export async function listarVisitas(): Promise<VisitaDB[]> {
  const filas = await sql`
    SELECT
      v.id,
      v.tecnico_id AS "tecnicoId",
      t.nombre AS tecnico,
      v.obra_id AS "obraId",
      o.nombre AS obra,
      o.municipio,
      TO_CHAR(v.fecha_inicio, 'YYYY-MM-DD"T"HH24:MI') AS inicio,
      TO_CHAR(v.fecha_fin, 'YYYY-MM-DD"T"HH24:MI') AS fin,
      v.estado
    FROM visitas v
    JOIN tecnicos t ON t.id = v.tecnico_id
    JOIN obras o ON o.id = v.obra_id
    ORDER BY v.fecha_inicio, v.id
  `;

  return filas as VisitaDB[];
}

// Valida y programa una visita de forma segura en PostgreSQL.
export async function crearVisita(
  visita: NuevaVisita
): Promise<ResultadoVisita> {
  const resultado = validarVisita(visita, []);

  if (!resultado.valido) return resultado;

  const filas = await sql`
    SELECT *
    FROM crear_visita(
      ${visita.tecnicoId},
      ${visita.obraId},
      ${visita.inicio}::timestamp,
      ${visita.fin}::timestamp
    )
  `;

  const fila = filas[0] as {
    valido: boolean;
    error: string | null;
    visita_id: number | null;
  };

  if (!fila.valido) {
    return {
      valido: false,
      error: fila.error ?? "No se pudo programar la visita.",
    };
  }

  return {
    valido: true,
    id: fila.visita_id ?? undefined,
  };
}

// Cancela una visita programada sin eliminar su registro.
export async function cancelarVisita(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) return false;

  const filas = await sql`
    UPDATE visitas
    SET estado = 'Cancelada'
    WHERE id = ${id}
      AND estado = 'Programada'
    RETURNING id
  `;

  return filas.length > 0;
}

// Marca como completada una visita programada sin eliminar su registro.
export async function completarVisita(id: number): Promise<boolean> {
  if (!Number.isInteger(id) || id <= 0) return false;

  const filas = await sql`
    UPDATE visitas
    SET estado = 'Completada'
    WHERE id = ${id}
      AND estado = 'Programada'
    RETURNING id
  `;

  return filas.length > 0;
}
