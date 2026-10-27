
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  listarVisitas,
  crearVisita,
  cancelarVisita,
} from "./visitas";

import type { NuevaVisita } from "./validaciones";

const { simularSQL } = vi.hoisted(() => ({
  simularSQL: vi.fn(),
}));

vi.mock("./db", () => ({
  sql: simularSQL,
}));

const visita: NuevaVisita = {
  tecnicoId: 1,
  obraId: 2,
  inicio: "2026-10-28T09:00",
  fin: "2026-10-28T10:00",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Consultar visitas", () => {
  // Comprueba que se recuperan las visitas de la base de datos.
  it("devuelve las visitas existentes", async () => {
    const datos = [
      {
        id: 1,
        tecnicoId: 1,
        tecnico: "Carlos Martínez",
        obraId: 2,
        obra: "Construcción Residencial Norte",
        municipio: "Sabadell",
        inicio: visita.inicio,
        fin: visita.fin,
        estado: "Programada",
      },
    ];

    simularSQL.mockResolvedValueOnce(datos);

    const resultado = await listarVisitas();

    expect(resultado).toEqual(datos);
    expect(simularSQL).toHaveBeenCalledOnce();
  });

  // Comprueba que una agenda vacía devuelve una lista vacía.
  it("devuelve una lista vacía", async () => {
    simularSQL.mockResolvedValueOnce([]);

    expect(await listarVisitas()).toEqual([]);
  });
});

describe("Programar visitas", () => {
  // Comprueba que la operación rechaza duraciones inválidas aunque no se use el formulario.
  it("rechaza duraciones no permitidas antes de consultar PostgreSQL", async () => {
    const resultado = await crearVisita({ ...visita, fin: "2026-10-28T09:45" });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain("duración");
    expect(simularSQL).not.toHaveBeenCalled();
  });

  // Comprueba que una visita válida se guarda correctamente.
  it("crea una visita", async () => {
    simularSQL.mockResolvedValueOnce([
      { valido: true, error: null, visita_id: 1 },
    ]);

    const resultado = await crearVisita(visita);

    expect(resultado).toEqual({
      valido: true,
      id: 1,
    });

    expect(simularSQL).toHaveBeenCalledOnce();
  });

  // Comprueba que se rechazan las visitas fuera de horario.
  it("rechaza horarios inválidos", async () => {
    const resultado = await crearVisita({
      ...visita,
      inicio: "2026-10-28T07:00",
    });

    expect(resultado.valido).toBe(false);
    expect(simularSQL).not.toHaveBeenCalled();
  });

  // Comprueba que los conflictos detectados por PostgreSQL se comunican.
  it("rechaza visitas solapadas", async () => {
    simularSQL.mockResolvedValueOnce([
      {
        valido: false,
        error: "El técnico ya tiene una visita en ese horario",
        visita_id: null,
      },
    ]);

    const resultado = await crearVisita(visita);

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain("ya tiene una visita");
  });

  // Comprueba que se rechazan desplazamientos insuficientes.
  it("rechaza desplazamientos insuficientes", async () => {
    simularSQL.mockResolvedValueOnce([
      {
        valido: false,
        error: "Se necesitan 30 minutos entre obras diferentes",
        visita_id: null,
      },
    ]);

    const resultado = await crearVisita(visita);

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain("30 minutos");
  });

  // Comprueba que no se aceptan técnicos inexistentes.
  it("rechaza técnicos inexistentes", async () => {
    simularSQL.mockResolvedValueOnce([
      {
        valido: false,
        error: "El técnico no existe",
        visita_id: null,
      },
    ]);

    const resultado = await crearVisita(visita);

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe("El técnico no existe");
  });
});

describe("Cancelar visitas", () => {
  // Comprueba que una visita programada puede cancelarse.
  it("cancela una visita existente", async () => {
    simularSQL.mockResolvedValueOnce([{ id: 1 }]);

    expect(await cancelarVisita(1)).toBe(true);
    expect(simularSQL).toHaveBeenCalledOnce();
  });

  // Comprueba que una visita no cancelable devuelve false.
  it("rechaza cancelar una visita inexistente o cancelada", async () => {
    simularSQL.mockResolvedValueOnce([]);

    expect(await cancelarVisita(999)).toBe(false);
  });

  // Comprueba que los identificadores inválidos se rechazan.
  it("rechaza identificadores inválidos", async () => {
    expect(await cancelarVisita(-1)).toBe(false);
    expect(simularSQL).not.toHaveBeenCalled();
  });
});
