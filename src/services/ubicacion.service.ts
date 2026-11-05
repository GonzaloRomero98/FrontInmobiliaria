import { api } from "@/lib/api";
import { Ciudad, Region } from "@/types/ubicacion";

export async function gerRegiones():Promise<Region[]> {
    const {data}  = await  api.get('/ubicacion/regiones');
    return data;
}

export async function getCiudades(id_region?:number):Promise<Ciudad[]> {
    const {data} = await api.get('/ubicacion/ciudades',{params:{id_region}})
    return data;
}