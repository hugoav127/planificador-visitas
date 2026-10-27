import { describe, expect, it } from "vitest";
import { colorTecnico, eventosVisitas } from "./calendario";
import type { VisitaDB } from "./visitas";

const visita: VisitaDB = {
  id: 1, tecnicoId: 1, tecnico: "Ana", obraId: 2, obra: "Biblioteca", municipio: "Terrassa",
  inicio: "2026-10-28T09:00", fin: "2026-10-28T10:00", estado: "Programada",
};

describe("Eventos del calendario", () => {
  // Comprueba que completar una visita conserva sus horas y el color del técnico.
  it("representa las completadas sin tratarlas como canceladas", () => {
    const [evento] = eventosVisitas([{ ...visita, estado: "Completada" }]);
    expect(evento.title).toContain("Completada");
    expect(evento.color).toBe(colorTecnico(visita.tecnicoId));
    expect(evento.start).toBe(visita.inicio);
    expect(evento.end).toBe(visita.fin);
  });

  // Comprueba que el filtro del calendario conserva ambos estados y no modifica los datos compartidos.
  it("filtra por técnico sin ocultar sus canceladas ni cambiar su color", () => {
    const datos: VisitaDB[] = [visita, { ...visita, id: 2, estado: "Cancelada" }, { ...visita, id: 3, tecnicoId: 2 }];
    const eventos = eventosVisitas(datos, "1");
    expect(eventos.map((evento) => evento.id)).toEqual(["1", "2"]);
    expect(eventos[0].color).toBe(colorTecnico(1));
    expect(eventos[1].color).toBe("#64748b");
    expect(eventosVisitas(datos)).toHaveLength(3);
    expect(datos).toHaveLength(3);
    expect(eventosVisitas(datos, "99")).toEqual([]);
  });

  // Comprueba que las fechas locales se pasan intactas, sin offsets ni conversión a UTC.
  it.each(["2026-01-15", "2026-07-15", "2026-10-28"])("conserva las horas locales en %s", (fecha) => {
    const [evento] = eventosVisitas([{ ...visita, inicio: `${fecha}T09:00`, fin: `${fecha}T10:00` }]);
    expect(evento.start).toBe(`${fecha}T09:00`);
    expect(evento.end).toBe(`${fecha}T10:00`);
    expect(evento.title).toContain("Ana · Biblioteca");
    expect(evento.allDay).toBe(false);
  });

  // Comprueba que los colores dependen del técnico, aunque cambien la obra y el orden.
  it("mantiene el color de cada técnico", () => {
    const otra = { ...visita, id: 2, obraId: 3, obra: "Escuela" };
    const eventos = eventosVisitas([otra, visita]);
    expect(eventos[0].color).toBe(colorTecnico(1));
    expect(eventos[1].color).toBe(colorTecnico(1));
    expect(new Set([1, 2, 3, 4, 5].map(colorTecnico)).size).toBe(5);
  });

  // Comprueba que las canceladas siguen visibles y tienen un color neutro común.
  it("muestra las canceladas en gris y con su estado en el título", () => {
    const eventos = eventosVisitas([
      { ...visita, estado: "Cancelada" },
      { ...visita, id: 2, tecnicoId: 2, estado: "Cancelada" },
    ]);
    expect(eventos).toHaveLength(2);
    expect(eventos[0].color).toBe("#64748b");
    expect(eventos[1].color).toBe("#64748b");
    expect(eventos[0].title).toContain("Cancelada");
  });

  // Comprueba que una actualización de estado cambia la representación del evento.
  it("refleja el estado nuevo sin cambiar la identidad de la visita", () => {
    const [antes] = eventosVisitas([visita]);
    const [despues] = eventosVisitas([{ ...visita, estado: "Cancelada" }]);
    expect(despues.id).toBe(antes.id);
    expect(despues.color).not.toBe(antes.color);
  });

  // Comprueba que una agenda vacía no genera eventos ficticios.
  it("no añade eventos a una agenda vacía", () => {
    expect(eventosVisitas([])).toEqual([]);
  });
});
