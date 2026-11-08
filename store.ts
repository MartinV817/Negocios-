import { useEffect, useState } from "react";
import { CONCEPTOS_EGRESO, CONCEPTOS_INGRESO, type Operacion } from "./finance";

export interface Datos {
  nombre: string;
  foto?: string | undefined;
  pin?: string | undefined;
  ops: Operacion[];
  extraIng: string[];
  extraEgr: string[];
}

const KEY = "caja-viva-v1";
const vacio: Datos = { nombre: "", ops: [], extraIng: [], extraEgr: [] };

export function useDatos() {
  const [datos, setDatos] = useState<Datos>(vacio);
  const [listo, setListo] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDatos({ ...vacio, ...JSON.parse(raw) });
    } catch {}
    setListo(true);
  }, []);
  const guardar = (fn: (d: Datos) => Datos) =>
    setDatos((d) => {
      const n = fn(d);
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        alert("No hay espacio para guardar. Prueba con fotos más pequeñas.");
      }
      return n;
    });
  return {
    datos,
    listo,
    guardar,
    conceptos: (t: "ingreso" | "egreso") =>
      t === "ingreso" ? [...CONCEPTOS_INGRESO, ...datos.extraIng] : [...CONCEPTOS_EGRESO, ...datos.extraEgr],
  };
}

export function leerImagen(file: File, max = 900): Promise<string> {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s;
      c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  });
}
