import { api } from "@/lib/api";
import { Propiedad } from "@/types/propiedad";

export async function getPropiedades():Promise<Propiedad[]>{
    const {data} = await api.get('/propiedad');
    return data
}

export async function getPropiedadPorId(id:string):Promise<Propiedad>{
    const {data} = await api.get(`/propiedad/${id}`);
    return data;
}