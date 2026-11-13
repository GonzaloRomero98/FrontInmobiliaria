import { api } from "@/lib/api";

interface loginData{
    correo:string;
    contrasena:string;
}

// El token no viene en el cuerpo: la API lo deja en una cookie HttpOnly
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

// Borra la cookie HttpOnly del token (el navegador no puede hacerlo desde JavaScript)
export async function logout():Promise<void>{
    await api.post('/auth/logout');
}