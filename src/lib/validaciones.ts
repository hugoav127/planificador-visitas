
export type Visita = {
  tecnicoId: number;
  obraId: number;
  inicio: string;
  fin: string;
  estado: "Programada" | "Cancelada" | "Completada";
};

export type NuevaVisita = Omit<Visita, "estado">;

export type Resultado = {
  valido: boolean;
  error?: string;
};

export const duraciones = [30, 60, 90, 120] as const;

// Comprueba que la duración es una de las opciones permitidas.
function duracionValida(duracion: number): boolean {
  return duraciones.some((opcion) => opcion === duracion);
}

// Suma minutos a una fecha local sin cambiar su zona horaria.
export function calcularFin(fecha: string, hora: string, duracion: number): string | null {
  const inicio = `${fecha}T${hora}`;
  if (!fechaValida(inicio) || !duracionValida(duracion)) return null;

  // Igual que aMinutos, usa UTC solo como reloj neutro para la aritmética local.
  return new Date((aMinutos(inicio) + duracion) * 60000)
    .toISOString().slice(0, 16);
}

// Convierte una fecha y hora local en minutos comparables.
function aMinutos(fecha: string): number {
  return Date.parse(`${fecha}Z`) / 60000;
}

// Comprueba que una fecha existe y tiene el formato correcto.
function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fecha)) {
    return false;
  }

  const minutos = aMinutos(fecha);

  return (
    Number.isFinite(minutos) &&
    new Date(minutos * 60000).toISOString().slice(0, 16) === fecha
  );
}

// Comprueba que una visita transcurre dentro de la jornada laboral.
export function horarioValido(visita: NuevaVisita): boolean {
  const mismoDia = visita.inicio.slice(0, 10) === visita.fin.slice(0, 10);
  const horaInicio = visita.inicio.slice(11);
  const horaFin = visita.fin.slice(11);

  return (
    mismoDia &&
    horaInicio >= "08:00" &&
    horaFin <= "17:00" &&
    aMinutos(visita.fin) > aMinutos(visita.inicio)
  );
}

// Comprueba si dos visitas coinciden en algún momento.
export function haySolape(a: NuevaVisita, b: NuevaVisita): boolean {
  return (
    aMinutos(a.inicio) < aMinutos(b.fin) &&
    aMinutos(a.fin) > aMinutos(b.inicio)
  );
}

// Comprueba que hay al menos 30 minutos entre obras diferentes.
export function trasladoValido(a: NuevaVisita, b: NuevaVisita): boolean {
  if (a.obraId === b.obraId) return true;

  const inicioA = aMinutos(a.inicio);
  const finA = aMinutos(a.fin);
  const inicioB = aMinutos(b.inicio);
  const finB = aMinutos(b.fin);

  return (
    inicioB - finA >= 30 ||
    inicioA - finB >= 30
  );
}

// Valida una visita frente a las reglas y la planificación existente.
export function validarVisita(
  nueva: NuevaVisita,
  visitas: Visita[]
): Resultado {
  if (
    !Number.isInteger(nueva.tecnicoId) ||
    nueva.tecnicoId <= 0 ||
    !Number.isInteger(nueva.obraId) ||
    nueva.obraId <= 0 ||
    !fechaValida(nueva.inicio) ||
    !fechaValida(nueva.fin)
  ) {
    return { valido: false, error: "Los datos de la visita no son válidos." };
  }

  const dia = new Date(aMinutos(nueva.inicio) * 60000).getUTCDay();
  if (dia === 0 || dia === 6) {
    return { valido: false, error: "Las visitas solo pueden programarse de lunes a viernes." };
  }

  if (!horarioValido(nueva)) {
    return {
      valido: false,
      error: "La visita debe realizarse entre las 08:00 y las 17:00.",
    };
  }

  if (!duracionValida(aMinutos(nueva.fin) - aMinutos(nueva.inicio))) {
    return {
      valido: false,
      error: "La duración debe ser de 30, 60, 90 o 120 minutos.",
    };
  }

  const ocupadas = visitas.filter(
    (visita) =>
      visita.tecnicoId === nueva.tecnicoId &&
      visita.estado === "Programada"
  );

  for (const visita of ocupadas) {
    if (haySolape(nueva, visita)) {
      return {
        valido: false,
        error: "El técnico ya tiene una visita en ese horario.",
      };
    }

    if (!trasladoValido(nueva, visita)) {
      return {
        valido: false,
        error: "Se necesitan 30 minutos entre visitas en obras diferentes.",
      };
    }
  }

  return { valido: true };
}
