import type { Moneda } from "./modeloCasa";
import { TONO } from "@/lib/estilos";

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
    POR_CONFIRMAR: TONO.aviso, CONFIRMADA: TONO.exito, ASISTIO: TONO.neutro, NO_ASISTIO: TONO.peligro,
};
// Una visita que ya pasó sin marcar asistencia sigue "abierta" y hay que cerrarla.
export const visitaAbierta = (estado: EstadoVisita | null) => estado === 'POR_CONFIRMAR' || estado === 'CONFIRMADA';
// La píldora de estado vive en lib/estilos para que todo el panel use la misma.
export { PILDORA } from "@/lib/estilos";

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
