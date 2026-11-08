import { describe, expect, it } from "vitest";
import { aSoles, libro, resumen, type Operacion } from "@/lib/finance";

const op = (tipo: Operacion["tipo"], concepto: string, monto: number, fecha = "2026-11-01"): Operacion => ({
  id: Math.random().toString(),
  tipo,
  concepto,
  monto,
  fecha,
});

describe("flujo de efectivo", () => {
  it("una compra resta del dinero disponible", () => {
    expect(resumen([op("ingreso", "Venta", 500), op("egreso", "Compra", 200)]).disponible).toBe(300);
  });
  it("el patrimonio sin gastos ignora solo los gastos", () => {
    const r = resumen([op("ingreso", "Venta", 100), op("egreso", "Gasto", 10), op("egreso", "Compra", 50)]);
    expect(r.disponible).toBe(40);
    expect(r.sinGastos).toBe(50);
  });
  it("cuenta operaciones de ingresos y egresos", () => {
    const r = resumen([op("ingreso", "Venta", 1), op("egreso", "Compra", 1), op("egreso", "Anticipo", 1)]);
    expect([r.nTotal, r.nIng, r.nEgr]).toEqual([3, 1, 2]);
  });
  it("el libro acumula el patrimonio en orden de fecha", () => {
    const l = libro([op("egreso", "Compra", 30, "2026-11-02"), op("ingreso", "Venta", 100, "2026-11-01")]);
    expect(l.map((f) => f.patrimonio)).toEqual([100, 70]);
  });
  it("los dólares se convierten a soles con el tipo de cambio del día", () => {
    expect(aSoles(100, "USD", 3.8)).toBe(380);
    expect(aSoles(100, "PEN")).toBe(100);
  });
});
