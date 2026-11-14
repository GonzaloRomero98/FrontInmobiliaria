import { api } from "@/lib/api";

interface loginData{
    correo:string;
    contrasena:string;
}

interface loginResponse{
    usuario:{
        id:string;
        correo:string;
        rol:'ADMIN'|'SECRETARIO'
    };
}
export async function login(data:loginData):Promise<loginResponse> {
    const {data: response} = await api.post('/auth/login',data);
    return response
}

export async function logout():Promise<void>{
    await api.post('/auth/logout');
}