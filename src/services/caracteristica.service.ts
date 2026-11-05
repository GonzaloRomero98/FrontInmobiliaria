import { api } from "@/lib/api";
import { Caracteristica } from "@/types/caracteristicas";

export async function getCaracteristicas():Promise<Caracteristica[]> {
    const {data } = await api.get('/caracteristicas')
    return data;
}

export async function crearCaracteristica(nombre:string):Promise<Caracteristica> {
    const {data} = await api.post('/caracteristicas', {nombre});
    return data;
}
