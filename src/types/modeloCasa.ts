import { Caracteristica } from "./caracteristicas";
import { Proyecto } from "./proyecto";

export type Moneda = 'UF'|'CLP'
export type Operacion = 'VENTA'|'ARRIENDO'
export type EstadoModelo = 'DISPONIBLE'|'RESERVADO'|'VENDIDO'

export const ETIQUETA_ESTADO: Record<EstadoModelo, string> = {
    DISPONIBLE: 'Disponible',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
};

export interface FotoGaleria{
    id:string;
    urlImagen:string;
    orden:number;
}

export interface ModeloCasa{
    id:string;
    nombreModelo:string;
    tipoOperacion:Operacion;
    dormitorios:number;
    banos:number;
    estacionamientos: number;
    mascotas:boolean;
    superficieConstruida:number;
    superficieTerreno:number;
    precio:number;
    moneda:Moneda;
    gastosComunes:boolean;
    modelo3dUrl:string | null;
    imgPrincipal: string;
    estado:EstadoModelo;
    // false = borrador (no se ve en el catálogo)
    activo:boolean;
    creadoEn:string;
    proyecto: Proyecto;
    caracteristicas:Caracteristica[];
    fotos:FotoGaleria[];
}

export interface ModeloCasaInput{
    id_proyecto:string;
    nombreModelo:string;
    tipoOperacion:Operacion;
    dormitorios:number;
    banos:number;
    estacionamiento:number;
    mascotas:boolean;
    superficieConstruida:number;
    superficieTerreno:number;
    precio:number;
    moneda:Moneda;
    gastosComunes:boolean;
    modelo3dUrl?:string | null;
    imgPrincipal: string;
    caracteristicasID:number[];
    estado?:EstadoModelo;
    activo?:boolean;
}
export type OrdenBusqueda = 'precio_asc' | 'precio_desc' | 'superficie_desc' | 'recientes';

// Parámetros de GET /modeloCasa (todos opcionales)
export interface FiltrosBusqueda{
    tipoOperacion?:Operacion;
    id_region?:string;
    id_ciudad?:string;
    moneda?:Moneda;
    precioMin?:string;
    precioMax?:string;
    dormitorios?:string;
    banos?:string;
    superficieMin?:string;
    mascotas?:'true';
    orden?:OrdenBusqueda;
}
