import { api } from "@/lib/api";

export type Rol = 'ADMIN'|'SECRETARIO';

export interface Usuario{
    id:string;
    correo:string;
    nombre:string;
    activo:boolean;
    creadoEn:string;
    rol:{id:number; nombre:Rol};
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

export async function cambiarMiContrasena(actual:string, nueva:string):Promise<void>{
    await api.patch('/usuarios/me/contrasena', {actual, nueva});
}
