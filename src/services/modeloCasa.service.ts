import { api } from "@/lib/api"
import { ImagenDto } from "@/types/fotoModelo";
import { FiltrosBusqueda, ModeloCasa, ModeloCasaInput} from "@/types/modeloCasa"

export async function getModeloCasa(id_proyecto?:string): Promise<ModeloCasa[]> {
    const {data} = await api.get(`/modeloCasa`,{params:{id_proyecto}});
    return data;
}

export async function buscarModelos(filtros:FiltrosBusqueda): Promise<ModeloCasa[]> {
    const {data} = await api.get('/modeloCasa', {params:filtros});
    return data;
}

export async function getModeloCasaById(id:string):Promise<ModeloCasa> { 
    const {data} = await api.get(`/modeloCasa/${id}`);   
    return data;
}

// Panel admin: incluye borradores
export async function getModelosAdmin(): Promise<ModeloCasa[]> {
    const {data} = await api.get('/modeloCasa/admin');
    return data;
}

export async function getModeloAdminById(id:string): Promise<ModeloCasa> {
    const {data} = await api.get(`/modeloCasa/admin/${id}`);
    return data;
}

// Se consulta antes de subir archivos a S3; excluirId = el modelo que se está editando
export async function nombreModeloDisponible(nombre:string, excluirId?:string):Promise<boolean>{
    const {data} = await api.get('/modeloCasa/admin/nombre-disponible', {params:{nombre, excluirId}});
    return data.disponible;
}

// La copia queda como borrador; si el nombre ya existe el backend responde 409
export async function duplicarModeloCasa(id:string, nombreModelo:string):Promise<ModeloCasa>{
    const {data} = await api.post(`/modeloCasa/${id}/duplicar`, {nombreModelo});
    return data;
}

export async function crearModeloCasa(modeloCasa:ModeloCasaInput):Promise<ModeloCasa>{
    const {data} = await api.post('/modeloCasa', modeloCasa)
    return data;
}

export async function agregarFotoModelo(idModelo:string, fotoDto:ImagenDto ) {
    const {data} = await api.post(`/modeloCasa/${idModelo}/fotos`,fotoDto);
    return data;
}

export async function  eliminarFotoModelo(idModelo:string,foto_id:string ):Promise<void> {
    await api.delete(`/modeloCasa/${idModelo}/fotos/${foto_id}`);
}

// ids = todas las fotos del modelo en el nuevo orden
export async function ordenarFotosModelo(idModelo:string, ids:string[]):Promise<void> {
    await api.put(`/modeloCasa/${idModelo}/fotos/orden`, {ids});
}

export async function actualizarModeloCasa(id:string, cambios:Partial<ModeloCasaInput>):Promise<ModeloCasa>{
    const {data} = await api.patch(`/modeloCasa/${id}`, cambios);
    return data;
}