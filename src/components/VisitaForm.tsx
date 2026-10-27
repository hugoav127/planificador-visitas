"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { programarVisita } from "@/app/actions";
import { duraciones } from "@/lib/validaciones";

type Props = {
  tecnicos: { id: number; nombre: string }[];
  obras: { id: number; nombre: string; municipio: string }[];
};

const inicial = { tecnicoId: "", obraId: "", fecha: "", hora: "", duracion: "60" };
const etiquetas = ["30 minutos", "1 hora", "1 hora y 30 minutos", "2 horas"];
const campo = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
const boton = "rounded-lg px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50";

// Muestra el formulario de programación en un diálogo accesible.
export default function VisitaForm({ tecnicos, obras }: Props) {
  const modal = useRef<HTMLDialogElement>(null);
  const enviando = useRef(false);
  const [datos, setDatos] = useState(inicial);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, iniciar] = useTransition();
  const completo = Object.values(datos).every(Boolean);

  // Abre el diálogo con un formulario limpio.
  function abrir() {
    setDatos(inicial);
    setError("");
    setMensaje("");
    modal.current?.showModal();
  }

  // Cierra el diálogo y devuelve el foco al botón de apertura.
  function cerrar() {
    modal.current?.close();
  }

  // Conserva los campos y comunica el resultado de la operación.
  function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current || !completo) return;
    const formulario = new FormData(evento.currentTarget);
    enviando.current = true;
    setError("");
    iniciar(async () => {
      try {
        const resultado = await programarVisita(formulario);
        if (!resultado.valido) {
          setError(resultado.error ?? "No se pudo programar la visita.");
          return;
        }
        cerrar();
        setMensaje("Visita programada correctamente.");
      } catch {
        setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
      } finally {
        enviando.current = false;
      }
    });
  }

  return (
    <div>
      <button type="button" onClick={abrir} disabled={guardando} className={`${boton} inline-flex items-center gap-2 bg-blue-700 text-white shadow-sm shadow-blue-700/20 hover:bg-blue-800`}>
        <span aria-hidden="true" className="text-lg leading-none">+</span> Nueva visita
      </button>
      <p role="status" className="mt-2 text-sm text-emerald-700">{mensaje}</p>
      <dialog ref={modal} aria-labelledby="titulo-visita" aria-describedby="ayuda-visita" className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/60 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="titulo-visita" className="text-2xl font-semibold">Nueva visita</h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar" className={`${boton} -mr-2 -mt-2 text-xl hover:bg-slate-100`}>×</button>
        </div>
        <p id="ayuda-visita" className="mt-2 text-sm text-slate-600">Completa todos los campos. Horario laboral de lunes a viernes, de 08:00 a 17:00.</p>
        <form onSubmit={guardar} className="mt-6 space-y-5">
          <fieldset disabled={guardando} className="space-y-5 disabled:opacity-60">
            <label className="block text-sm font-medium">
              Técnico
              <select name="tecnicoId" required value={datos.tecnicoId} onChange={(e) => setDatos({ ...datos, tecnicoId: e.target.value })} className={campo}>
                <option value="">Selecciona un técnico</option>
                {tecnicos.map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Obra
              <select name="obraId" required value={datos.obraId} onChange={(e) => setDatos({ ...datos, obraId: e.target.value })} className={campo}>
                <option value="">Selecciona una obra</option>
                {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre} — {obra.municipio}</option>)}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Fecha
                <input type="date" name="fecha" required value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} className={campo} />
              </label>
              <label className="block text-sm font-medium">
                Hora de inicio
                <input type="time" name="hora" min="08:00" max="17:00" step="60" required value={datos.hora} onChange={(e) => setDatos({ ...datos, hora: e.target.value })} className={campo} />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Duración estimada
              <select name="duracion" required value={datos.duracion} onChange={(e) => setDatos({ ...datos, duracion: e.target.value })} className={campo}>
                {duraciones.map((duracion, i) => <option key={duracion} value={duracion}>{etiquetas[i]}</option>)}
              </select>
            </label>
          </fieldset>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <button type="button" onClick={cerrar} className={`${boton} border border-slate-300 hover:bg-slate-50`}>Cancelar</button>
            <button type="submit" disabled={!completo || guardando} className={`${boton} bg-blue-700 text-white hover:bg-blue-800`}>
              {guardando ? "Guardando…" : "Programar visita"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
