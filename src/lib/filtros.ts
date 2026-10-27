import type { VisitaDB } from "./visitas";

// Filtra las visitas no canceladas por técnico y día local conservando su orden.
export function filtrarVisitas(visitas: VisitaDB[], tecnicoId: string, fecha: string): VisitaDB[] {
  return visitas.filter((visita) =>
    visita.estado !== "Cancelada" &&
    (!tecnicoId || String(visita.tecnicoId) === tecnicoId) &&
    (!fecha || visita.inicio.slice(0, 10) === fecha)
  );
}
