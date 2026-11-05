'use client'

import { isAxiosError } from "axios";
import Link from "next/link";
import { crearSolicitud } from "@/services/solicitud.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const esquemFormulario = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido: z.string().min(1, 'El apellido es obligatorio'),
    correo: z.string().email('Ingresa un correo válido'),
    celular: z.string().min(1, 'El celular es obligatorio'),
    mensaje: z.string().optional().default(''),
    aceptaPrivacidad: z.boolean().refine((v) => v, 'Debes aceptar la política de privacidad'),
});

type FormValues = z.input<typeof esquemFormulario>;

interface FormularioContactoProps {
    idModeloCasa: string;
}

export default function FormularioContacto({ idModeloCasa }: FormularioContactoProps) {
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(esquemFormulario),
        defaultValues: { aceptaPrivacidad: false },
    });

    async function onSubmit(dataForm: FormValues) {
        setError(null);

        try {
            await crearSolicitud({
                ...dataForm,
                mensaje: dataForm.mensaje ?? '',
                id_modelo_casa:idModeloCasa,
            });
            setEnviado(true);
            reset();
        } catch (e) {
            setError(isAxiosError(e) && e.response?.status === 429
                ? 'Enviaste demasiadas solicitudes seguidas. Espera un minuto e inténtalo de nuevo.'
                : 'No se pudo realizar el envio de la solicitud, reintente');
        }
    }

    if (enviado) {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
                Gracias, muy pronto se contactarán con usted.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <h3 className="font-semibold text-lg">¿Tienes duda? Contáctate con nosotros</h3>

            <div>
                <input
                    {...register('nombre')}
                    placeholder="Nombre"
                    className="w-full border rounded-lg px-3 py-2"
                />
                {errors.nombre && (
                    <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
                )}
            </div>

            <div>
                <input
                    {...register('apellido')}
                    placeholder="Apellido"
                    className="w-full border rounded-lg px-3 py-2"
                />
                {errors.apellido && (
                    <p className="text-red-500 text-sm mt-1">{errors.apellido.message}</p>
                )}
            </div>

            <div>
                <input
                    {...register('correo')}
                    placeholder="ejemplo@ejemplo.com"
                    className="w-full border rounded-lg px-3 py-2"
                />
                {errors.correo && (
                    <p className="text-red-500 text-sm mt-1">{errors.correo.message}</p>
                )}
            </div>

            <div>
                <input
                    {...register('celular')}
                    placeholder="+56999999999"
                    className="w-full border rounded-lg px-3 py-2"
                />
                {errors.celular && (
                    <p className="text-red-500 text-sm mt-1">{errors.celular.message}</p>
                )}
            </div>

            <div>
                <input
                    {...register('mensaje')}
                    placeholder="Dejenos un mensaje (Opcional)"
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            <div>
                <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" {...register('aceptaPrivacidad')} className="mt-1" />
                    <span>
                        Acepto que mis datos se usen para responder esta solicitud, según la{' '}
                        <Link href="/privacidad" target="_blank" className="underline">política de privacidad</Link>.
                    </span>
                </label>
                {errors.aceptaPrivacidad && (
                    <p className="text-red-500 text-sm mt-1">{errors.aceptaPrivacidad.message}</p>
                )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
            >
                {isSubmitting ? 'Enviado' : 'Enviar formulario'}
            </button>
        </form>
    );
}