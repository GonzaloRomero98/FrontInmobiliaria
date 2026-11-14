import { api } from "@/lib/api";
import { ModeloCasa } from "@/types/modeloCasa";
import { CotizacionEmitida, CrearSolicitudInput, CrearSolicitudPanelInput, EstadoVisita, NotaSolicitud, OrigenSolicitud } from "@/types/solicitud";
import { Reserva } from "@/types/reserva";

export interface Solicitud{
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    celular: string;
    mensaje: string | null;
    contactado: boolean;
    visitaPreferida: string | null;
    visitaEstado: EstadoVisita | null;
    origen: OrigenSolicitud;
    creadoEn: string;
    modeloCasa: ModeloCasa;
    reservas: Reserva[];
}

export async function crearSolicitud(dataForm: CrearSolicitudInput) {
    const {data: response} = await api.post('/solicitudes',dataForm);
    return response;
}

export type FiltroSolicitud = 'pendientes' | 'contactados' | 'visita' | 'todas';

export interface PaginaSolicitudes {
    solicitudes: Solicitud[];
    total: number;
    pendientes: number;
    pagina: number;
    limite: number;
}

export async function getSolicitudes(pagina:number, limite:number, filtro:FiltroSolicitud, buscar = ''):Promise<PaginaSolicitudes> {
    const {data} = await api.get('/solicitudes', {params:{pagina, limite, filtro, ...(buscar && {buscar})}});
    return data;
}

// Avisa al menú del panel que actualice el contador de pendientes.
export const EVENTO_SOLICITUDES_ACTUALIZADAS = 'solicitudes-actualizadas';

// Solo trae el número de pendientes, por eso no se audita.
export async function getResumenSolicitudes(): Promise<{pendientes:number}> {
    const {data} = await api.get('/solicitudes/resumen');
    return data;
}

export type FichaSolicitud = Solicitud & { notas: NotaSolicitud[]; cotizaciones: CotizacionEmitida[] };

export async function getSolicitud(id: string): Promise<FichaSolicitud> {
    const {data} = await api.get(`/solicitudes/${id}`);
    return data;
}

export async function descargarSolicitudesCsv(): Promise<void> {
    const {data} = await api.get('/solicitudes/exportar', {responseType: 'blob'});
    const url = URL.createObjectURL(data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
}

export async function crearSolicitudPanel(datos: CrearSolicitudPanelInput): Promise<Solicitud> {
    const {data} = await api.post('/solicitudes/panel', datos);
    return data;
}

export async function agregarNota(id: string, texto: string): Promise<void> {
    await api.post(`/solicitudes/${id}/notas`, {texto});
}

export async function actualizarVisita(id: string, cambios: {fecha?: string; estado?: EstadoVisita}): Promise<void> {
    await api.patch(`/solicitudes/${id}/visita`, cambios);
}

export type CondicionesCotizacion = Pick<CotizacionEmitida['datos'], 'pie' | 'tasa' | 'plazo' | 'validez' | 'nota' | 'uf'>;

export async function emitirCotizacion(id: string, condiciones: CondicionesCotizacion): Promise<CotizacionEmitida> {
    const {data} = await api.post(`/solicitudes/${id}/cotizaciones`, condiciones);
    return data;
}

export type DatosContacto = Pick<Solicitud, 'nombre' | 'apellido' | 'correo' | 'celular'>;

// Derecho de rectificación: la API deja una nota con los campos corregidos.
export async function corregirDatosSolicitud(id: string, datos: Partial<DatosContacto>): Promise<void> {
    await api.patch(`/solicitudes/${id}`, datos);
}

// Derecho de supresión: borra todas las solicitudes de ese correo. Solo ADMIN.
export async function eliminarDatosPersona(correo: string): Promise<number> {
    const {data} = await api.delete('/solicitudes', {params: {correo}});
    return data.eliminadas;
}

export async function marcarContactado(id:string) :Promise<Solicitud>{
    const {data} = await api.patch(`/solicitudes/${id}/contactado`);
    return data;
    
}