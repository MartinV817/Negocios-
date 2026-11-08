import { libro, resumen, type Operacion } from "./finance";

const filas = (ops: Operacion[]) =>
  libro(ops).map((f) => ({
    Fecha: f.fecha,
    Descripción: `${f.concepto.toUpperCase()}${f.glosa ? " — " + f.glosa : ""}`,
    Moneda: f.moneda === "USD" ? "USD" : "PEN",
    TC: f.tc ?? "",
    Ingresos: +f.ingreso.toFixed(2),
    Egresos: +f.egreso.toFixed(2),
    Patrimonio: +f.patrimonio.toFixed(2),
    "P. sin gastos": +f.sinGastos.toFixed(2),
  }));

export async function exportarXLS(ops: Operacion[], rango: string) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(filas(ops));
  ws["!cols"] = [{ wch: 12 }, { wch: 36 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Flujo");
  XLSX.writeFile(wb, `flujo-${rango}.xlsx`);
}

export async function exportarPDF(ops: Operacion[], rango: string, nombre: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const r = resumen(ops);
  doc.setFontSize(16);
  doc.text(`Flujo de efectivo${nombre ? " — " + nombre : ""}`, 14, 18);
  doc.setFontSize(10);
  doc.text(`Periodo: ${rango}`, 14, 25);
  const f = filas(ops);
  autoTable(doc, {
    startY: 30,
    head: [Object.keys(f[0] ?? { Fecha: "" })],
    body: f.map((x) => Object.values(x).map(String)),
    foot: [["", "TOTAL", "", "", r.ingresos.toFixed(2), r.egresos.toFixed(2), r.disponible.toFixed(2), r.sinGastos.toFixed(2)]],
    styles: { fontSize: 8 },
  });
  doc.save(`flujo-${rango}.pdf`);
}
