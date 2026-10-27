
import { describe, expect, it } from "vitest";

import {
  horarioValido,
  haySolape,
  trasladoValido,
  validarVisita,
  calcularFin,
  type Visita,
  type NuevaVisita,
} from "./validaciones";

const base: NuevaVisita = {
  tecnicoId: 1,
  obraId: 1,
  inicio: "2026-10-28T09:00",
  fin: "2026-10-28T10:00",
};

const programada: Visita = {
  ...base,
  estado: "Programada",
};

describe("Cálculo de finalización local", () => {
  // Comprueba las cuatro duraciones sin desplazamientos de zona horaria.
  it.each([[30, "09:45"], [60, "10:15"], [90, "10:45"], [120, "11:15"]])(
    "suma %i minutos",
    (duracion, hora) => {
      expect(calcularFin("2026-07-15", "09:15", Number(duracion))).toBe(`2026-07-15T${hora}`);
    }
  );

  // Comprueba que la aritmética local no depende de los cambios de horario.
  it.each(["2026-03-29", "2026-10-25"])("conserva la hora en %s", (fecha) => {
    expect(calcularFin(fecha, "08:00", 60)).toBe(`${fecha}T09:00`);
  });

  // Comprueba que no se normalizan fechas imposibles ni duraciones manipuladas.
  it("rechaza datos inválidos", () => {
    expect(calcularFin("2026-02-30", "09:00", 60)).toBeNull();
    expect(calcularFin("2026-10-28", "25:00", 60)).toBeNull();
    for (const duracion of [0, -30, 45, 60.5, 180, NaN]) {
      expect(calcularFin("2026-10-28", "09:00", duracion)).toBeNull();
    }
  });

  // Comprueba que se calcula correctamente el cambio de día para validarlo después.
  it("calcula el fin al día siguiente y la validación rechaza el horario", () => {
    const fin = calcularFin("2026-12-31", "23:30", 60);
    expect(fin).toBe("2027-01-01T00:30");
    expect(validarVisita({ ...base, inicio: "2026-12-31T23:30", fin: fin! }, []).valido).toBe(false);
  });
});

describe("Horario laboral", () => {
  // Comprueba que una visita dentro de la jornada es válida.
  it("acepta una visita de 09:00 a 10:00", () => {
    expect(horarioValido(base)).toBe(true);
  });

  // Comprueba que no se permiten visitas antes de la jornada.
  it("rechaza visitas anteriores a las 08:00", () => {
    expect(
      horarioValido({
        ...base,
        inicio: "2026-10-28T07:30",
      })
    ).toBe(false);
  });

  // Comprueba que las visitas deben terminar antes del cierre.
  it("rechaza visitas posteriores a las 17:00", () => {
    expect(
      horarioValido({
        ...base,
        fin: "2026-10-28T17:30",
      })
    ).toBe(false);
  });

  // Comprueba que una visita debe tener duración positiva.
  it("rechaza una finalización anterior al inicio", () => {
    expect(
      horarioValido({
        ...base,
        fin: "2026-10-28T08:30",
      })
    ).toBe(false);
  });
});

describe("Solapamientos", () => {
  // Comprueba que dos visitas coincidentes generan conflicto.
  it("detecta visitas solapadas", () => {
    expect(
      haySolape(base, {
        ...base,
        inicio: "2026-10-28T09:30",
        fin: "2026-10-28T10:30",
      })
    ).toBe(true);
  });

  // Comprueba que dos visitas consecutivas no se solapan.
  it("permite visitas consecutivas", () => {
    expect(
      haySolape(base, {
        ...base,
        inicio: "2026-10-28T10:00",
        fin: "2026-10-28T11:00",
      })
    ).toBe(false);
  });
});

describe("Desplazamientos", () => {
  // Comprueba que se exige tiempo para cambiar de obra.
  it("rechaza 15 minutos entre obras diferentes", () => {
    expect(
      trasladoValido(base, {
        ...base,
        obraId: 2,
        inicio: "2026-10-28T10:15",
        fin: "2026-10-28T11:15",
      })
    ).toBe(false);
  });

  // Comprueba que el desplazamiento mínimo permitido es de 30 minutos.
  it("acepta exactamente 30 minutos", () => {
    expect(
      trasladoValido(base, {
        ...base,
        obraId: 2,
        inicio: "2026-10-28T10:30",
        fin: "2026-10-28T11:30",
      })
    ).toBe(true);
  });

  // Comprueba que no se exige desplazamiento dentro de una misma obra.
  it("permite visitas consecutivas en la misma obra", () => {
    expect(
      trasladoValido(base, {
        ...base,
        inicio: "2026-10-28T10:00",
        fin: "2026-10-28T11:00",
      })
    ).toBe(true);
  });
});

describe("Validación completa", () => {
  // Comprueba cada día laborable sin depender de la zona horaria del servidor.
  it.each(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"])("acepta el día laborable %s", (fecha) => {
    expect(validarVisita({ ...base, inicio: `${fecha}T08:00`, fin: `${fecha}T09:00` }, [])).toEqual({ valido: true });
  });

  // Comprueba que sábados y domingos se rechazan con un mensaje específico.
  it.each(["2026-10-31", "2026-11-01"])("rechaza el fin de semana %s", (fecha) => {
    expect(validarVisita({ ...base, inicio: `${fecha}T09:00`, fin: `${fecha}T10:00` }, [])).toEqual({
      valido: false, error: "Las visitas solo pueden programarse de lunes a viernes.",
    });
  });

  // Comprueba que una visita sin conflictos puede programarse.
  it("acepta una visita válida", () => {
    expect(validarVisita(base, [])).toEqual({
      valido: true,
    });
  });

  // Comprueba que los técnicos tienen agendas independientes.
  it("permite coincidencias entre técnicos distintos", () => {
    expect(
      validarVisita(
        { ...base, tecnicoId: 2 },
        [programada]
      ).valido
    ).toBe(true);
  });

  // Comprueba que las cancelaciones no bloquean nuevos horarios.
  it("ignora las visitas canceladas", () => {
    expect(
      validarVisita(base, [
        { ...programada, estado: "Cancelada" },
      ]).valido
    ).toBe(true);
  });

  // Comprueba que no se aceptan fechas inexistentes.
  it("rechaza fechas imposibles", () => {
    expect(
      validarVisita(
        { ...base, inicio: "2026-02-30T09:00" },
        []
      ).valido
    ).toBe(false);
  });

  // Comprueba que las referencias deben ser identificadores válidos.
  it("rechaza identificadores inválidos", () => {
    expect(
      validarVisita(
        { ...base, tecnicoId: 0 },
        []
      ).valido
    ).toBe(false);
  });
});
