import { Ciudad } from "./ubicacion";

export type EtapaProyecto = 'EN_VERDE' | 'EN_BLANCO' | 'ENTREGA_INMEDIATA';

export const ETIQUETA_ETAPA: Record<EtapaProyecto, string> = {
    EN_VERDE: 'En verde',
    EN_BLANCO: 'En blanco',
    ENTREGA_INMEDIATA: 'Entrega inmediata',
};

// "2027-06-30" -> "junio de 2027" (sin pasar por UTC, que correría el día)
export function formatearMesEntrega(fecha: string): string {
    const [anio, mes] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

export interface Proyecto{
    id:string;
    nombre:string;
    descripcion: string;
    imagenPortada: string;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
    etapa: EtapaProyecto | null;
    // 'YYYY-MM-DD'
    fechaEntrega: string | null;
    // Sala de ventas (opcional)
    salaDireccion: string | null;
    salaHorario: string | null;
    salaTelefono: string | null;
    salaLatitud: number | null;
    salaLongitud: number | null;
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
    etapa?: EtapaProyecto | null;
    fechaEntrega?: string | null;
    salaDireccion?: string | null;
    salaHorario?: string | null;
    salaTelefono?: string | null;
    salaLatitud?: number | null;
    salaLongitud?: number | null;
}

// Enlace "Cómo llegar" de Google Maps (solo URL, sin API ni clave): usa las coordenadas si las hay
export function urlComoLlegar(p: Pick<Proyecto, 'salaDireccion' | 'salaLatitud' | 'salaLongitud'>): string {
    const destino = p.salaLatitud !== null && p.salaLongitud !== null ? `${p.salaLatitud},${p.salaLongitud}` : p.salaDireccion ?? '';
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`;
}

export type ActualizarProyectoInput = Partial<CrearPoyectoInput>;
