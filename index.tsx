import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, BookOpen, Camera, FileSpreadsheet, FileText, History, Lock, Plus, Trash2, User, X,
} from "lucide-react";
import { AYUDA, aSoles, dinero, filtrar, libro, resumen, type Moneda, type Operacion, type Tipo } from "@/lib/finance";
import { leerImagen, useDatos } from "@/lib/store";
import { exportarPDF, exportarXLS } from "@/lib/exportar";
import { obtenerTipoCambio } from "@/lib/tc";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Caja Viva — Tu dinero en vivo" },
      { name: "description", content: "Anota ingresos y egresos de tu negocio con un toque y mira cuánto dinero tienes disponible." },
      { property: "og:title", content: "Caja Viva — Tu dinero en vivo" },
      { property: "og:description", content: "Flujo de efectivo sencillo para negocios: ingresos, egresos y reportes en Excel o PDF." },
    ],
  }),
  component: App,
});

const hoy = () => new Date().toISOString().slice(0, 10);
const soloNumeros = (v: string) => v.replace(/[^0-9.,]/g, "");

/* Minerales que brotan desde abajo y se desvanecen: oro, plata y cobre. */
const MINERALES = [
  { left: "4%", size: 12, delay: "0s", dur: "12s", c: "bg-oro" },
  { left: "17%", size: 9, delay: "3.2s", dur: "14s", c: "bg-plata" },
  { left: "31%", size: 14, delay: "6.5s", dur: "11s", c: "bg-cobre" },
  { left: "46%", size: 8, delay: "1.8s", dur: "15s", c: "bg-oro" },
  { left: "59%", size: 12, delay: "8s", dur: "13s", c: "bg-plata" },
  { left: "71%", size: 10, delay: "4.6s", dur: "12s", c: "bg-cobre" },
  { left: "84%", size: 13, delay: "2.2s", dur: "14s", c: "bg-oro" },
  { left: "93%", size: 8, delay: "9.4s", dur: "16s", c: "bg-plata" },
];

function Minerales() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {MINERALES.map((m, i) => (
        <span
          key={i}
          className={`absolute -bottom-5 rounded-[30%] animate-brotar ${m.c}`}
          style={{ left: m.left, width: m.size, height: m.size, animationDelay: m.delay, animationDuration: m.dur }}
        />
      ))}
    </div>
  );
}

