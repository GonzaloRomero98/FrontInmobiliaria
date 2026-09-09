export enum TipoPorpiedad {
    CASA = 'CASA',
    DEPARTAMENTO = 'DEPARTAMENTO',
}

export enum EstadoPropiedad {
    VENTA = 'VENTA',
    ARRIENDO = 'ARRIENDO'
}
export interface Propiedad {
    id: string;
    titulo: string;
    descipcion: string;
    tipoPorpiedad: TipoPorpiedad;
    estadoPropiedad: EstadoPropiedad;
    precio: number;
    gastosComunes?: number;
    comuna: string;
    ciudad: string;
    direccion: string;
    banos: number;
    dormitorios: number;
    estacionamientos?: number;
    mascotas: boolean;
    totalMetrosCuadrados: number;
    metrosCuadradoscontruidos: number;
    anoConstruccion?: number,
    piso: number;
    comodidades?: string[];
    modelo3dUrl: string;
    portadaimgUrl: string;
    disponible: boolean;
    creadoEn: string;
}