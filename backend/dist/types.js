/** Tipos compartidos del backend (módulo de autenticación). */
export function aPublico(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol ?? "usuario"
    };
}
export class ErrorAplicacion extends Error {
    status;
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.name = "ErrorAplicacion";
        this.status = status;
    }
}
