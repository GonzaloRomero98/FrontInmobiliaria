import { api } from "@/lib/api";

export interface Metricas{
    solicitudes:{total:number; pendientes:number; ultimos30Dias:number};
    // unidades, disponibles, reservados y vendidos cuentan casas de modelos publicados
    modelos:{publicados:number; borradores:number; unidades:number; disponibles:number; reservados:number; vendidos:number};
    proyectosActivos:number;
    masSolicitados:{id:string; nombreModelo:string; solicitudes:number}[];
}

export async function getMetricas():Promise<Metricas>{
    const {data} = await api.get('/metricas');
    return data;
}
