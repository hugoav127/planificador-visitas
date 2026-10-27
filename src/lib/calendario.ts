import type { EventInput } from "@fullcalendar/react";
import type { VisitaDB } from "./visitas";

// Asigna un color estable a cada técnico independientemente del orden de la agenda.
export function colorTecnico(id: number): string {
  return `hsl(${((id * 137.508 + 84) % 360).toFixed(3)} 65% 38%)`;
}

// Filtra por técnico y representa las visitas conservando sus fechas locales y estados.
export function eventosVisitas(visitas: VisitaDB[], tecnicoId = ""): EventInput[] {
  return visitas.filter((visita) => !tecnicoId || String(visita.tecnicoId) === tecnicoId).map((visita) => ({
    id: String(visita.id),
    title: `${visita.tecnico} · ${visita.obra}${visita.estado !== "Programada" ? ` · ${visita.estado}` : ""}`,
    start: visita.inicio,
    end: visita.fin,
    allDay: false,
    color: visita.estado === "Cancelada" ? "#64748b" : colorTecnico(visita.tecnicoId),
    contrastColor: "#ffffff",
    extendedProps: { visita },
  }));
}
