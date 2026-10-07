// Deriva los tres colores de una categoría a partir de su hex de la base,
// garantizando texto con contraste >= 4,8:1 sobre el fondo suave.
const TINTA = "#1B2A4A";

const aRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
};

const aHex = (rgb: [number, number, number]): string =>
  "#" +
  rgb
    .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

const luminancia = (rgb: [number, number, number]): number => {
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb.map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contraste = (a: string, b: string): number => {
  const [x, y] = [luminancia(aRgb(a)), luminancia(aRgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const mezclar = (a: string, b: string, t: number): string => {
  const rb = aRgb(b);
  const mezclado = aRgb(a).map((v, i) => v * (1 - t) + rb[i] * t) as [number, number, number];
  return aHex(mezclado);
};

export function coloresCategoria(hex = "#5C6B7A"): { solido: string; fondo: string; texto: string } {
  const fondo = mezclar(hex, "#FFFFFF", 0.88);
  let texto = hex;
  let t = 0;
  while (contraste(texto, fondo) < 4.8 && t < 1) {
    t += 0.05;
    texto = mezclar(hex, TINTA, t);
  }
  return { solido: hex, fondo, texto };
}

// Color del ícono dentro del pin: blanco si llega a 3:1 sobre el sólido, si no tinta.
export const colorSimbolo = (hex: string): string =>
  contraste(hex, "#FFFFFF") >= 3 ? "#FFFFFF" : TINTA;
