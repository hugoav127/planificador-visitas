import { beforeEach, describe, expect, it, vi } from "vitest";
import { anularVisita, finalizarVisita, programarVisita } from "./actions";

const { simularSQL, revalidar } = vi.hoisted(() => ({ simularSQL: vi.fn(), revalidar: vi.fn() }));
vi.mock("../lib/db", () => ({ sql: simularSQL }));
vi.mock("next/cache", () => ({ revalidatePath: revalidar }));

// Prepara un envío equivalente al formulario del modal.
function formulario(cambios: Record<string, string> = {}): FormData {
  const datos = new FormData();
  for (const [clave, valor] of Object.entries({ tecnicoId: "1", obraId: "2", fecha: "2026-07-15", hora: "09:15", duracion: "60", ...cambios })) {
    datos.set(clave, valor);
  }
  return datos;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Cancelación desde el servidor", () => {
  // Comprueba que se cambia el estado sin eliminar la visita y se actualiza la agenda.
  it("cancela una visita programada", async () => {
    simularSQL.mockResolvedValueOnce([{ id: 7 }]);
    expect(await anularVisita(7)).toEqual({ valido: true });
    const [consulta, ...valores] = simularSQL.mock.calls[0];
    expect(consulta.join("")).toContain("UPDATE visitas");
    expect(consulta.join("")).toContain("SET estado = 'Cancelada'");
    expect(consulta.join("")).toContain("AND estado = 'Programada'");
    expect(valores).toEqual([7]);
    expect(revalidar).toHaveBeenCalledWith("/");
  });

  // Comprueba que una segunda cancelación no puede modificar el registro.
  it("rechaza volver a cancelar la misma visita", async () => {
    simularSQL.mockResolvedValueOnce([{ id: 7 }]).mockResolvedValueOnce([]);
    expect((await anularVisita(7)).valido).toBe(true);
    revalidar.mockClear();
    expect(await anularVisita(7)).toEqual({ valido: false, error: "La visita no existe o ya está cancelada." });
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que no se aceptan identificadores manipulados.
  it.each([0, -1, 1.5, NaN, Infinity])("rechaza el identificador %s", async (id) => {
    expect((await anularVisita(id)).valido).toBe(false);
    expect(simularSQL).not.toHaveBeenCalled();
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que los fallos de base de datos llegan como un error controlado.
  it("comunica un error al cancelar", async () => {
    simularSQL.mockRejectedValueOnce(new Error("Fallo interno"));
    expect(await anularVisita(7)).toEqual({ valido: false, error: "No se pudo cancelar la visita. Inténtalo de nuevo." });
    expect(revalidar).not.toHaveBeenCalled();
  });
});

describe("Completar visitas desde el servidor", () => {
  // Comprueba el cambio condicional de estado y la actualización de la página.
  it("completa únicamente visitas programadas", async () => {
    simularSQL.mockResolvedValueOnce([{ id: 7 }]);
    expect(await finalizarVisita(7)).toEqual({ valido: true });
    const [consulta, ...valores] = simularSQL.mock.calls[0];
    expect(consulta.join("")).toContain("SET estado = 'Completada'");
    expect(consulta.join("")).toContain("AND estado = 'Programada'");
    expect(valores).toEqual([7]);
    expect(simularSQL).toHaveBeenCalledOnce();
    expect(revalidar).toHaveBeenCalledWith("/");
  });

  // Comprueba que no se repite una transición ni se completa una visita cancelada.
  it.each(["inexistente", "cancelada", "completada"])("rechaza una visita %s", async () => {
    simularSQL.mockResolvedValueOnce([]);
    expect(await finalizarVisita(7)).toEqual({ valido: false, error: "La visita no existe o ya no está programada." });
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que los identificadores inválidos se rechazan sin consultar Neon.
  it.each([0, -1, 1.5, NaN, Infinity])("rechaza el identificador %s", async (id) => {
    expect((await finalizarVisita(id)).valido).toBe(false);
    expect(simularSQL).not.toHaveBeenCalled();
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que un fallo de base de datos devuelve un mensaje controlado.
  it("comunica los errores de guardado", async () => {
    simularSQL.mockRejectedValueOnce(new Error("Fallo de conexión"));
    expect(await finalizarVisita(7)).toEqual({ valido: false, error: "No se pudo completar la visita. Inténtalo de nuevo." });
    expect(revalidar).not.toHaveBeenCalled();
  });
});

describe("Envío del formulario al servidor", () => {
  // Comprueba que los fines de semana se rechazan antes de guardar y se informa al modal.
  it.each(["2026-10-31", "2026-11-01"])("rechaza el envío para %s", async (fecha) => {
    expect(await programarVisita(formulario({ fecha }))).toEqual({
      valido: false, error: "Las visitas solo pueden programarse de lunes a viernes.",
    });
    expect(simularSQL).not.toHaveBeenCalled();
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba el cálculo del servidor, la operación atómica y la actualización de la agenda.
  it("guarda fechas locales mediante crear_visita y actualiza el listado", async () => {
    simularSQL.mockResolvedValueOnce([{ valido: true, error: null, visita_id: 7 }]);
    const datos = formulario({ duracion: "90", fin: "2026-07-15T17:00" });
    expect(await programarVisita(datos)).toEqual({ valido: true, id: 7 });
    const [consulta, ...valores] = simularSQL.mock.calls[0];
    expect(consulta.join("")).toContain("FROM crear_visita(");
    expect(valores).toEqual([1, 2, "2026-07-15T09:15", "2026-07-15T10:45"]);
    expect(simularSQL).toHaveBeenCalledOnce();
    expect(revalidar).toHaveBeenCalledWith("/");
  });

  // Comprueba que los envíos incompletos o manipulados no llegan a PostgreSQL.
  it.each<Record<string, string>>([
    { tecnicoId: "" }, { obraId: "-1" }, { fecha: "" }, { hora: "" },
    { fecha: "2026-02-30" }, { duracion: "45" }, { duracion: "" },
    { duracion: "-60" }, { hora: "07:00" }, { hora: "16:30", duracion: "60" },
  ])("rechaza datos inválidos: %o", async (cambios) => {
    expect((await programarVisita(formulario(cambios))).valido).toBe(false);
    expect(simularSQL).not.toHaveBeenCalled();
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que una visita puede terminar exactamente al cierre.
  it("acepta una visita que termina a las 17:00", async () => {
    simularSQL.mockResolvedValueOnce([{ valido: true, error: null, visita_id: 8 }]);
    expect((await programarVisita(formulario({ hora: "16:30", duracion: "30" }))).valido).toBe(true);
  });

  // Comprueba que se conserva el mensaje de conflicto para mostrarlo en el modal.
  it("devuelve los errores de planificación sin actualizar la agenda", async () => {
    const error = "Se necesitan 30 minutos entre obras diferentes";
    simularSQL.mockResolvedValueOnce([{ valido: false, error, visita_id: null }]);
    expect(await programarVisita(formulario())).toEqual({ valido: false, error });
    expect(revalidar).not.toHaveBeenCalled();
  });

  // Comprueba que un fallo de conexión devuelve un mensaje seguro.
  it("comunica los errores de conexión", async () => {
    simularSQL.mockRejectedValueOnce(new Error("Error interno de conexión"));
    const resultado = await programarVisita(formulario());
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe("No se pudo programar la visita. Inténtalo de nuevo.");
    expect(revalidar).not.toHaveBeenCalled();
  });
});
