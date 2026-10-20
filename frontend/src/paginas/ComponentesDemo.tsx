import React, { useState } from "react";
import {
  Boton,
  Campo,
  Badge,
  Tarjeta,
  BarraConfirmacion,
  Esqueleto,
  EstadoVacio,
  EstadoError
} from "../componentes/base";
import CategoriaChip from "../componentes/CategoriaChip";
import PinCategoria from "../componentes/PinCategoria";
import { Plus, Trash2, Search, Sparkles } from "lucide-react";
import type { Categoria } from "../tipos";

const CATEGORIAS_MUESTRA: Categoria[] = [
  { id: "1", nombre: "Ferias y Mercados", slug: "ferias", color: "#F98017", icono: "feria" },
  { id: "2", nombre: "Cine y Teatro", slug: "cine-teatro", color: "#E53935", icono: "cine" },
  { id: "3", nombre: "Museos y Cultura", slug: "museos", color: "#8E24AA", icono: "museo" },
  { id: "4", nombre: "Música y Espectáculos", slug: "musica", color: "#1E88E5", icono: "teatro" },
  { id: "5", nombre: "Gastronomía", slug: "gastronomia", color: "#D81B60", icono: "bar" },
  { id: "6", nombre: "Naturaleza y Parques", slug: "naturaleza", color: "#2E7D32", icono: "parque" }
];

export default function ComponentesDemo(): React.JSX.Element {
  const [seleccionadas, setSeleccionadas] = useState<string[]>(["1"]);
  const [mostrarBarra, setMostrarBarra] = useState(true);

  const alternar = (cat: { id?: string }) => {
    if (!cat.id) return;
    setSeleccionadas((prev) =>
      prev.includes(cat.id!) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id!]
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Encabezado */}
        <header className="bg-brand-white rounded-3xl p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/15 text-brand-ink text-xs font-sans font-bold mb-3">
            <Sparkles size={14} className="text-brand-orange" aria-hidden="true" />
            Fase 1 · Primitivas Base Croquis
          </div>
          <h1 className="font-display text-3xl md:text-5xl text-brand-ink">
            Catálogo de Componentes
          </h1>
          <p className="font-body text-base md:text-lg text-brand-muted mt-2">
            Base visual y geométrica de Conectando Cultura: botones píldora, tarjetas 24px con elevación, tipografía editorial y paleta Comuna 9.
          </p>
        </header>

        {/* Botones */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Botones</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Boton variante="principal">Principal</Boton>
            <Boton variante="principal" icono={<Plus size={18} />}>
              Con ícono
            </Boton>
            <Boton variante="secundario">Secundario</Boton>
            <Boton variante="peligro" icono={<Trash2 size={18} />}>
              Peligro
            </Boton>
            <Boton variante="texto">Enlace texto</Boton>
            <Boton variante="principal" disabled>
              Deshabilitado
            </Boton>
          </div>
        </section>

        {/* Campos */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Campos de Formulario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Campo
              etiqueta="Nombre de la actividad"
              placeholder="Ej. Feria de Mataderos"
              required
            />
            <Campo
              etiqueta="Correo electrónico"
              placeholder="nombre@ejemplo.com"
              ayuda="Nunca compartiremos tu correo."
            />
            <Campo
              etiqueta="Dirección"
              defaultValue="Dirección incorrecta"
              error="La dirección no existe en CABA."
            />
            <Campo
              etiqueta="Descripción completa"
              multilinea
              placeholder="Escribí sobre la actividad cultural..."
            />
          </div>
        </section>

        {/* Badges */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Badges de Estado</h2>
          <div className="flex flex-wrap gap-4">
            <Badge tipo="activa" />
            <Badge tipo="inactiva" />
            <Badge tipo="oculta" />
            <Badge tipo="destacada" />
          </div>
        </section>

        {/* Chips y Pines de Categoría */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Chips y Pines de Categoría</h2>
          <div className="flex flex-wrap gap-3 items-center mb-6">
            {CATEGORIAS_MUESTRA.map((cat) => (
              <CategoriaChip
                key={cat.id}
                categoria={cat}
                seleccionada={seleccionadas.includes(cat.id)}
                onAlternar={() => alternar(cat)}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {CATEGORIAS_MUESTRA.map((cat, idx) => (
              <PinCategoria
                key={cat.id}
                categoria={cat}
                seleccionado={idx === 0}
              />
            ))}
          </div>
        </section>

        {/* Tarjetas */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Tarjetas Base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Tarjeta>
              <h3 className="font-sans font-bold text-lg text-brand-ink mb-2">Tarjeta Estándar</h3>
              <p className="font-body text-brand-muted text-sm leading-relaxed">
                Superficie con 24px de radio de borde y sombra Croquis nivel 2.
              </p>
            </Tarjeta>
            <Tarjeta interactiva>
              <h3 className="font-sans font-bold text-lg text-brand-ink mb-2">Tarjeta Interactiva</h3>
              <p className="font-body text-brand-muted text-sm leading-relaxed">
                Elevación y realce de borde al pasar el cursor para selección o navegación.
              </p>
            </Tarjeta>
          </div>
        </section>

        {/* Barra de confirmación */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Barra de Confirmación</h2>
          {mostrarBarra ? (
            <BarraConfirmacion
              mensaje="¿Desactivar esta actividad? Dejará de ser visible para los vecinos."
              textoConfirmar="Desactivar"
              esPeligro
              onConfirmar={() => setMostrarBarra(false)}
              onCancelar={() => setMostrarBarra(false)}
            />
          ) : (
            <Boton variante="secundario" onClick={() => setMostrarBarra(true)}>
              Volver a mostrar barra
            </Boton>
          )}
        </section>

        {/* Esqueletos */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Esqueletos de Carga</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Esqueleto circular ancho={48} alto={48} />
              <div className="flex-1 space-y-2">
                <Esqueleto alto={18} ancho="65%" />
                <Esqueleto alto={14} ancho="40%" />
              </div>
            </div>
            <Esqueleto alto={90} />
          </div>
        </section>

        {/* Estados vacío y error */}
        <section className="bg-brand-white rounded-3xl p-6 md:p-8 border border-brand-gray-light shadow-[0_6px_11px_rgba(0,0,0,0.1)]">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Estados Vacío y de Error</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EstadoVacio
              titulo="No hay actividades"
              descripcion="Probá con otros filtros o barrios para ver más opciones culturales."
              textoBoton="Ver todos los barrios"
              onAccion={() => alert("Acción de limpiar filtros")}
              icono={<Search size={36} />}
            />
            <EstadoError
              titulo="No pudimos cargar"
              descripcion="Hubo un problema de conexión. Intentá nuevamente."
              onReintentar={() => alert("Reintentando carga...")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
