
import { sql } from "@/lib/db";

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

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Planificador de visitas
      </h1>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">
          Técnicos ({tecnicos.length})
        </h2>

        <ul className="space-y-2">
          {tecnicos.map((tecnico) => (
            <li key={tecnico.id}>
              {tecnico.nombre}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Obras ({obras.length})
        </h2>

        <ul className="space-y-2">
          {obras.map((obra) => (
            <li key={obra.id}>
              {obra.nombre} — {obra.municipio}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
