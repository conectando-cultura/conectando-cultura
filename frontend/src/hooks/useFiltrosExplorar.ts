import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export interface FiltrosExplorar {
  q: string;
  barrio: string;
  categorias: string[];
  vista: "mapa" | "lista" | "ambas";
}

export function useFiltrosExplorar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros: FiltrosExplorar = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const barrio = searchParams.get("barrio") ?? "";
    const categoriasParam = searchParams.get("categorias") ?? "";
    const categorias = categoriasParam ? categoriasParam.split(",").filter(Boolean) : [];
    const vistaParam = searchParams.get("vista");
    const vista: "mapa" | "lista" | "ambas" =
      vistaParam === "mapa" || vistaParam === "lista" ? vistaParam : "ambas";

    return { q, barrio, categorias, vista };
  }, [searchParams]);

  const actualizarParams = useCallback(
    (nuevos: Partial<FiltrosExplorar>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);

          if ("q" in nuevos) {
            if (nuevos.q && nuevos.q.trim()) params.set("q", nuevos.q.trim());
            else params.delete("q");
          }

          if ("barrio" in nuevos) {
            if (nuevos.barrio) params.set("barrio", nuevos.barrio);
            else params.delete("barrio");
          }

          if ("categorias" in nuevos) {
            if (nuevos.categorias && nuevos.categorias.length > 0) {
              params.set("categorias", nuevos.categorias.join(","));
            } else {
              params.delete("categorias");
            }
          }

          if ("vista" in nuevos) {
            if (nuevos.vista && nuevos.vista !== "ambas") params.set("vista", nuevos.vista);
            else params.delete("vista");
          }

          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setQ = useCallback((q: string) => actualizarParams({ q }), [actualizarParams]);
  const setBarrio = useCallback((barrio: string) => actualizarParams({ barrio }), [actualizarParams]);

  const alternarCategoria = useCallback(
    (slug: string) => {
      const actuales = filtros.categorias;
      const nuevas = actuales.includes(slug)
        ? actuales.filter((c) => c !== slug)
        : [...actuales, slug];
      actualizarParams({ categorias: nuevas });
    },
    [filtros.categorias, actualizarParams]
  );

  const setCategorias = useCallback(
    (categorias: string[]) => actualizarParams({ categorias }),
    [actualizarParams]
  );

  const setVista = useCallback(
    (vista: "mapa" | "lista" | "ambas") => actualizarParams({ vista }),
    [actualizarParams]
  );

  const limpiarFiltros = useCallback(() => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams();
        const vista = prev.get("vista");
        if (vista) params.set("vista", vista);
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const tieneFiltrosActivos = useMemo(() => {
    return Boolean(filtros.q || filtros.barrio || filtros.categorias.length > 0);
  }, [filtros]);

  return {
    filtros,
    setQ,
    setBarrio,
    alternarCategoria,
    setCategorias,
    setVista,
    limpiarFiltros,
    tieneFiltrosActivos
  };
}
