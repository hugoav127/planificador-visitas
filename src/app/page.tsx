
import { sql } from "@/lib/db";
import { listarVisitas } from "@/lib/visitas";
import VisitaForm from "@/components/VisitaForm";
import ListaVisitas from "@/components/ListaVisitas";
import CalendarioVisitas from "@/components/CalendarioVisitas";

export const dynamic = "force-dynamic";

type Tecnico = {
  id: number;
  nombre: string;
};

type Obra = {
  id: number;
  nombre: string;
  municipio: string;
};

// Recupera los catálogos y la agenda para mostrar el planificador.
export default async function Home() {
  const tecnicos = (await sql`
    SELECT id, nombre
    FROM tecnicos
    ORDER BY id
  `) as Tecnico[];

  const obras = (await sql`
    SELECT id, nombre, municipio
    FROM obras
    ORDER BY id
  `) as Obra[];

  const visitas = await listarVisitas();
  const indicadores = [
    { nombre: "Técnicos", valor: tecnicos.length, simbolo: "personas", detalle: "Equipo técnico" },
    { nombre: "Visitas programadas", valor: visitas.filter((visita) => visita.estado === "Programada").length, simbolo: "calendario", detalle: "Reservas activas" },
    { nombre: "Obras", valor: obras.length, simbolo: "obra", detalle: "Obras registradas" },
  ];

  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-6 text-slate-900 sm:px-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/15">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 5-4" /></svg>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-widest text-blue-700 uppercase">Gestión de operaciones</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Planificador de visitas</h1>
            <p className="mt-1.5 text-sm text-slate-500">Organiza tu equipo y coordina las visitas a obra.</p>
          </div>
        </div>
        <VisitaForm tecnicos={tecnicos} obras={obras} />
      </header>

      <section aria-label="Resumen de la planificación" className="mb-8 grid gap-4 sm:grid-cols-3">
        {indicadores.map((indicador) => (
          <article key={indicador.nombre} className="flex items-start justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-sm font-medium text-slate-500">{indicador.nombre}</h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{indicador.valor}</p>
              <p className="mt-1 text-xs text-slate-400">{indicador.detalle}</p>
            </div>
            <span aria-hidden="true" className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {indicador.simbolo === "personas" ? <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m2 11v-3a6 6 0 0 0-2-4" /></> : indicador.simbolo === "calendario" ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 5-4" /></> : <><path d="M4 21V5l8-3v19m0-14h8v14M2 21h20M8 7v1m0 4v1m0 4v1m8-7v1m0 4v1" /></>}
              </svg>
            </span>
          </article>
        ))}
      </section>

      <CalendarioVisitas visitas={visitas} tecnicos={tecnicos} />
      <ListaVisitas visitas={visitas} tecnicos={tecnicos} />
    </main>
  );
}
