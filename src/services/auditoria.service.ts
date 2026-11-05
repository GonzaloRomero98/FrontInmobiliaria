import { api } from "@/lib/api";

export interface RegistroAuditoria{
    id:string;
    fecha:string;
    accion:string;
    metodo:string | null;
    ruta:string | null;
    estado:number | null;
    exito:boolean;
    idUsuario:string | null;
    correo:string | null;
    rol:string | null;
    ip:string | null;
    detalle:Record<string, unknown> | null;
}

export async function getAuditoria(pagina:number, limite = 50):Promise<{registros:RegistroAuditoria[]; total:number}>{
    const {data} = await api.get('/auditoria', {params:{pagina, limite}});
    return data;
}
