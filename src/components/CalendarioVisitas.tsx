"use client";

import dynamic from "next/dynamic";
import DetalleVisita from "./DetalleVisita";
import { useCallback, useMemo, useRef, useState } from "react";
import type { CalendarRef, DatesSetInfo, DayHeaderInfo, EventClickInfo, EventDisplayInfo, SlotHeaderInfo } from "@fullcalendar/react";
import dayGrid from "@fullcalendar/react/daygrid";
import timeGrid from "@fullcalendar/react/timegrid";
import tema from "@fullcalendar/react/themes/monarch";
import español from "@fullcalendar/react/locales/es";
import { colorTecnico, eventosVisitas } from "@/lib/calendario";
import type { VisitaDB } from "@/lib/visitas";

// Reserva el espacio del calendario mientras se carga en el navegador.
function cargar() {
  return <p role="status" className="flex min-h-120 items-center justify-center text-sm text-slate-500">Cargando calendario…</p>;
}

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false, loading: cargar });
const plugins = [dayGrid, timeGrid, tema];
const horas = { hour: "2-digit", minute: "2-digit", hour12: false } as const;
const boton = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

// Mantiene visible la primera etiqueta del eje horario.
function claseHora(info: SlotHeaderInfo): string {
  return `texto-hora${info.isFirst ? " primera-hora" : ""}`;
}

// Prioriza la obra y el horario y reserva el técnico para las tarjetas amplias.
function tarjeta(info: EventDisplayInfo) {
  const visita = info.event.extendedProps.visita as VisitaDB;
  const inicio = visita.inicio.slice(11);
  const fin = visita.fin.slice(11);

  return (
    <div className={`tarjeta-visita${info.isShort ? " tarjeta-corta" : ""}`} title={`${visita.obra}\n${visita.tecnico}\n${inicio}–${fin}\n${visita.estado}`}>
      <p className={`truncate font-semibold${visita.estado === "Cancelada" ? " line-through" : ""}`}>{visita.estado === "Completada" && <span aria-label="Completada">✓ </span>}{visita.obra}</p>
      <p className="truncate tabular-nums">{inicio}–{fin}</p>
      <p className="tecnico-evento truncate">{visita.tecnico}</p>
    </div>
  );
}

// Atenúa las reservas canceladas sin cambiar los colores de los técnicos.
function claseEvento(info: EventDisplayInfo): string {
  const visita = info.event.extendedProps.visita as VisitaDB;
  return `visita-calendario${visita.estado === "Cancelada" ? " visita-cancelada" : ""}`;
}

// Destaca el día actual en la cabecera de cada columna.
function cabecera(info: DayHeaderInfo) {
  if (info.view.type === "dayGridMonth") {
    return <p className="py-2 text-xs font-semibold text-slate-600 uppercase">{info.weekdayText}</p>;
  }

  return (
    <div className="py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase text-slate-500">
        {info.date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "")}
        {info.isToday && <span className="rounded bg-slate-800 px-1 text-[9px] text-white">Hoy</span>}
      </div>
      <p className="mt-0.5 text-xs font-semibold text-slate-900">{info.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
    </div>
  );
}

type Props = {
  visitas: VisitaDB[];
  tecnicos: { id: number; nombre: string }[];
};

