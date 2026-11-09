export type EstadoReserva = 'RESERVADA' | 'VENDIDA' | 'ANULADA';

export interface Reserva {
    id: string;
    rut: string;
    lote: string | null;
    estado: EstadoReserva;
    creadoEn: string;
}
