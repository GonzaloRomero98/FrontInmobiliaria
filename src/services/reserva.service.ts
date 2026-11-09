import { api } from "@/lib/api";
import { Reserva } from "@/types/reserva";

export async function crearReserva(input: { id_solicitud: string; rut: string; lote?: string }): Promise<Reserva> {
    const { data } = await api.post('/reservas', input);
    return data;
}

export async function cambiarEstadoReserva(id: string, estado: 'VENDIDA' | 'ANULADA'): Promise<Reserva> {
    const { data } = await api.patch(`/reservas/${id}/estado`, { estado });
    return data;
}
