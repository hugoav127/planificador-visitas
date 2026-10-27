import { describe, expect, it } from "vitest";
import { filtrarVisitas } from "./filtros";
import type { VisitaDB } from "./visitas";

const base: VisitaDB = {
  id: 1, tecnicoId: 1, tecnico: "Ana", obraId: 1, obra: "Obra Norte",
  municipio: "Sabadell", inicio: "2026-10-28T08:00", fin: "2026-10-28T09:00", estado: "Programada",
};
const visitas: VisitaDB[] = [
  base,
  { ...base, id: 2, tecnicoId: 2, tecnico: "Luis", inicio: "2026-10-28T10:00", fin: "2026-10-28T11:00" },
  { ...base, id: 3, inicio: "2026-10-28T12:00", fin: "2026-10-28T13:00", estado: "Cancelada" },
  { ...base, id: 4, inicio: "2026-10-29T08:00", fin: "2026-10-29T09:00" },
];

describe("Filtros de la agenda", () => {
  // Comprueba que las completadas permanecen visibles y respetan los filtros.
  it("incluye las completadas y sigue ocultando las canceladas", () => {
    const completada: VisitaDB = { ...base, estado: "Completada" };
    expect(filtrarVisitas([completada, visitas[2]], "1", "2026-10-28")).toEqual([completada]);
    expect(filtrarVisitas([completada], "2", "")).toEqual([]);
  });

  // Comprueba que las canceladas quedan ocultas y se mantiene el orden cronológico.
  it("muestra solo las visitas programadas sin filtros", () => {
    expect(filtrarVisitas(visitas, "", "").map((visita) => visita.id)).toEqual([1, 2, 4]);
  });

  // Comprueba que el filtro de técnico excluye sus visitas canceladas.
  it("filtra por técnico conservando el orden", () => {
    expect(filtrarVisitas(visitas, "1", "").map((visita) => visita.id)).toEqual([1, 4]);
  });

  // Comprueba que la fecha corresponde al día local sin conversiones de zona horaria.
  it("filtra por día local sin incluir canceladas", () => {
    expect(filtrarVisitas(visitas, "", "2026-10-28").map((visita) => visita.id)).toEqual([1, 2]);
  });

  // Comprueba que ambos filtros se aplican simultáneamente.
  it("combina técnico y fecha", () => {
    expect(filtrarVisitas(visitas, "1", "2026-10-28").map((visita) => visita.id)).toEqual([1]);
  });

  // Comprueba que se puede quitar cada filtro de forma independiente.
  it("permite volver a todas las fechas o todos los técnicos", () => {
    expect(filtrarVisitas(visitas, "1", "")).toHaveLength(2);
    expect(filtrarVisitas(visitas, "", "2026-10-28")).toHaveLength(2);
    expect(filtrarVisitas(visitas, "", "")).toHaveLength(3);
  });

  // Comprueba las agendas vacías y las combinaciones sin coincidencias.
  it("devuelve una lista vacía si no hay coincidencias", () => {
    expect(filtrarVisitas([], "", "")).toEqual([]);
    expect(filtrarVisitas([{ ...base, estado: "Cancelada" }], "", "")).toEqual([]);
    expect(filtrarVisitas(visitas, "2", "2026-10-29")).toEqual([]);
  });
});
