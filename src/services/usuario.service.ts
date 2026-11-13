import { api } from "@/lib/api";

export type Rol = 'ADMIN'|'SECRETARIO';

export interface Usuario{
    id:string;
    correo:string;
    nombre:string;
    activo:boolean;
    creadoEn:string;
    fotoUrl:string | null;
    rol:{id:number; nombre:Rol};
}

// Lo emite "Mi perfil" al guardar, para que el menú del encabezado muestre el nombre y la foto nuevos
export const EVENTO_PERFIL_ACTUALIZADO = 'perfil-actualizado';

export async function getMiPerfil():Promise<Usuario>{
    const {data} = await api.get('/usuarios/me');
    return data;
}

// fotoUrl null quita la foto
export async function actualizarMiPerfil(cambios:{nombre?:string; fotoUrl?:string | null}):Promise<Usuario>{
    const {data} = await api.patch('/usuarios/me', cambios);
    window.dispatchEvent(new Event(EVENTO_PERFIL_ACTUALIZADO));
    return data;
}

export async function getUsuarios():Promise<Usuario[]>{
    const {data} = await api.get('/usuarios');
    return data;
}

export async function crearUsuario(usuario:{correo:string; nombre:string; contrasena:string; rol:Rol}):Promise<Usuario>{
    const {data} = await api.post('/usuarios', usuario);
    return data;
}

// El ADMIN activa/desactiva una cuenta o le asigna una contraseña nueva
export async function actualizarUsuario(id:string, cambios:{activo?:boolean; contrasena?:string}):Promise<Usuario>{
    const {data} = await api.patch(`/usuarios/${id}`, cambios);
    return data;
}

// El cambio invalida todos los tokens anteriores (también los de otros dispositivos):
// la API pone el token nuevo en la cookie HttpOnly para que esta sesión siga abierta
export async function cambiarMiContrasena(actual:string, nueva:string):Promise<void>{
    await api.patch('/usuarios/me/contrasena', {actual, nueva});
}
