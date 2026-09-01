import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
/**
 * Genera un hash seguro de la contraseña con scrypt (derivación de clave
 * de la librería estándar de Node). Formato almacenado: "sal:hash".
 */
export function hashContrasena(contrasena) {
    const sal = randomBytes(16).toString("hex");
    const hash = scryptSync(contrasena, sal, 64).toString("hex");
    return `${sal}:${hash}`;
}
export function verificarContrasena(contrasena, almacenada) {
    const partes = almacenada.split(":");
    if (partes.length !== 2) {
        return false;
    }
    const [sal, hash] = partes;
    const intento = scryptSync(contrasena, sal, 64);
    const original = Buffer.from(hash, "hex");
    return intento.length === original.length && timingSafeEqual(intento, original);
}
export function generarToken() {
    return randomBytes(32).toString("hex");
}
