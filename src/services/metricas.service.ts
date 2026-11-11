import { api } from "@/lib/api";

export interface VisitaProxima{
    id:string;
    nombre:string;
    apellido:string;
    visitaPreferida:string;
    modelo:string | null;
    proyecto:string | null;
}

export interface Metricas{
    // porSemana: las últimas 8 semanas (lunes 'AAAA-MM-DD'), la última es la actual
    solicitudes:{total:number; pendientes:number; ultimos30Dias:number; previos30Dias:number; porSemana:{semana:string; solicitudes:number}[]};
    // unidades, disponibles, reservados y vendidos cuentan casas de modelos publicados
    modelos:{publicados:number; borradores:number; unidades:number; disponibles:number; reservados:number; vendidos:number};
    proyectosActivos:number;
    reservas:{reservasMes:number; ventasMes:number};
    visitas:{proximos7Dias:number; proximas:VisitaProxima[]};
    masSolicitados:{id:string; nombreModelo:string; proyecto:string; solicitudes:number}[];
}

// Panel de la secretaria (GET /metricas/seguimiento): a quién contactar primero, agenda y reservas por cerrar
export interface Seguimiento{
    solicitudes:{
        pendientes:number; nuevasHoy:number; nuevasSemana:number;
        // Las 5 que más llevan esperando, la más antigua primero
        porContactar:{id:string; nombre:string; apellido:string; celular:string; creadoEn:string; visitaPreferida:string | null; modelo:string | null; proyecto:string | null}[];
    };
    visitas:{proximos7Dias:number; proximas:VisitaProxima[]};
    reservas:{
        enCurso:number; ventasMes:number;
        // Reservas RESERVADA más antiguas primero (las que llevan más tiempo sin cerrarse)
        porCerrar:{id:string; idSolicitud:string; nombre:string; apellido:string; lote:string | null; creadoEn:string; modelo:string | null; proyecto:string | null}[];
    };
}

export async function getSeguimiento():Promise<Seguimiento>{
    const {data} = await api.get('/metricas/seguimiento');
    return data;
}

export async function getMetricas():Promise<Metricas>{
    const {data} = await api.get('/metricas');
    return data;
}
