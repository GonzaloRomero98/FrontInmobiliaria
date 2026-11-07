'use client'

import { login } from "@/services/auth.service";
import { OPCIONES_COOKIE_SESION } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod"
import Cookies from "js-cookie";
import { isAxiosError } from "axios";

const esquemaLogin = z.object({
    correo:z.string().email('Los datos no son validos'),
    contrasena: z.string().min(1,'Los datos no son validos')
});

type FormValues = z.infer<typeof esquemaLogin>;

export default function Login(){
    const router = useRouter();
    const [error, setError] = useState<string| null>(null)
    const {
        register, 
        handleSubmit,
         formState:{errors, isSubmitting},
         } = useForm<FormValues>({resolver:zodResolver(esquemaLogin)
         });

         async function onSubmit(data:FormValues) {
            setError(null);

            try{
                const respuesta = await login(data);

                Cookies.set('auth_token', respuesta.access_token, OPCIONES_COOKIE_SESION);
                Cookies.set('rol_usuario', respuesta.usuario.rol, OPCIONES_COOKIE_SESION);
                
                if(respuesta.usuario.rol === 'ADMIN'){
                    router.push('/admin');
                }else{
                    router.push('/secretario');
                }
            }catch(error){
                console.error('Error de login:', error);
                setError(isAxiosError(error) && error.response?.status === 429
                    ? 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.'
                    : 'Datos incorrectos')
            }
        }

        return (
            <main className="max-w-md mx-auto px-4 py-20">
                <h1 className="text-2xl font-bold mb-6">Iniciar sesion</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <input 
                        {...register('correo')}
                        placeholder="Correo electronico"
                        className="w-full border rounded-lg px-3 py-2"
                        />
                        {errors.correo && (
                            <p className="text-red-500 text-sm mt-1">{errors.correo.message}</p>
                        )}
                    </div>

                    <div>
                        <input {...register('contrasena')} 
                        placeholder="Contraseña"
                        type="password"
                        className="w-full border rounded-lg px-3 py-2"
                        />{errors.contrasena && (<p className="text-red-500 text-sm mt-1">{errors.contrasena.message}</p>)}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50">{isSubmitting ? 'Entrando' : 'Iniciar sesion'}</button>
                </form>
            </main>
        )
}