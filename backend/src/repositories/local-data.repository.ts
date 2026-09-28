import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ActividadPublica, DbCategoria, DbVecind, PreferenciasUsuario } from "../types-db.js";

const DIR_ACTUAL = dirname(fileURLToPath(import.meta.url));
const RUTA_DATA = join(DIR_ACTUAL, "..", "..", "data");

export interface ActividadAlmacenada {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  horarios: string;
  direccion: string;
  lat: number;
  lng: number;
  url?: string;
  imagenUrl?: string;
  categoriaId: string;
  barrioId: string;
  destacado: boolean;
  activo: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenciaAlmacenada {
  usuarioId: string;
  barrioId: string | null;
  categoriaIds: string[];
  actualizadoEn: string;
}

function leerJson<T>(archivo: string, porDefecto: T): T {
  const ruta = join(RUTA_DATA, archivo);
  if (!existsSync(ruta)) return porDefecto;
  try {
    let raw = readFileSync(ruta, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) {
      raw = raw.slice(1);
    }
    return JSON.parse(raw) as T;
  } catch {
    return porDefecto;
  }
}

function escribirJson<T>(archivo: string, datos: T): void {
  const ruta = join(RUTA_DATA, archivo);
  mkdirSync(dirname(ruta), { recursive: true });
  const temporal = `${ruta}.tmp`;
  writeFileSync(temporal, JSON.stringify(datos, null, 2), "utf-8");
  renameSync(temporal, ruta);
}

export class LocalDataRepository {
  listarBarrios(): DbVecind[] {
    const barrios = leerJson<Array<{ id: string; nombre: string; slug: string }>>("barrios.json", []);
    return barrios.map((b) => ({
      id: b.id,
      nombre: b.nombre,
      slug: b.slug,
      created_at: "2026-08-01T00:00:00.000Z"
    }));
  }

  obtenerBarrio(id: string): DbVecind | null {
    return this.listarBarrios().find((b) => b.id === id || b.slug === id) ?? null;
  }

