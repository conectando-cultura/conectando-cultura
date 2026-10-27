import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface OpcionSelector {
  valor: string;
  etiqueta: string;
  descripcion?: string;
}

export type VarianteSelector = "barra" | "campo" | "compacto";

export interface SelectorProps {
  id?: string;
  nombre?: string;
  valor: string;
  opciones: OpcionSelector[];
  onChange: (nuevoValor: string) => void;
  placeholder?: string;
  etiqueta?: string;
  ariaLabel?: string;
  variante?: VarianteSelector;
  icono?: React.ReactNode;
  error?: string | null;
  requerido?: boolean;
  deshabilitado?: boolean;
  className?: string;
  alinearMenu?: "izquierda" | "derecha";
}

interface PosicionFlotante {
  top: number;
  left: number;
  width: number;
  abrirHaciaArriba: boolean;
}

export default function Selector({
  id,
  nombre,
  valor,
  opciones,
  onChange,
  placeholder = "Seleccionar...",
  etiqueta,
  ariaLabel,
  variante = "campo",
  icono,
  error,
  requerido = false,
  deshabilitado = false,
  className = "",
  alinearMenu = "izquierda"
}: SelectorProps): React.JSX.Element {
  const idGenerado = useId();
  const selectorId = id ?? idGenerado;
  const listboxId = `${selectorId}-listbox`;
  const errorId = `${selectorId}-error`;

  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState<number>(-1);
  const [posicion, setPosicion] = useState<PosicionFlotante | null>(null);

  const botonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const opcionesRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const opcionSeleccionada = opciones.find((op) => op.valor === valor);
  const textoMostrado = opcionSeleccionada ? opcionSeleccionada.etiqueta : placeholder;

  const calcularPosicion = useCallback(() => {
    const trigger = botonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const alturaEstimadaMenu = Math.min(opciones.length * 40 + 16, 268);
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abrirHaciaArriba = espacioAbajo < alturaEstimadaMenu && rect.top > alturaEstimadaMenu;

    const anchoMinimo = variante === "compacto" ? Math.max(rect.width, 176) : Math.max(rect.width, 210);
    let left = alinearMenu === "derecha" ? rect.right - anchoMinimo : rect.left;

    // Mantener dentro del viewport horizontal
    if (left + anchoMinimo > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - anchoMinimo - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setPosicion({
      top: abrirHaciaArriba ? rect.top - 6 : rect.bottom + 6,
      left,
      width: anchoMinimo,
      abrirHaciaArriba
    });
  }, [opciones.length, variante, alinearMenu]);

  const abrirMenu = useCallback(() => {
    if (deshabilitado) return;
    calcularPosicion();
    const idxActual = opciones.findIndex((op) => op.valor === valor);
    setIndiceActivo(idxActual >= 0 ? idxActual : 0);
    setAbierto(true);
  }, [deshabilitado, calcularPosicion, opciones, valor]);

  const cerrarMenu = useCallback(() => {
    setAbierto(false);
  }, []);

  const seleccionarOpcion = useCallback(
    (nuevoValor: string) => {
      onChange(nuevoValor);
      setAbierto(false);
      botonRef.current?.focus();
    },
    [onChange]
  );

  // Cerrar al hacer click fuera o al hacer scroll/resize
  useEffect(() => {
    if (!abierto) return;

    const manejarPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        botonRef.current &&
        !botonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        cerrarMenu();
      }
    };

    const manejarReposicion = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      calcularPosicion();
    };

    document.addEventListener("mousedown", manejarPointerDown);
    window.addEventListener("resize", manejarReposicion);
    window.addEventListener("scroll", manejarReposicion, true);

    return () => {
      document.removeEventListener("mousedown", manejarPointerDown);
      window.removeEventListener("resize", manejarReposicion);
      window.removeEventListener("scroll", manejarReposicion, true);
    };
  }, [abierto, cerrarMenu, calcularPosicion]);

  // Asegurar que la opción activa sea visible en scroll
  useEffect(() => {
    if (!abierto || indiceActivo < 0) return;
    const nodo = opcionesRefs.current[indiceActivo];
    if (nodo) {
      nodo.scrollIntoView({ block: "nearest" });
    }
  }, [abierto, indiceActivo]);

  const manejarKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (deshabilitado) return;

    if (!abierto) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirMenu();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        cerrarMenu();
        botonRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setIndiceActivo((prev) => (prev + 1) % Math.max(opciones.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndiceActivo((prev) => (prev - 1 + Math.max(opciones.length, 1)) % Math.max(opciones.length, 1));
        break;
      case "Home":
        e.preventDefault();
        setIndiceActivo(0);
        break;
      case "End":
        e.preventDefault();
        setIndiceActivo(Math.max(opciones.length - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (indiceActivo >= 0 && indiceActivo < opciones.length) {
          seleccionarOpcion(opciones[indiceActivo].valor);
        }
        break;
      case "Tab":
        cerrarMenu();
        break;
    }
  };

  // Clases del botón disparador según la variante Croquis
  const clasesBotonPorVariante: Record<VarianteSelector, string> = {
    barra:
      "w-full min-h-[40px] flex items-center justify-between gap-2 bg-transparent font-sans text-sm font-medium text-brand-ink outline-none cursor-pointer text-left",
    campo: `w-full min-h-[44px] px-4 py-2 rounded-full border bg-brand-white font-body text-sm text-brand-ink flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left ${
      error
        ? "border-red-500 focus:ring-2 focus:ring-red-400"
        : abierto
        ? "border-brand-orange ring-2 ring-brand-orange/25"
        : "border-brand-gray-light hover:border-brand-orange/70 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/25"
    }`,
    compacto: `inline-flex items-center justify-between gap-2 rounded-full border px-3.5 py-1.5 font-sans text-xs font-semibold text-brand-ink transition-all cursor-pointer text-left ${
      abierto
        ? "border-brand-orange bg-brand-white ring-2 ring-brand-orange/20 shadow-xs"
        : "border-brand-gray-light bg-brand-white hover:border-brand-orange shadow-2xs"
    }`
  };

  return (
    <div className={`relative ${variante === "compacto" ? "inline-block" : "w-full"} ${className}`}>
      {etiqueta && (
        <label
          htmlFor={selectorId}
          className="block font-sans text-xs font-bold uppercase tracking-wider text-brand-gray mb-1.5"
        >
          {etiqueta}
          {requerido && (
            <span className="text-red-600 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {nombre && <input type="hidden" name={nombre} value={valor} />}

      <button
        ref={botonRef}
        id={selectorId}
        type="button"
        disabled={deshabilitado}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listboxId : undefined}
        aria-label={ariaLabel ?? etiqueta}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onClick={() => (abierto ? cerrarMenu() : abrirMenu())}
        onKeyDown={manejarKeyDown}
        className={`${clasesBotonPorVariante[variante]} ${
          deshabilitado ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {icono && (
            <span className="text-brand-orange shrink-0 flex items-center" aria-hidden="true">
              {icono}
            </span>
          )}
          <span
            className={`truncate ${
              !opcionSeleccionada ? "text-brand-muted" : "text-brand-ink"
            }`}
          >
            {textoMostrado}
          </span>
        </span>

        <ChevronDown
          size={variante === "compacto" ? 14 : 16}
          strokeWidth={2.3}
          aria-hidden="true"
          className={`shrink-0 text-brand-orange transition-transform duration-150 ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {error && (
        <span id={errorId} className="block font-body text-xs text-red-600 mt-1" role="alert">
          {error}
        </span>
      )}

      {abierto &&
        posicion &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? etiqueta ?? placeholder}
            style={{
              position: "fixed",
              top: posicion.abrirHaciaArriba ? undefined : `${posicion.top}px`,
              bottom: posicion.abrirHaciaArriba
                ? `${window.innerHeight - posicion.top}px`
                : undefined,
              left: `${posicion.left}px`,
              minWidth: `${posicion.width}px`,
              maxWidth: "min(92vw, 340px)",
              zIndex: 9999
            }}
            className="rounded-2xl border border-brand-gray-light bg-brand-white p-1.5 shadow-[0_14px_30px_-4px_rgba(27,22,14,0.16),0_4px_12px_-2px_rgba(27,22,14,0.08)] font-body text-brand-ink"
          >
            <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
              {opciones.map((op, idx) => {
                const seleccionada = op.valor === valor;
                const activaTeclado = idx === indiceActivo;

                return (
                  <button
                    key={`${op.valor}-${idx}`}
                    ref={(el) => {
                      opcionesRefs.current[idx] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={seleccionada}
                    onMouseEnter={() => setIndiceActivo(idx)}
                    onClick={() => seleccionarOpcion(op.valor)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left font-sans text-xs md:text-[13px] transition-colors cursor-pointer ${
                      seleccionada
                        ? "bg-brand-orange/15 text-brand-ink font-semibold"
                        : activaTeclado
                        ? "bg-brand-bg text-brand-ink font-medium"
                        : "text-brand-gray font-medium hover:bg-brand-bg hover:text-brand-ink"
                    }`}
                  >
                    <span className="truncate">{op.etiqueta}</span>
                    {seleccionada && (
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        className="shrink-0 text-brand-orange"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
