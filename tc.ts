// Tipo de cambio USD → PEN del día, desde fuentes públicas gratuitas.
// Se guarda en caché por día para no pedirlo en cada operación.

let cache: { valor: number; fecha: string } | null = null;

const fuentes: Array<() => Promise<number | undefined>> = [
  async () => {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    return j?.rates?.PEN;
  },
  async () => {
    const r = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
    const j = await r.json();
    return j?.usd?.pen;
  },
];

/** Devuelve cuántos soles vale 1 dólar hoy, o null si no hubo conexión. */
export async function obtenerTipoCambio(): Promise<number | null> {
  const hoy = new Date().toISOString().slice(0, 10);
  if (cache?.fecha === hoy) return cache.valor;
  for (const f of fuentes) {
    try {
      const v = await f();
      if (typeof v === "number" && v > 0) {
        cache = { valor: Math.round(v * 1000) / 1000, fecha: hoy };
        return cache.valor;
      }
    } catch {
      // probar la siguiente fuente
    }
  }
  return null;
}
