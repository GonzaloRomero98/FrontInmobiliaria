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
    correo:z.string().email('Los datos no son válidos'),
    contrasena: z.string().min(1,'Los datos no son válidos')
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

                // El token ya lo dejó la API en una cookie HttpOnly. Esta cookie solo se usa para saber qué menú mostrar.
                Cookies.set('rol_usuario', respuesta.usuario.rol, OPCIONES_COOKIE_SESION);
                
                if(respuesta.usuario.rol === 'ADMIN'){
                    router.push('/admin');
                }else{
                    router.push('/secretario');
                }
            }catch(error){
                console.error('Error de login:', error);
                const status = isAxiosError(error) ? error.response?.status : undefined;
                // Sin respuesta o con un error 5xx el problema es del servidor y no de los datos ingresados.
                setError(status === 429
                    ? 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.'
                    : status === undefined || status >= 500
                        ? 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo en unos momentos.'
                        : 'Correo o contraseña incorrectos')
            }
        }

        return (
            <main className="max-w-md mx-auto px-4 py-20">
                <h1 className="text-2xl font-bold mb-6">Iniciar sesión</h1>
                {/* noValidate para que los mensajes de error sean los de zod y no los del navegador. */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                    <div>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Correo electrónico
                            <input {...register('correo')} type="email" autoComplete="username"
                                aria-invalid={!!errors.correo || undefined} aria-describedby={errors.correo ? 'error-correo' : undefined}
                                className="w-full border rounded-lg px-3 py-2 text-base font-normal text-gray-900" />
                        </label>
                        {errors.correo && (
                            <p id="error-correo" role="alert" className="text-red-700 text-sm mt-1">{errors.correo.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Contraseña
                            <input {...register('contrasena')} type="password" autoComplete="current-password"
                                aria-invalid={!!errors.contrasena || undefined} aria-describedby={errors.contrasena ? 'error-contrasena' : undefined}
                                className="w-full border rounded-lg px-3 py-2 text-base font-normal text-gray-900" />
                        </label>
                        {errors.contrasena && (
                            <p id="error-contrasena" role="alert" className="text-red-700 text-sm mt-1">{errors.contrasena.message}</p>
                        )}
                    </div>

                    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50">{isSubmitting ? 'Entrando…' : 'Iniciar sesión'}</button>
                </form>
            </main>
        )
}