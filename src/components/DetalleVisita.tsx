"use client";

import { useId, type RefObject } from "react";
import AccionesVisita from "./AccionesVisita";
import type { VisitaDB } from "@/lib/visitas";

type Props = {
  visita?: VisitaDB;
  referencia: RefObject<HTMLDialogElement | null>;
};

// Muestra los detalles y las acciones de una visita en un diálogo reutilizable.
export default function DetalleVisita({ visita, referencia }: Props) {
  const titulo = useId();

  // Cierra el diálogo y devuelve el foco al elemento que lo abrió.
  function cerrar() {
    referencia.current?.close();
  }

  return (
    <dialog ref={referencia} aria-labelledby={titulo} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/60">
      <div className="flex items-center justify-between gap-4">
        <h2 id={titulo} className="text-xl font-semibold">Detalle de la visita</h2>
        <button type="button" onClick={cerrar} aria-label="Cerrar detalles" className="rounded-lg px-3 py-2 text-xl hover:bg-slate-100">×</button>
      </div>
      {visita && (
        <>
          <dl className="mt-6 space-y-4 text-sm">
            <div><dt className="text-slate-500">Técnico</dt><dd className="mt-1 font-medium">{visita.tecnico}</dd></div>
            <div><dt className="text-slate-500">Obra</dt><dd className="mt-1 font-medium">{visita.obra}</dd></div>
            <div><dt className="text-slate-500">Municipio</dt><dd className="mt-1 font-medium">{visita.municipio}</dd></div>
            <div><dt className="text-slate-500">Fecha</dt><dd className="mt-1 font-medium">{visita.inicio.slice(0, 10).split("-").reverse().join("/")}</dd></div>
            <div><dt className="text-slate-500">Horario</dt><dd className="mt-1 font-medium">{visita.inicio.slice(11)} – {visita.fin.slice(11)}</dd></div>
            <div><dt className="text-slate-500">Estado</dt><dd className={`mt-1 inline-block rounded-full px-3 py-1 font-medium ${visita.estado === "Cancelada" ? "bg-slate-100 text-slate-600" : visita.estado === "Completada" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-700"}`}>{visita.estado}</dd></div>
          </dl>
          <div className="mt-6 border-t border-slate-100 pt-4"><AccionesVisita key={visita.id} visita={visita} /></div>
        </>
      )}
      <div className="mt-4 flex justify-end"><button type="button" onClick={cerrar} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cerrar</button></div>
    </dialog>
  );
}
