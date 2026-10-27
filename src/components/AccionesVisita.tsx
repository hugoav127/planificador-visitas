"use client";

import { useRef, useState, useTransition } from "react";
import { anularVisita, finalizarVisita } from "@/app/actions";
import type { VisitaDB } from "@/lib/visitas";

type Props = {
  visita: VisitaDB;
  alResultado?: (mensaje: string, error: string) => void;
};

const boton = "rounded-lg px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

// Comparte las acciones confirmadas de una visita entre el listado y sus detalles.
export default function AccionesVisita({ visita, alResultado }: Props) {
  const enviando = useRef(false);
  const [guardando, iniciar] = useTransition();
  const [accion, setAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Comunica el resultado donde se estén mostrando las acciones.
  function informar(mensaje: string, error: string) {
    setMensaje(mensaje);
    setError(error);
    alResultado?.(mensaje, error);
  }

  // Confirma y ejecuta el cambio de estado mediante las operaciones del servidor.
  function cambiar(tipo: "completar" | "cancelar") {
    if (enviando.current || visita.estado !== "Programada") return;
    const pregunta = tipo === "completar" ? "Marcar como completada" : "Cancelar";
    if (!window.confirm(`¿${pregunta} la visita de ${visita.tecnico} a ${visita.obra}?`)) return;
    enviando.current = true;
    setAccion(tipo);
    informar("", "");
    iniciar(async () => {
      try {
        const resultado = await (tipo === "completar" ? finalizarVisita(visita.id) : anularVisita(visita.id));
        if (resultado.valido) {
          informar(`Visita ${tipo === "completar" ? "completada" : "cancelada"} correctamente.`, "");
        } else {
          informar("", resultado.error ?? "No se pudo actualizar la visita.");
        }
      } catch {
        informar("", "No se pudo conectar con el servidor. Inténtalo de nuevo.");
      } finally {
        enviando.current = false;
        setAccion("");
      }
    });
  }

  return (
    <div aria-busy={guardando}>
      {visita.estado === "Programada" && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => cambiar("completar")} disabled={guardando} aria-label={`Completar visita de ${visita.tecnico} a ${visita.obra}`} className={`${boton} bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-emerald-700`}>
            {guardando && accion === "completar" ? "Completando…" : "Completar"}
          </button>
          <button type="button" onClick={() => cambiar("cancelar")} disabled={guardando} aria-label={`Cancelar visita de ${visita.tecnico} a ${visita.obra}`} className={`${boton} bg-red-700 hover:bg-red-800 focus-visible:outline-red-700`}>
            {guardando && accion === "cancelar" ? "Cancelando…" : "Cancelar"}
          </button>
        </div>
      )}
      {!alResultado && mensaje && <p role="status" className="mt-3 text-sm text-emerald-700">{mensaje}</p>}
      {!alResultado && error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  );
}
