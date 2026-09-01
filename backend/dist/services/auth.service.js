import { aPublico, ErrorAplicacion } from "../types.js";
import { hashContrasena, verificarContrasena } from "./password.js";
const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function normalizar(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}
/**
 * Servicio de autenticación: contiene TODA la lógica de negocio del módulo
 * (alta cohesión). Las rutas y el middleware solo traducen HTTP, sin
 * repetir reglas de validación ni conocer el almacenamiento.
 */
export class AuthService {
    usuarios;
    sesiones;
    constructor(usuarios, sesiones) {
        this.usuarios = usuarios;
        this.sesiones = sesiones;
    }
    registrar(datos) {
        const nombre = normalizar(datos.nombre);
        const apellido = normalizar(datos.apellido);
        const correo = normalizar(datos.correo);
        const contrasena = datos.contrasena;
        const confirmacion = datos.confirmacion;
        if (!nombre || !apellido) {
            throw new ErrorAplicacion("Debés completar tu nombre y apellido.");
        }
        if (!correo) {
            throw new ErrorAplicacion("Debés ingresar tu correo electrónico.");
        }
        if (!EXPRESION_CORREO.test(correo)) {
            throw new ErrorAplicacion("El correo electrónico no es válido.");
        }
        if (!contrasena) {
            throw new ErrorAplicacion("Debés ingresar una contraseña.");
        }
        if (contrasena.length < 6) {
            throw new ErrorAplicacion("La contraseña debe tener al menos 6 caracteres.");
        }
        if (contrasena !== confirmacion) {
            throw new ErrorAplicacion("Las contraseñas no coinciden.");
        }
        if (this.usuarios.buscarPorCorreo(correo)) {
            throw new ErrorAplicacion("Ya existe una cuenta con ese correo electrónico.", 409);
        }
        const usuario = this.usuarios.crear({
            nombre,
            apellido,
            correo,
            contrasenaHash: hashContrasena(contrasena)
        });
        return aPublico(usuario);
    }
    iniciarSesion(datos) {
        const correo = normalizar(datos.correo);
        const contrasena = datos.contrasena;
        if (!correo || !contrasena) {
            throw new ErrorAplicacion("Completá tu correo y contraseña.");
        }
        const usuario = this.usuarios.buscarPorCorreo(correo);
        if (!usuario || !verificarContrasena(contrasena, usuario.contrasenaHash)) {
            throw new ErrorAplicacion("Correo o contraseña incorrectos.", 401);
        }
        const sesion = this.sesiones.crear(usuario.id);
        return { token: sesion.token, usuario: aPublico(usuario) };
    }
    obtenerUsuarioPorToken(token) {
        const sesion = this.sesiones.buscarActiva(token);
        if (!sesion) {
            return null;
        }
        const usuario = this.usuarios.buscarPorId(sesion.usuarioId);
        return usuario ? aPublico(usuario) : null;
    }
    cerrarSesion(token) {
        this.sesiones.eliminar(token);
    }
}
