import { Ciudad } from "./ubicacion";

export interface Proyecto{
    id:string;
    nombre:string;
    descripcion: string;
    imagenPortada: string;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
    activo:boolean;
    creadoEn:string;
    ciudad:Ciudad;
}

export interface CrearPoyectoInput{
    nombre:string;
    id_ciudad:number
    descripcion?: string;
    imagenPortada?: string;
    direccion?: string;
    latitud?: number;
    longitud?: number;
}

export type ActualizarProyectoInput = Partial<CrearPoyectoInput>;
