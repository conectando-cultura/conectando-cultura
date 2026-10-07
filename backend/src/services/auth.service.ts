import { UsuarioRepository, SesionRepository } from "../repositories/usuario.repository.js";
import {
  aPublico,
  ErrorAplicacion,
  type DatosLogin,
  type DatosRegistro,
  type Rol,
  type Usuario,
  type UsuarioPublico
} from "../types.js";
import { hashContrasena, verificarContrasena } from "./password.js";

const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizar(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Servicio de autenticación: toda la lógica de negocio del módulo.
 * Las rutas y el middleware sólo traducen HTTP.
 *
 * Los repositorios son asíncronos (Supabase), por eso todos los métodos
 * públicos devuelven promesas.
 */
export class AuthService {
  private usuarios: UsuarioRepository;
  private sesiones: SesionRepository;

  constructor(usuarios: UsuarioRepository, sesiones: SesionRepository) {
    this.usuarios = usuarios;
    this.sesiones = sesiones;
  }

  async registrar(datos: DatosRegistro): Promise<UsuarioPublico> {
    const nombre = normalizar(datos.nombre);
    const apellido = normalizar(datos.apellido);
    const correo = normalizar(datos.correo).toLowerCase();
    const contrasena = typeof datos.contrasena === "string" ? datos.contrasena : "";
    const confirmacion = typeof datos.confirmacion === "string" ? datos.confirmacion : "";

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

    const existente = await this.usuarios.buscarPorCorreo(correo);
    if (existente) {
      throw new ErrorAplicacion("Ya existe una cuenta con ese correo electrónico.", 409);
    }

    const usuario = await this.usuarios.crear({
      nombre,
      apellido,
      correo,
      contrasenaHash: hashContrasena(contrasena)
    });

    return aPublico(usuario);
  }

  async iniciarSesion(datos: DatosLogin): Promise<{ token: string; usuario: UsuarioPublico }> {
    const correo = normalizar(datos.correo).toLowerCase();
    const contrasena = typeof datos.contrasena === "string" ? datos.contrasena : "";

    if (!correo || !contrasena) {
      throw new ErrorAplicacion("Completá tu correo y contraseña.");
    }

    const usuario = await this.usuarios.buscarPorCorreo(correo);
    // Mismo mensaje para usuario inexistente y contraseña incorrecta:
    // no revela qué correos están registrados.
    if (!usuario || !verificarContrasena(contrasena, usuario.contrasenaHash)) {
      throw new ErrorAplicacion("Correo o contraseña incorrectos.", 401);
    }

    const sesion = await this.sesiones.crear(usuario.id);
    return { token: sesion.token, usuario: aPublico(usuario) };
  }

  async obtenerUsuarioPorToken(token: string): Promise<UsuarioPublico | null> {
    const sesion = await this.sesiones.buscarActiva(token);
    if (!sesion) return null;

    const usuario = await this.usuarios.buscarPorId(sesion.usuarioId);
    return usuario ? aPublico(usuario) : null;
  }

  async cerrarSesion(token: string): Promise<void> {
    await this.sesiones.eliminar(token);
  }

  async listarUsuarios(): Promise<UsuarioPublico[]> {
    const usuarios = await this.usuarios.listarTodos();
    return usuarios.map((u) => aPublico(u));
  }

  async actualizarRol(id: string, rol: Rol): Promise<UsuarioPublico> {
    const actualizado = await this.usuarios.actualizarRol(id, rol);
    if (!actualizado) {
      throw new ErrorAplicacion("Usuario no encontrado.", 404);
    }
    return aPublico(actualizado);
  }

  async cerrarSesionesDeUsuario(usuarioId: string): Promise<void> {
    await this.sesiones.eliminarPorUsuario(usuarioId);
  }

  /** Verifica que un usuario exista (usado por el bootstrap del admin). */
  async existeUsuario(id: string): Promise<boolean> {
    const usuario: Usuario | null = await this.usuarios.buscarPorId(id);
    return usuario !== null;
  }
}