// Muestra la agenda semanal y mensual y permite consultar los detalles de cada visita.
export default function CalendarioVisitas({ visitas, tecnicos }: Props) {
  const calendario = useRef<CalendarRef>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const [titulo, setTitulo] = useState("");
  const [vista, setVista] = useState("timeGridWeek");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [tecnicoId, setTecnicoId] = useState("");
  const eventos = useMemo(() => eventosVisitas(visitas, tecnicoId), [visitas, tecnicoId]);
  const visita = visitas.find((item) => String(item.id) === seleccion);

  // Actualiza el título y la vista al navegar por el calendario.
  const actualizar = useCallback((info: DatesSetInfo) => {
    setTitulo(info.view.title);
    setVista(info.view.type);
  }, []);

  // Abre los detalles de la visita seleccionada.
  const abrir = useCallback((info: EventClickInfo) => {
    setSeleccion(info.event.id);
    modal.current?.showModal();
  }, []);

  return (
    <section aria-labelledby="titulo-calendario" className="mb-8 min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="titulo-calendario" className="text-lg font-semibold tracking-tight">Calendario de visitas</h2>
            <p className="mt-1 text-sm text-slate-500">Consulta la agenda y los detalles de cada visita.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">Lun–vie · 08:00–17:00</span>
            <label htmlFor="tecnico-calendario" className="sr-only">Técnico del calendario</label>
            <select id="tecnico-calendario" value={tecnicoId} onChange={(evento) => setTecnicoId(evento.target.value)} className="min-w-0 grow rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:grow-0">
              <option value="">Todos los técnicos</option>
              {tecnicos.map((tecnico) => <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</option>)}
            </select>
          </div>
        </div>
        <ul aria-label="Colores de los técnicos" className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
          {tecnicos.map((tecnico) => (
            <li key={tecnico.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ background: colorTecnico(tecnico.id) }} />{tecnico.nombre}</li>
          ))}
          <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-slate-500"><span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-slate-300" />Canceladas</li>
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Periodo anterior" onClick={() => calendario.current?.getApi().prev()} className={boton}>←</button>
          <button type="button" aria-label="Periodo siguiente" onClick={() => calendario.current?.getApi().next()} className={boton}>→</button>
          <button type="button" onClick={() => calendario.current?.getApi().today()} className={boton}>Hoy</button>
        </div>
        <p aria-live="polite" className="order-last w-full text-center text-base font-semibold text-slate-700 sm:order-0 sm:w-auto">{titulo}</p>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Vista del calendario">
          {[["timeGridWeek", "Semana"], ["dayGridMonth", "Mes"]].map(([tipo, etiqueta]) => (
            <button key={tipo} type="button" aria-pressed={vista === tipo} onClick={() => calendario.current?.getApi().changeView(tipo)} className={`rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${vista === tipo ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>{etiqueta}</button>
          ))}
        </div>
      </div>
      <div className="calendario overflow-x-auto px-3 pb-5 sm:px-6 sm:pb-6" role="region" aria-label="Agenda de visitas, desplazable horizontalmente" tabIndex={0}>
        <div className={`relative min-w-[1100px]${vista === "dayGridMonth" ? " calendario-mensual" : ""}`}>
          <FullCalendar
            ref={calendario}
            plugins={plugins}
            initialView="timeGridWeek"
            locale={español}
            firstDay={1}
            weekends={false}
            timeZone="local"
            headerToolbar={false}
            height={vista === "dayGridMonth" ? "clamp(420px, 58vh, 520px)" : "auto"}
            fixedWeekCount={false}
            expandRows
            slotMinTime="08:00:00"
            slotMaxTime="17:00:00"
            slotDuration="00:30:00"
            slotHeaderInterval="01:00:00"
            slotHeaderClass="hora-calendario"
            slotHeaderInnerClass={claseHora}
            slotLaneClass="franja-calendario"
            dayHeaderContent={cabecera}
            dayHeaderClass="cabecera-calendario"
            slotHeaderFormat={horas}
            eventTimeFormat={horas}
            allDaySlot={false}
            displayEventEnd
            eventDisplay="block"
            eventInteractive
            eventClass={claseEvento}
            eventInnerClass="interior-visita"
            eventContent={tarjeta}
            slotEventOverlap={false}
            eventMaxStack={2}
            eventShortHeight={55}
            editable={false}
            selectable={false}
            dayMaxEvents={vista === "dayGridMonth" ? 1 : 3}
            events={eventos}
            datesSet={actualizar}
            eventClick={abrir}
          />
          {vista === "timeGridWeek" && (
            <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10">
              <p className="hora-fin w-16 pl-[14px] text-left text-xs font-semibold text-slate-700 tabular-nums">17:00</p>
            </div>
          )}
        </div>
      </div>
      <DetalleVisita referencia={modal} visita={visita} />
    </section>
  );
}
