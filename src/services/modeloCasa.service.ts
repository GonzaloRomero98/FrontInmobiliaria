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

export async function getModelosAdmin(): Promise<ModeloCasa[]> {
    const {data} = await api.get('/modeloCasa/admin');
    return data;
}

export async function getModeloAdminById(id:string): Promise<ModeloCasa> {
    const {data} = await api.get(`/modeloCasa/admin/${id}`);
    return data;
}

export async function nombreModeloDisponible(nombre:string, excluirId?:string):Promise<boolean>{
    const {data} = await api.get('/modeloCasa/admin/nombre-disponible', {params:{nombre, excluirId}});
    return data.disponible;
}

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

export async function eliminarModeloCasa(id:string):Promise<void> {
    await api.delete(`/modeloCasa/${id}/definitivo`);
}

export async function  eliminarFotoModelo(idModelo:string,foto_id:string ):Promise<void> {
    await api.delete(`/modeloCasa/${idModelo}/fotos/${foto_id}`);
}

export async function ordenarFotosModelo(idModelo:string, ids:string[]):Promise<void> {
    await api.put(`/modeloCasa/${idModelo}/fotos/orden`, {ids});
}

export async function actualizarModeloCasa(id:string, cambios:Partial<ModeloCasaInput>):Promise<ModeloCasa>{
    const {data} = await api.patch(`/modeloCasa/${id}`, cambios);
    return data;
}