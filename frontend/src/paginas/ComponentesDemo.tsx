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
import { Plus, Trash2, Search } from "lucide-react";
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
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ marginBottom: "8px" }}>Catálogo de componentes base</h1>
      <p style={{ color: "var(--texto-suave)", marginBottom: "32px" }}>
        Fase 1 del sistema visual de Conectando Cultura.
      </p>

      {/* Botones */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Botones</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginTop: "16px" }}>
          <Boton variante="principal">Principal</Boton>
          <Boton variante="principal" icono={<Plus size={18} />}>Con ícono</Boton>
          <Boton variante="secundario">Secundario</Boton>
          <Boton variante="peligro" icono={<Trash2 size={18} />}>Peligro</Boton>
          <Boton variante="texto">Enlace texto</Boton>
          <Boton variante="principal" disabled>Deshabilitado</Boton>
        </div>
      </section>

      {/* Campos */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Campos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <Campo etiqueta="Nombre de la actividad" placeholder="Ej. Feria de Mataderos" required />
          <Campo etiqueta="Correo electrónico" placeholder="nombre@ejemplo.com" ayuda="Nunca compartiremos tu correo." />
          <Campo etiqueta="Dirección" value="Dirección incorrecta" error="La dirección no existe en CABA." />
          <Campo etiqueta="Descripción completa" multilinea placeholder="Escribí sobre la actividad..." />
        </div>
      </section>

      {/* Badges */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Badges de estado</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
          <Badge tipo="activa" />
          <Badge tipo="inactiva" />
          <Badge tipo="oculta" />
          <Badge tipo="destacada" />
        </div>
      </section>

      {/* Chips y Pines de Categoría */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Chips y pines de categoría</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px", alignItems: "center" }}>
          {CATEGORIAS_MUESTRA.map((cat) => (
            <CategoriaChip
              key={cat.id}
              categoria={cat}
              seleccionada={seleccionadas.includes(cat.id)}
              onAlternar={() => alternar(cat)}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "24px", alignItems: "center" }}>
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
      <section style={{ marginBottom: "40px" }}>
        <h2>Tarjetas</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <Tarjeta>
            <h3>Tarjeta normal</h3>
            <p style={{ color: "var(--texto-suave)", marginTop: "8px" }}>
              Fondo blanco, borde sutil de 1px sin sombras compitiendo con los colores de categoría.
            </p>
          </Tarjeta>
          <Tarjeta interactiva>
            <h3>Tarjeta interactiva</h3>
            <p style={{ color: "var(--texto-suave)", marginTop: "8px" }}>
              Borde reactivo al pasar el cursor para selección o navegación.
            </p>
          </Tarjeta>
        </div>
      </section>

      {/* Barra de confirmación */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Barra de confirmación</h2>
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
      <section style={{ marginBottom: "40px" }}>
        <h2>Esqueletos de carga</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Esqueleto circular ancho={44} alto={44} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <Esqueleto alto={16} ancho="60%" />
              <Esqueleto alto={12} ancho="40%" />
            </div>
          </div>
          <Esqueleto alto={80} />
        </div>
      </section>

      {/* Estados vacío y error */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Estados vacío y de error</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <EstadoVacio
            titulo="No hay actividades en este barrio"
            descripcion="Probá con todos los barrios para ver más opciones."
            textoBoton="Ver todos los barrios"
            onAccion={() => alert("Acción de limpiar filtros")}
            icono={<Search size={36} />}
          />
          <EstadoError
            titulo="No pudimos cargar las actividades"
            descripcion="Hubo un problema de conexión. Intentá nuevamente."
            onReintentar={() => alert("Reintentando carga...")}
          />
        </div>
      </section>
    </div>
  );
}