  listarCategorias(): DbCategoria[] {
    const cats = leerJson<Array<{ id: string; nombre: string; slug: string; color: string; icono: string }>>("categorias.json", []);
    return cats.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      color: c.color,
      icono: c.icono,
      created_at: "2026-08-01T00:00:00.000Z"
    }));
  }

  obtenerCategoria(id: string): DbCategoria | null {
    return this.listarCategorias().find((c) => c.id === id || c.slug === id) ?? null;
  }

  private hidratarActividad(a: ActividadAlmacenada): ActividadPublica & { activo: boolean } {
    const categoria = this.obtenerCategoria(a.categoriaId) ?? {
      id: a.categoriaId,
      nombre: "General",
      slug: "general",
      color: "#F98017",
      icono: "📌",
      created_at: ""
    };
    const barrio = this.obtenerBarrio(a.barrioId) ?? {
      id: a.barrioId,
      nombre: "Mataderos",
      slug: "mataderos",
      created_at: ""
    };

    return {
      id: a.id,
      nombre: a.nombre,
      slug: a.slug,
      descripcion: a.descripcion,
      horarios: a.horarios ?? "",
      direccion: a.direccion,
      lat: a.lat,
      lng: a.lng,
      url: a.url ?? "",
      imagenUrl: a.imagenUrl ?? "",
      categoria: {
        id: categoria.id,
        nombre: categoria.nombre,
        slug: categoria.slug,
        color: categoria.color,
        icono: categoria.icono
      },
      barrio: {
        id: barrio.id,
        nombre: barrio.nombre,
        slug: barrio.slug
      },
      destacado: a.destacado ?? false,
      activo: a.activo !== false
    };
  }

  listarActividades(filtros: { barrioSlug?: string; categoriaSlug?: string; limite?: number; soloActivos?: boolean } = {}): Array<ActividadPublica & { activo: boolean }> {
    const todas = leerJson<ActividadAlmacenada[]>("actividades.json", []);
    let filtradas = todas;

    if (filtros.soloActivos !== false) {
      filtradas = filtradas.filter((a) => a.activo !== false);
    }

    if (filtros.barrioSlug) {
      const barrio = this.listarBarrios().find((b) => b.slug === filtros.barrioSlug);
      if (barrio) {
        filtradas = filtradas.filter((a) => a.barrioId === barrio.id);
      }
    }

    if (filtros.categoriaSlug) {
      const cat = this.listarCategorias().find((c) => c.slug === filtros.categoriaSlug);
      if (cat) {
        filtradas = filtradas.filter((a) => a.categoriaId === cat.id);
      }
    }

    if (filtros.limite && filtros.limite > 0) {
      filtradas = filtradas.slice(0, filtros.limite);
    }

    return filtradas.map((a) => this.hidratarActividad(a));
  }

  obtenerActividadPorSlug(slug: string, barrioSlug: string): ActividadPublica | null {
    const todas = this.listarActividades({ soloActivos: true });
    return todas.find((a) => a.slug === slug && a.barrio.slug === barrioSlug) ?? null;
  }

  crearActividad(datos: Record<string, unknown>, usuarioId: string): ActividadPublica {
    const todas = leerJson<ActividadAlmacenada[]>("actividades.json", []);
    const nombre = String(datos.nombre ?? "").trim();
    const slug = nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const ahora = new Date().toISOString();

    const nueva: ActividadAlmacenada = {
      id: `act-${Date.now()}`,
      nombre,
      slug,
      descripcion: String(datos.descripcion ?? ""),
      horarios: String(datos.horarios ?? ""),
      direccion: String(datos.direccion ?? ""),
      lat: Number(datos.lat) || -34.6533,
      lng: Number(datos.lng) || -58.5237,
      url: datos.url ? String(datos.url) : "",
      imagenUrl: datos.imagenUrl ? String(datos.imagenUrl) : "",
      categoriaId: String(datos.categoriaId ?? "c-ferias"),
      barrioId: String(datos.barrioId ?? "b-mataderos"),
      destacado: Boolean(datos.destacado),
      activo: true,
      createdBy: usuarioId,
      createdAt: ahora,
      updatedAt: ahora
    };

    todas.push(nueva);
    escribirJson("actividades.json", todas);
    return this.hidratarActividad(nueva);
  }

  actualizarActividad(id: string, datos: Record<string, unknown>, usuarioId: string): ActividadPublica {
    const todas = leerJson<ActividadAlmacenada[]>("actividades.json", []);
    const idx = todas.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error("Actividad no encontrada.");
    }

    const actual = todas[idx];
    const actualizada: ActividadAlmacenada = {
      ...actual,
      nombre: datos.nombre !== undefined ? String(datos.nombre) : actual.nombre,
      descripcion: datos.descripcion !== undefined ? String(datos.descripcion) : actual.descripcion,
      horarios: datos.horarios !== undefined ? String(datos.horarios) : actual.horarios,
      direccion: datos.direccion !== undefined ? String(datos.direccion) : actual.direccion,
      lat: datos.lat !== undefined ? Number(datos.lat) : actual.lat,
      lng: datos.lng !== undefined ? Number(datos.lng) : actual.lng,
      url: datos.url !== undefined ? String(datos.url) : actual.url,
      imagenUrl: datos.imagenUrl !== undefined ? String(datos.imagenUrl) : actual.imagenUrl,
      categoriaId: datos.categoriaId !== undefined ? String(datos.categoriaId) : actual.categoriaId,
      barrioId: datos.barrioId !== undefined ? String(datos.barrioId) : actual.barrioId,
      destacado: datos.destacado !== undefined ? Boolean(datos.destacado) : actual.destacado,
      activo: datos.activo !== undefined ? Boolean(datos.activo) : actual.activo,
      updatedAt: new Date().toISOString()
    };

    todas[idx] = actualizada;
    escribirJson("actividades.json", todas);
    return this.hidratarActividad(actualizada);
  }

  eliminarActividad(id: string): void {
    const todas = leerJson<ActividadAlmacenada[]>("actividades.json", []);
    const idx = todas.findIndex((a) => a.id === id);
    if (idx !== -1) {
      todas[idx].activo = false;
      todas[idx].updatedAt = new Date().toISOString();
      escribirJson("actividades.json", todas);
    }
  }

  obtenerPreferencias(usuarioId: string): PreferenciasUsuario {
    const lista = leerJson<PreferenciaAlmacenada[]>("preferencias.json", []);
    const encontrada = lista.find((p) => p.usuarioId === usuarioId);
    if (!encontrada) {
      return {
        barrioId: null,
        barrio: null,
        categorias: []
      };
    }

    const barrio = encontrada.barrioId ? this.obtenerBarrio(encontrada.barrioId) : null;
    const cats = this.listarCategorias().filter((c) => encontrada.categoriaIds.includes(c.id));

    return {
      barrioId: encontrada.barrioId,
      barrio,
      categorias: cats
    };
  }

  guardarPreferencias(usuarioId: string, barrioId: string | null, categoriaIds: string[]): PreferenciasUsuario {
    const lista = leerJson<PreferenciaAlmacenada[]>("preferencias.json", []);
    const idx = lista.findIndex((p) => p.usuarioId === usuarioId);
    const ahora = new Date().toISOString();

    const nueva: PreferenciaAlmacenada = {
      usuarioId,
      barrioId: barrioId || null,
      categoriaIds,
      actualizadoEn: ahora
    };

    if (idx >= 0) {
      lista[idx] = nueva;
    } else {
      lista.push(nueva);
    }

    escribirJson("preferencias.json", lista);
    return this.obtenerPreferencias(usuarioId);
  }

  obtenerEstadisticas() {
    const actividades = leerJson<ActividadAlmacenada[]>("actividades.json", []);
    const usuarios = leerJson<any[]>("usuarios.json", []);
    const prefs = leerJson<PreferenciaAlmacenada[]>("preferencias.json", []);

    return {
      totalActividades: actividades.length,
      actividadesActivas: actividades.filter((a) => a.activo !== false).length,
      totalUsuarios: usuarios.length,
      totalPreferencias: prefs.length,
      fecha: new Date().toISOString()
    };
  }
}

export const localDataRepo = new LocalDataRepository();
