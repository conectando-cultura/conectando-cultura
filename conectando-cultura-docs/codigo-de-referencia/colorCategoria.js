// Deriva los tres colores de una categoría a partir de su hex de la base,
// garantizando texto con contraste >= 4,8:1 sobre el fondo suave.
const TINTA = '#1B2A4A';

const aRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const aHex = (rgb) =>
  '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const luminancia = (rgb) => {
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = rgb.map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a, b) => {
  const [x, y] = [luminancia(aRgb(a)), luminancia(aRgb(b))].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
const mezclar = (a, b, t) => {
  const rb = aRgb(b);
  return aHex(aRgb(a).map((v, i) => v * (1 - t) + rb[i] * t));
};

export function coloresCategoria(hex = '#5C6B7A') {
  const fondo = mezclar(hex, '#FFFFFF', 0.88);
  let texto = hex;
  let t = 0;
  while (contraste(texto, fondo) < 4.8 && t < 1) {
    t += 0.05;
    texto = mezclar(hex, TINTA, t);
  }
  return { solido: hex, fondo, texto };
}

// Color del ícono dentro del pin: blanco si llega a 3:1 sobre el sólido, si no tinta.
export const colorSimbolo = (hex) => (contraste(hex, '#FFFFFF') >= 3 ? '#FFFFFF' : TINTA);
