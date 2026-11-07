import { api } from "@/lib/api";
import { ModeloCasa } from "@/types/modeloCasa";
import { CrearSolicitudInput } from "@/types/solicitud";

export interface Solicitud{
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    celular: string;
    mensaje: string | null;
    contactado: boolean;
    visitaPreferida: string | null;
    creadoEn: string;
    modeloCasa: ModeloCasa;
}

export async function crearSolicitud(dataForm: CrearSolicitudInput) {
    const {data: response} = await api.post('/solicitudes',dataForm);
    return response;
}

export async function getSolicitudes():Promise<Solicitud[]> {
    const {data} = await api.get('/solicitudes');
    return data;
}

export async function getSolicitud(id: string): Promise<Solicitud> {
    const {data} = await api.get(`/solicitudes/${id}`);
    return data;
}

// El backend arma el CSV (y audita la descarga); aquí solo se guarda el archivo
export async function descargarSolicitudesCsv(): Promise<void> {
    const {data} = await api.get('/solicitudes/exportar', {responseType: 'blob'});
    const url = URL.createObjectURL(data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
}

export async function marcarContactado(id:string) :Promise<Solicitud>{
    const {data} = await api.patch(`/solicitudes/${id}/contactado`);
    return data;
    
}