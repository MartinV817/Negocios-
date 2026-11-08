export type Tipo = "ingreso" | "egreso";
export type Moneda = "PEN" | "USD";

export interface Operacion {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: Tipo;
  concepto: string;
  monto: number; // siempre en soles
  moneda?: Moneda | undefined; // moneda en que se anotó (por defecto PEN)
  tc?: number | undefined; // tipo de cambio usado si moneda es USD
  glosa?: string | undefined;
  foto?: string | undefined;
}

/** Convierte el monto anotado a soles. Los dólares usan el tipo de cambio del día. */
export function aSoles(monto: number, moneda: Moneda, tc?: number) {
  return moneda === "USD" ? monto * (tc ?? 0) : monto;
}

// Reglas del negocio (flujo de efectivo): solo cuenta el dinero.
// Compra, anticipo, gasto y capital de terceros salen como egreso;
// venta y capital propio entran como ingreso.
export const CONCEPTOS_INGRESO = ["Venta", "Alquiler", "Mantenimiento", "Aumento de capital propio"];
export const CONCEPTOS_EGRESO = ["Compra", "Anticipo", "Gasto", "Aumento de capital por terceros"];

export const AYUDA: Record<string, string> = {
  Venta: "Vendiste algo: entra dinero a tu caja.",
  Alquiler: "Te pagaron por alquilar una máquina.",
  Mantenimiento: "Te pagaron por un servicio de mantenimiento.",
  "Aumento de capital propio": "Pusiste dinero tuyo: es tuyo, no le debes a nadie.",
  Compra: "Compraste algo: tienes el bien, pero ya no el dinero.",
  Anticipo: "Pagaste por adelantado: el dinero ya salió.",
  Gasto: "Pagaste un servicio, sueldo, luz, etc.",
  "Aumento de capital por terceros":
    "Dinero prestado: no te pertenece, por eso se cuenta como egreso.",
};

export function esGasto(op: Operacion) {
  return op.tipo === "egreso" && op.concepto === "Gasto";
}

export function resumen(ops: Operacion[]) {
  let ingresos = 0,
    egresos = 0,
    gastos = 0,
    nIng = 0,
    nEgr = 0;
  for (const o of ops) {
    if (o.tipo === "ingreso") {
      ingresos += o.monto;
      nIng++;
    } else {
      egresos += o.monto;
      nEgr++;
      if (esGasto(o)) gastos += o.monto;
    }
  }
  const total = ingresos + egresos;
  return {
    ingresos,
    egresos,
    gastos,
    disponible: ingresos - egresos,
    sinGastos: ingresos - egresos + gastos,
    nIng,
    nEgr,
    nTotal: ops.length,
    pctIng: total ? (ingresos / total) * 100 : 0,
    pctEgr: total ? (egresos / total) * 100 : 0,
  };
}

/** Filas con patrimonio acumulado, ordenadas por fecha. */
export function libro(ops: Operacion[]) {
  const ordenadas = [...ops].sort((a, b) => a.fecha.localeCompare(b.fecha));
  let pat = 0,
    sg = 0;
  return ordenadas.map((o) => {
    const ing = o.tipo === "ingreso" ? o.monto : 0;
    const egr = o.tipo === "egreso" ? o.monto : 0;
    pat += ing - egr;
    sg += ing - (esGasto(o) ? 0 : egr);
    return { ...o, ingreso: ing, egreso: egr, patrimonio: pat, sinGastos: sg };
  });
}

export function filtrar(ops: Operacion[], desde?: string, hasta?: string) {
  return ops.filter((o) => (!desde || o.fecha >= desde) && (!hasta || o.fecha <= hasta));
}

export const dinero = (n: number) =>
  "S/ " + n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