function App() {
  const { datos, listo, guardar, conceptos } = useDatos();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<Tipo | null>(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [verHist, setVerHist] = useState(false);
  const [tcHoy, setTcHoy] = useState<number | null>(null);

  useEffect(() => {
    obtenerTipoCambio().then(setTcHoy);
  }, []);

  const ops = useMemo(() => filtrar(datos.ops, desde, hasta), [datos.ops, desde, hasta]);
  const r = resumen(ops);
  const rango = `${desde || "inicio"}_a_${hasta || "hoy"}`;

  if (!listo) return <main className="min-h-screen bg-hero" />;
  if (!datos.pin)
    return <CrearClave set={(pin) => { guardar((d) => ({ ...d, pin })); setAbierto(true); }} />;
  if (!abierto) return <Candado pin={datos.pin} onOk={() => setAbierto(true)} />;

  return (
    <main className="relative mx-auto min-h-screen max-w-md bg-hero px-5 pb-24 pt-6">
      <Minerales />

      {/* Perfil */}
      <header className="relative flex items-center gap-3">
        <label className="relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary">
          {datos.foto ? <img src={datos.foto} alt="Perfil" className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (f) { const foto = await leerImagen(f, 200); guardar((d) => ({ ...d, foto })); }
          }} />
        </label>
        <input
          value={datos.nombre}
          onChange={(e) => guardar((d) => ({ ...d, nombre: e.target.value }))}
          placeholder="Nombre de tu negocio"
          className="min-w-0 flex-1 rounded-xl border border-input bg-transparent px-3 py-3 text-lg font-semibold outline-none focus:border-primary"
        />
        <Link to="/guia" aria-label="Guía" className="rounded-full bg-secondary p-3"><BookOpen className="h-5 w-5 text-primary" /></Link>
      </header>

      {/* Balance */}
      <section className="relative mt-6 rounded-3xl border border-border bg-card/70 p-5 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <div className="text-sm text-muted-foreground">Dinero disponible</div>
          {tcHoy && <div className="text-xs text-muted-foreground">Dólar hoy: S/ {tcHoy.toFixed(2)}</div>}
        </div>
        <div className={`mt-1 font-display text-4xl font-bold ${r.disponible < 0 ? "text-destructive" : ""}`}>{dinero(r.disponible)}</div>
        <div className="mt-4 flex items-center gap-5">
          <Dona ing={r.pctIng} />
          <div className="flex-1 space-y-3 text-sm">
            <Fila color="bg-success" label="Ingresos" valor={r.ingresos} pct={r.pctIng} />
            <Fila color="bg-destructive" label="Egresos" valor={r.egresos} pct={r.pctEgr} />
            <div className="flex justify-between text-muted-foreground"><span>Sin gastos</span><span>{dinero(r.sinGastos)}</span></div>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-secondary px-3 py-2 text-center text-sm">
          <b>{r.nTotal}</b> operaciones · <span className="text-success">{r.nIng} ingresos</span> · <span className="text-destructive">{r.nEgr} egresos</span>
        </p>
      </section>

      {/* Botones grandes */}
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <button onClick={() => setForm("ingreso")} className="flex flex-col items-center gap-2 rounded-3xl bg-success py-6 font-display text-lg font-bold text-success-foreground active:scale-95 transition">
          <ArrowUpCircle className="h-9 w-9" /> Ingresos
        </button>
        <button onClick={() => setForm("egreso")} className="flex flex-col items-center gap-2 rounded-3xl bg-destructive py-6 font-display text-lg font-bold text-destructive-foreground active:scale-95 transition">
          <ArrowDownCircle className="h-9 w-9" /> Egresos
        </button>
      </div>

      {/* Fechas */}
      <section className="relative mt-6 rounded-2xl bg-card p-4">
        <div className="text-sm font-semibold">Ver por fechas</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <label className="text-muted-foreground">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 w-full rounded-lg bg-secondary px-2 py-2 text-foreground" /></label>
          <label className="text-muted-foreground">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 w-full rounded-lg bg-secondary px-2 py-2 text-foreground" /></label>
        </div>
      </section>

      {/* Acciones */}
      <div className="relative mt-4 grid grid-cols-3 gap-2 text-xs font-semibold">
        <Accion icon={<History />} label="Historial" onClick={() => setVerHist((v) => !v)} />
        <Accion icon={<FileSpreadsheet />} label="Excel" onClick={() => exportarXLS(ops, rango)} />
        <Accion icon={<FileText />} label="PDF" onClick={() => exportarPDF(ops, rango, datos.nombre)} />
      </div>

      {verHist && <Historial ops={ops} borrar={(id) => guardar((d) => ({ ...d, ops: d.ops.filter((o) => o.id !== id) }))} />}

      <PinAjuste pin={datos.pin} set={(pin) => guardar((d) => ({ ...d, pin }))} />

      {form && (
        <Formulario
          tipo={form}
          conceptos={conceptos(form)}
          cerrar={() => setForm(null)}
          agregarConcepto={(c) => guardar((d) => form === "ingreso" ? { ...d, extraIng: [...d.extraIng, c] } : { ...d, extraEgr: [...d.extraEgr, c] })}
          guardarOp={(op) => { guardar((d) => ({ ...d, ops: [...d.ops, op] })); setForm(null); }}
        />
      )}
    </main>
  );
}

function Dona({ ing }: { ing: number }) {
  const c = 2 * Math.PI * 34;
  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
      <circle cx="40" cy="40" r="34" fill="none" strokeWidth="10" className="stroke-destructive/70" />
      <circle cx="40" cy="40" r="34" fill="none" strokeWidth="10" strokeLinecap={ing > 0 ? "round" : "butt"} className="stroke-success transition-all duration-700"
        strokeDasharray={`${(ing / 100) * c} ${c}`} />
    </svg>
  );
}

function Fila({ color, label, valor, pct }: { color: string; label: string; valor: number; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
      </div>
      <div className="font-semibold">{dinero(valor)}</div>
    </div>
  );
}

function Accion({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3 text-primary [&_svg]:h-5 [&_svg]:w-5">
      {icon}<span className="text-foreground">{label}</span>
    </button>
  );
}

