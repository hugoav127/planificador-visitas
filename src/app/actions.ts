"use server";

import { revalidatePath } from "next/cache";
import { calcularFin } from "../lib/validaciones";
import { cancelarVisita, completarVisita, crearVisita, type ResultadoVisita } from "../lib/visitas";

// Calcula la finalización y programa una visita con las validaciones del servidor.
export async function programarVisita(datos: FormData): Promise<ResultadoVisita> {
  const tecnicoId = Number(datos.get("tecnicoId"));
  const obraId = Number(datos.get("obraId"));
  const fecha = String(datos.get("fecha") ?? "");
  const hora = String(datos.get("hora") ?? "");
  const duracion = Number(datos.get("duracion"));
  const fin = calcularFin(fecha, hora, duracion);

  if (!fin) {
    return { valido: false, error: "Indica una fecha, hora y duración válidas (30, 60, 90 o 120 minutos)." };
  }

  let resultado: ResultadoVisita;
  try {
    resultado = await crearVisita({ tecnicoId, obraId, inicio: `${fecha}T${hora}`, fin });
  } catch {
    return { valido: false, error: "No se pudo programar la visita. Inténtalo de nuevo." };
  }

  if (resultado.valido) revalidatePath("/");
  return resultado;
}

// Cancela una visita programada y actualiza la agenda.
export async function anularVisita(id: number): Promise<ResultadoVisita> {
  try {
    if (!(await cancelarVisita(id))) {
      return { valido: false, error: "La visita no existe o ya está cancelada." };
    }
  } catch {
    return { valido: false, error: "No se pudo cancelar la visita. Inténtalo de nuevo." };
  }

  revalidatePath("/");
  return { valido: true };
}

// Completa una visita programada y actualiza el listado y el calendario.
export async function finalizarVisita(id: number): Promise<ResultadoVisita> {
  try {
    if (!(await completarVisita(id))) {
      return { valido: false, error: "La visita no existe o ya no está programada." };
    }
  } catch {
    return { valido: false, error: "No se pudo completar la visita. Inténtalo de nuevo." };
  }

  revalidatePath("/");
  return { valido: true };
}
