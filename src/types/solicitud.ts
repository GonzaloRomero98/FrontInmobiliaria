import type { Moneda } from "./modeloCasa";

export interface CrearSolicitudInput{
    nombre:string;
    apellido:string;
    correo:string;
    celular:string;
    mensaje?:string;
    id_modelo_casa:string;
    visitaPreferida?:string;
    aceptaPrivacidad:boolean;
}
export type OrigenSolicitud = 'WEB' | 'SALA_VENTAS' | 'TELEFONO' | 'WHATSAPP';
// Última vista de la bandeja, para volver a ella desde la ficha.
export const CLAVE_ULTIMA_BANDEJA = 'inmocap:ultima-bandeja';

export const ETIQUETA_ORIGEN: Record<OrigenSolicitud, string> = {
    WEB: 'Web', SALA_VENTAS: 'Sala de ventas', TELEFONO: 'Teléfono', WHATSAPP: 'WhatsApp',
};

export type EstadoVisita = 'POR_CONFIRMAR' | 'CONFIRMADA' | 'ASISTIO' | 'NO_ASISTIO';
export const ETIQUETA_VISITA: Record<EstadoVisita, string> = {
    POR_CONFIRMAR: 'Por confirmar', CONFIRMADA: 'Confirmada', ASISTIO: 'Asistió', NO_ASISTIO: 'No asistió',
};
export const COLOR_VISITA: Record<EstadoVisita, string> = {
    POR_CONFIRMAR: 'bg-amber-50 text-amber-800', CONFIRMADA: 'bg-green-50 text-green-700',
    ASISTIO: 'bg-gray-100 text-gray-700', NO_ASISTIO: 'bg-red-50 text-red-700',
};
// Una visita que ya pasó sin marcar asistencia sigue "abierta" y hay que cerrarla.
export const visitaAbierta = (estado: EstadoVisita | null) => estado === 'POR_CONFIRMAR' || estado === 'CONFIRMADA';
export const PILDORA = 'inline-flex items-center gap-1 w-fit text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap';

export type CrearSolicitudPanelInput = Omit<CrearSolicitudInput, 'aceptaPrivacidad'> & {
    origen: Exclude<OrigenSolicitud, 'WEB'>;
    clienteInformado: boolean;
};

export interface NotaSolicitud {
    id: string;
    texto: string;
    creadoEn: string;
    usuario: { id: string; nombre: string } | null;
}

// Valores guardados al emitir la cotización.
export interface DatosCotizacion {
    nombreModelo: string;
    precio: number;
    moneda: Moneda;
    tipoOperacion: string;
    uf: { valor: number; fecha: string } | null;
    pie: number;
    tasa: number;
    plazo: number;
    validez: number;
    nota: string;
}

export interface CotizacionEmitida {
    id: string;
    folio: number;
    datos: DatosCotizacion;
    creadoEn: string;
    usuario?: { id: string; nombre: string } | null;
}

export const folioCotizacion = (folio: number) => `COT-${String(folio).padStart(6, '0')}`;
