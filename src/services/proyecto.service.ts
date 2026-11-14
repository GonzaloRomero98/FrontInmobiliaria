import { api } from "@/lib/api";
import { ActualizarProyectoInput, CrearPoyectoInput, Proyecto } from "@/types/proyecto";
import { Normativa, NormativaInput } from "@/types/normativa";
import { EntornoProyecto } from "@/types/entorno";
import { isAxiosError } from "axios";

export async function getProyectos():Promise<Proyecto[]>{
    const {data} = await api.get('/proyectos');
    return data;
}

export async function getProyectoPorId(id:string):Promise<Proyecto> {
    const {data} = await api.get(`/proyectos/${id}`);
    return data;
    
}

export async function crearPoryecto(dataFor:CrearPoyectoInput):Promise<Proyecto> {
    const {data}  = await api.post('/proyectos', dataFor)
    return data
}

export async function actualizarProyecto(id:string, cambios:ActualizarProyectoInput):Promise<Proyecto> {
    const {data} = await api.patch(`/proyectos/${id}`, cambios);
    return data;
}

async function getOpcional<T>(url:string):Promise<T | null> {
    try {
        const {data} = await api.get(url);
        return data;
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
    }
}

export function getNormativa(id:string):Promise<Normativa | null> {
    return getOpcional(`/proyectos/${id}/normativa`);
}

export async function guardarNormativa(id:string, normativa:NormativaInput):Promise<Normativa> {
    const {data} = await api.put(`/proyectos/${id}/normativa`, normativa);
    return data;
}

export function getEntorno(id:string):Promise<EntornoProyecto | null> {
    return getOpcional(`/proyectos/${id}/entorno`);
}

export async function actualizarEntorno(id:string):Promise<EntornoProyecto> {
    const {data} = await api.post(`/proyectos/${id}/entorno`);
    return data;
}

export async function despublicarProyecto(id:string):Promise<void> {
    await api.delete(`/proyectos/${id}`);
}

export async function eliminarProyecto(id:string):Promise<void> {
    await api.delete(`/proyectos/${id}/definitivo`);
}

export async function publicarProyecto(id:string):Promise<void> {
    await api.patch(`/proyectos/${id}/publicar`);
}

export async function getProyectosAdmin():Promise<Proyecto[]>{
    const {data} = await api.get('/proyectos/admin');
    return data;
}
