import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Lightbulb } from "lucide-react";
import { AYUDA, CONCEPTOS_EGRESO, CONCEPTOS_INGRESO } from "@/lib/finance";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guía rápida — Caja Viva" },
      { name: "description", content: "Aprende en 1 minuto dónde va cada movimiento de dinero de tu negocio." },
      { property: "og:title", content: "Guía rápida — Caja Viva" },
      { property: "og:description", content: "Dónde va cada movimiento: ingresos y egresos explicados fácil." },
    ],
  }),
  component: Guia,
});

function Guia() {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-hero px-5 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Guía rápida</h1>
      <p className="mt-2 text-muted-foreground">
        Aquí solo cuenta el <b className="text-foreground">dinero</b>. Pregúntate: ¿entró plata o salió plata?
      </p>

      <Bloque icon={<ArrowUpCircle className="h-6 w-6 text-success" />} titulo="Ingresos — entra dinero" items={CONCEPTOS_INGRESO} />
      <Bloque icon={<ArrowDownCircle className="h-6 w-6 text-destructive" />} titulo="Egresos — sale dinero" items={CONCEPTOS_EGRESO} />

      <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Lightbulb className="h-5 w-5" /> Ojo
        </div>
        <p className="mt-2 text-sm">
          Si compras una máquina, ahora tienes la máquina, pero <b>ya no el dinero</b>. Por eso va a egresos.
        </p>
        <p className="mt-2 text-sm">
          <b>Patrimonio sin gastos</b> te muestra cuánto tendrías si no contaras los gastos del día a día.
        </p>
      </div>
    </main>
  );
}

function Bloque({ icon, titulo, items }: { icon: React.ReactNode; titulo: string; items: string[] }) {
  return (
    <section className="mt-6 rounded-2xl bg-card p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">{icon} {titulo}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((c) => (
          <li key={c}>
            <div className="font-medium">{c}</div>
            <div className="text-sm text-muted-foreground">{AYUDA[c]}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