function Historial({ ops, borrar }: { ops: Operacion[]; borrar: (id: string) => void }) {
  const filas = libro(ops).reverse();
  return (
    <section className="relative mt-4 space-y-2">
      {filas.length === 0 && <p className="text-center text-sm text-muted-foreground">Aún no hay operaciones.</p>}
      {filas.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
          {f.foto ? <img src={f.foto} alt="" className="h-10 w-10 rounded-lg object-cover" /> :
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.tipo === "ingreso" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {f.tipo === "ingreso" ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
            </div>}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{f.concepto}</div>
            <div className="truncate text-xs text-muted-foreground">
              {f.fecha}
              {f.moneda === "USD" && f.tc ? ` · $ ${(f.monto / f.tc).toFixed(2)} × ${f.tc.toFixed(2)}` : ""}
              {f.glosa ? " · " + f.glosa : ""}
            </div>
          </div>
          <div className="text-right">
            <div className={`font-semibold ${f.tipo === "ingreso" ? "text-success" : "text-destructive"}`}>{f.tipo === "ingreso" ? "+" : "−"}{dinero(f.monto)}</div>
            <div className="text-xs text-muted-foreground">Queda {dinero(f.patrimonio)}</div>
          </div>
          <button aria-label="Borrar" onClick={() => confirm("¿Borrar esta operación?") && borrar(f.id)} className="text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </section>
  );
}

function Formulario({ tipo, conceptos, cerrar, guardarOp, agregarConcepto }: {
  tipo: Tipo; conceptos: string[]; cerrar: () => void; guardarOp: (o: Operacion) => void; agregarConcepto: (c: string) => void;
}) {
  const [concepto, setConcepto] = useState<string>(conceptos[0] ?? "");
  const [moneda, setMoneda] = useState<Moneda>("PEN");
  const [monto, setMonto] = useState("");
  const [tc, setTc] = useState<number | null>(null);
  const [glosa, setGlosa] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [foto, setFoto] = useState<string>();
  const ing = tipo === "ingreso";
  const n = parseFloat(monto.replace(",", "."));

  useEffect(() => {
    if (moneda === "USD" && tc == null) obtenerTipoCambio().then(setTc);
  }, [moneda, tc]);

  const enSoles = moneda === "USD" ? aSoles(n || 0, "USD", tc ?? 0) : n;
  const listoParaGuardar = n > 0 && (moneda === "PEN" || (tc ?? 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={cerrar}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${ing ? "text-success" : "text-destructive"}`}>{ing ? "Ingresos" : "Egresos"}</h2>
          <button onClick={cerrar} aria-label="Cerrar"><X className="h-6 w-6" /></button>
        </div>

        <div className="mt-4 text-sm font-semibold">¿Por qué?</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {conceptos.map((c) => (
            <button key={c} onClick={() => setConcepto(c)}
              className={`rounded-full border px-3 py-2 text-sm ${concepto === c ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{c}</button>
          ))}
          <button onClick={() => { const c = prompt("Nuevo concepto:")?.trim(); if (c) { agregarConcepto(c); setConcepto(c); } }}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"><Plus className="h-4 w-4" />Otro</button>
        </div>
        {AYUDA[concepto] && <p className="mt-2 rounded-xl bg-secondary px-3 py-2 text-sm text-muted-foreground">💡 {AYUDA[concepto]}</p>}

        <div className="mt-4 text-sm font-semibold">¿En qué moneda?</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={() => setMoneda("PEN")}
            className={`rounded-xl border py-3 font-display font-bold ${moneda === "PEN" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>S/ Soles</button>
          <button onClick={() => setMoneda("USD")}
            className={`rounded-xl border py-3 font-display font-bold ${moneda === "USD" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>$ Dólares</button>
        </div>

        <label className="mt-4 block text-sm font-semibold">Monto {moneda === "USD" ? "en dólares" : "en soles"}
          <input inputMode="decimal" autoFocus value={monto} onChange={(e) => setMonto(soloNumeros(e.target.value))} placeholder="0.00"
            className="mt-1 w-full rounded-xl bg-secondary px-4 py-4 font-display text-3xl font-bold outline-none focus:ring-2 focus:ring-ring" />
        </label>

        {moneda === "USD" && (
          <div className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm">
            <label className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Tipo de cambio del día</span>
              <input
                inputMode="decimal"
                value={tc == null ? "" : String(tc)}
                onChange={(e) => { const v = parseFloat(soloNumeros(e.target.value).replace(",", ".")); setTc(isNaN(v) ? null : v); }}
                placeholder={tc == null ? "Buscando…" : "3.75"}
                className="w-24 rounded-lg bg-background px-2 py-1 text-right font-semibold outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {tc == null && <p className="mt-1 text-xs text-muted-foreground">Si no aparece solo, escríbelo tú.</p>}
            {n > 0 && (tc ?? 0) > 0 && <p className="mt-2 font-semibold">Se guardará como ≈ {dinero(enSoles)}</p>}
          </div>
        )}

        <label className="mt-3 block text-sm font-semibold">Nota <span className="font-normal text-muted-foreground">(opcional)</span>
          <input value={glosa} onChange={(e) => setGlosa(e.target.value)} placeholder="Ej: Alquiler excavadora a Juan" className="mt-1 w-full rounded-xl bg-secondary px-4 py-3 outline-none" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-sm font-semibold">Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded-xl bg-secondary px-3 py-3" />
          </label>
          <label className="text-sm font-semibold">Foto <span className="font-normal text-muted-foreground">(opcional)</span>
            <span className="mt-1 flex h-[46px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-secondary">
              {foto ? <img src={foto} alt="Comprobante" className="h-full w-full object-cover" /> : <><Camera className="h-5 w-5" />Comprobante</>}
            </span>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setFoto(await leerImagen(f)); }} />
          </label>
        </div>

        <button disabled={!listoParaGuardar}
          onClick={() => guardarOp({
            id: crypto.randomUUID(), tipo, concepto, fecha, foto,
            monto: Math.round(enSoles * 100) / 100,
            moneda, tc: moneda === "USD" ? (tc ?? undefined) : undefined,
            glosa: glosa || undefined,
          })}
          className={`mt-5 w-full rounded-2xl py-4 font-display text-lg font-bold disabled:opacity-40 ${ing ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function CrearClave({ set }: { set: (p: string) => void }) {
  const [v, setV] = useState("");
  const ok = v.trim().length >= 4;
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-hero px-6 text-center">
      <Minerales />
      <Lock className="relative h-10 w-10 text-primary" />
      <h1 className="relative mt-4 text-2xl font-bold">Protege tu caja</h1>
      <p className="relative mt-2 max-w-xs text-sm text-muted-foreground">
        Esta app es privada. Crea una contraseña de al menos 4 números; te la pediremos cada vez que entres.
      </p>
      <input type="password" inputMode="numeric" autoFocus value={v}
        onChange={(e) => setV(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && ok && set(v.trim())}
        className="relative mt-6 w-56 rounded-xl bg-secondary px-4 py-3 text-center text-2xl tracking-widest outline-none" />
      <button disabled={!ok} onClick={() => set(v.trim())}
        className="relative mt-4 w-56 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-40">Crear y entrar</button>
    </main>
  );
}

function Candado({ pin, onOk }: { pin: string; onOk: () => void }) {
  const [v, setV] = useState("");
  const [err, setErr] = useState(false);
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-hero px-6">
      <Minerales />
      <Lock className="relative h-10 w-10 text-primary" />
      <h1 className="relative mt-4 text-2xl font-bold">Ingresa tu contraseña</h1>
      <input type="password" inputMode="numeric" autoFocus value={v} onChange={(e) => { setV(e.target.value); setErr(false); }}
        onKeyDown={(e) => e.key === "Enter" && (v === pin ? onOk() : setErr(true))}
        className="relative mt-6 w-56 rounded-xl bg-secondary px-4 py-3 text-center text-2xl tracking-widest outline-none" />
      {err && <p className="relative mt-2 text-sm text-destructive">Contraseña incorrecta</p>}
      <button onClick={() => (v === pin ? onOk() : setErr(true))} className="relative mt-4 w-56 rounded-xl bg-primary py-3 font-bold text-primary-foreground">Entrar</button>
    </main>
  );
}

function PinAjuste({ pin, set }: { pin: string | undefined; set: (p?: string) => void }) {
  return (
    <button
      onClick={() => {
        if (pin) { if (confirm("¿Quitar la contraseña? La próxima vez te pediremos crear una nueva.")) set(undefined); return; }
        const p = prompt("Crea una contraseña (números):")?.trim();
        if (p) set(p);
      }}
      className="relative mx-auto mt-8 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary"
    >
      <Lock className="h-4 w-4" /> {pin ? "Contraseña activa · quitar" : "Poner contraseña"}
    </button>
  );
}
