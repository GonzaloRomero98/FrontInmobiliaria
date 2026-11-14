import { api } from "@/lib/api";

export interface RegistroAuditoria{
    id:string;
    fecha:string;
    accion:string;
    descripcion:string | null;
    metodo:string | null;
    ruta:string | null;
    estado:number | null;
    exito:boolean;
    idUsuario:string | null;
    correo:string | null;
    rol:string | null;
    ip:string | null;
    detalle:Record<string, unknown> | null;
    secuencia:string;
}

export const MODULOS_AUDITORIA = [
    { valor: 'sesion', etiqueta: 'Inicio de sesión' },
    { valor: 'proyectos', etiqueta: 'Proyectos' },
    { valor: 'modelos', etiqueta: 'Modelos y características' },
    { valor: 'solicitudes', etiqueta: 'Solicitudes' },
    { valor: 'reservas', etiqueta: 'Reservas' },
    { valor: 'usuarios', etiqueta: 'Usuarios' },
    { valor: 'archivos', etiqueta: 'Subida de archivos' },
] as const;

export interface FiltrosAuditoria{
    correo?:string;
    modulo?:string;
    soloRechazados?:boolean;
    desde?:string;
    hasta?:string;
}

export type ProblemaCadena = 'sin_encadenar' | 'alterado' | 'faltan_anteriores' | 'enlace_roto';

export interface VerificacionAuditoria{
    integra:boolean;
    total:number;
    ultimo:{secuencia:string; hash:string} | null;
    problemas:{secuencia:string | null; problema:ProblemaCadena}[];
    verificadoEn:string;
}

export async function getAuditoria(pagina:number, filtros:FiltrosAuditoria = {}, limite = 50):Promise<{registros:RegistroAuditoria[]; total:number}>{
    const {data} = await api.get('/auditoria', {params:{pagina, limite, ...filtros}});
    return data;
}

export async function verificarAuditoria():Promise<VerificacionAuditoria>{
    const {data} = await api.get('/auditoria/verificar');
    return data;
}
