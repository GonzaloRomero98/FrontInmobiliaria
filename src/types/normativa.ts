export const RIESGOS = {
    INUNDACION: 'Inundación',
    REMOCION_EN_MASA: 'Remoción en masa (aluviones, deslizamientos)',
    TSUNAMI: 'Tsunami',
    INCENDIO_FORESTAL: 'Incendio forestal',
    VOLCANICO: 'Actividad volcánica',
    FALLA_GEOLOGICA: 'Falla geológica',
} as const;

export type Riesgo = keyof typeof RIESGOS;

export interface Normativa{
    id:string;
    instrumento:string;
    zona:string;
    usosPermitidos:string;
    alturaMaximaMetros:number | null;
    alturaMaximaPisos:number | null;
    densidadMaxima:number | null;
    coefConstructibilidad:number | null;
    coefOcupacionSuelo:number | null;
    riesgos:Riesgo[];
    urlOrdenanza:string | null;
    fechaConsulta:string;
    observaciones:string | null;
    actualizadoEn:string;
}

export type NormativaInput = Omit<Normativa, 'id' | 'actualizadoEn' | 'alturaMaximaMetros' | 'alturaMaximaPisos'
    | 'densidadMaxima' | 'coefConstructibilidad' | 'coefOcupacionSuelo' | 'urlOrdenanza' | 'observaciones'> & {
    alturaMaximaMetros?:number;
    alturaMaximaPisos?:number;
    densidadMaxima?:number;
    coefConstructibilidad?:number;
    coefOcupacionSuelo?:number;
    urlOrdenanza?:string;
    observaciones?:string;
};
