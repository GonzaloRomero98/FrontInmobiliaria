import { api } from "@/lib/api";
import { Ciudad, Region } from "@/types/ubicacion";

export async function gerRegiones():Promise<Region[]> {
    const {data}  = await  api.get('/ubicacion/regiones');
    return data;
}

// Calle y número del punto del mapa; null si ahí no hay una calle registrada en OpenStreetMap.
export async function getDireccion(latitud:number, longitud:number):Promise<string | null> {
    const {data} = await api.get<{direccion:string | null}>('/ubicacion/direccion',{params:{latitud, longitud}});
    return data.direccion;
}

export async function getCiudades(id_region?:number):Promise<Ciudad[]> {
    const {data} = await api.get('/ubicacion/ciudades',{params:{id_region}})
    return data;
}