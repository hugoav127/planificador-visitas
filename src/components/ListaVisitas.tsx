"use client";

import { useRef, useState } from "react";
import AccionesVisita from "./AccionesVisita";
import DetalleVisita from "./DetalleVisita";
import { filtrarVisitas } from "@/lib/filtros";
import type { VisitaDB } from "@/lib/visitas";

type Props = {
  visitas: VisitaDB[];
  tecnicos: { id: number; nombre: string }[];
};

const campo = "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

// Muestra la agenda con filtros combinables y cancelación confirmada.
export default function ListaVisitas({ visitas, tecnicos }: Props) {
  const [tecnicoId, setTecnicoId] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const modal = useRef<HTMLDialogElement>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const elegida = visitas.find((visita) => visita.id === seleccion);
  const filtradas = filtrarVisitas(visitas, tecnicoId, fecha);

  // Restablece los filtros del listado sin alterar el calendario.
  function limpiar() {
    setTecnicoId("");
    setFecha("");
  }

  // Abre los detalles de una visita sin ejecutar sus acciones.
  function abrir(visita: VisitaDB) {
    setSeleccion(visita.id);
    modal.current?.showModal();
  }

  // Presenta el resultado de las acciones del listado.
  function informar(mensaje: string, error: string) {
    setMensaje(mensaje);
    setError(error);
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="titulo-agenda">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="titulo-agenda" className="text-lg font-semibold tracking-tight">Listado de visitas</h2>
          <p className="mt-1 text-sm text-slate-500">Filtra y gestiona las visitas programadas y completadas.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{filtradas.length} visitas</span>
      </div>
      <div className="mb-4 grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block text-sm font-medium">
          Técnico
          <select value={tecnicoId} onChange={(evento) => setTecnicoId(evento.target.value)} className={campo}>
            <option value="">Todos los técnicos</option>
            {tecnicos.map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</option>)}
          </select>
        </label>
        <div>
          <label className="block text-sm font-medium">
            Fecha
            <input type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} className={campo} />
          </label>
          {fecha && <button type="button" onClick={() => setFecha("")} className="mt-2 rounded text-sm text-blue-700 underline focus-visible:outline-2 focus-visible:outline-blue-600">Todas las fechas</button>}
        </div>
        <button type="button" onClick={limpiar} disabled={!tecnicoId && !fecha} className="justify-self-start rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40 sm:mt-7">Limpiar filtros</button>
      </div>
      <p role="status" className="text-sm text-emerald-700">{mensaje}</p>
      {error && <p role="alert" className="my-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {filtradas.length === 0 ? (
        <p className="py-4 text-slate-600">{!tecnicoId && !fecha ? "No hay visitas programadas ni completadas." : "No hay visitas para los filtros seleccionados."}</p>
      ) : (
        <ul className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-slate-200 pr-3 [scrollbar-gutter:stable]" aria-label="Visitas programadas y completadas" tabIndex={0}>
          {filtradas.map((visita) => (
            <li key={visita.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <div className="min-w-0">
                <button type="button" onClick={() => abrir(visita)} aria-label={`Ver detalles de ${visita.obra}, ${visita.tecnico}`} className="rounded text-left text-sm font-semibold break-words hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">{visita.obra} — {visita.municipio}</button>
                <p className="mt-0.5 text-sm text-slate-600">Técnico: {visita.tecnico}</p>
                <p className="mt-1 text-xs text-slate-600">
                  <time dateTime={visita.inicio.slice(0, 10)}>{visita.inicio.slice(0, 10).split("-").reverse().join("/")}</time>
                  {" · Inicio: "}<time dateTime={visita.inicio}>{visita.inicio.slice(11)}</time>
                  {" · Fin: "}<time dateTime={visita.fin}>{visita.fin.slice(11)}</time>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visita.estado === "Completada" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"}`}>{visita.estado}</span>
                <AccionesVisita visita={visita} alResultado={informar} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <DetalleVisita referencia={modal} visita={elegida} />
    </section>
  );
}
