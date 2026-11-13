import type { Moneda } from "./modeloCasa";

export interface CrearSolicitudInput{
    nombre:string;
    apellido:string;
    correo:string;
    celular:string;
    mensaje?:string;
    id_modelo_casa:string;
    // ISO 8601 (UTC)
    visitaPreferida?:string;
    aceptaPrivacidad:boolean;
}
export type OrigenSolicitud = 'WEB' | 'SALA_VENTAS' | 'TELEFONO' | 'WHATSAPP';
export const ETIQUETA_ORIGEN: Record<OrigenSolicitud, string> = {
    WEB: 'Web', SALA_VENTAS: 'Sala de ventas', TELEFONO: 'Teléfono', WHATSAPP: 'WhatsApp',
};

export type EstadoVisita = 'POR_CONFIRMAR' | 'CONFIRMADA' | 'ASISTIO' | 'NO_ASISTIO';
export const ETIQUETA_VISITA: Record<EstadoVisita, string> = {
    POR_CONFIRMAR: 'Por confirmar', CONFIRMADA: 'Confirmada', ASISTIO: 'Asistió', NO_ASISTIO: 'No asistió',
};

// Cliente registrado por la secretaria: en vez de aceptar la política, declara que se la informó
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

// Valores congelados al emitir (los pone el servidor salvo las condiciones)
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
