'use client'

import { isAxiosError } from "axios";
import Link from "next/link";
import { crearSolicitud } from "@/services/solicitud.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { CELULAR_VALIDO, normalizarCelular } from "@/lib/formato";

const esquemFormulario = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellido: z.string().min(1, 'El apellido es obligatorio'),
    correo: z.string().email('Ingresa un correo válido'),
    celular: z.string().min(1, 'El celular es obligatorio').transform(normalizarCelular)
        .refine((v) => CELULAR_VALIDO.test(v), 'Ingresa un celular chileno válido, ej: +56 9 1234 5678'),
    mensaje: z.string().optional().default(''),
    // datetime-local: "2026-11-10T15:30" en la hora del navegador
    visita: z.string().optional(),
    aceptaPrivacidad: z.boolean().refine((v) => v, 'Debes aceptar la política de privacidad'),
});

type FormValues = z.input<typeof esquemFormulario>;

interface FormularioContactoProps {
    idModeloCasa: string;
    // Solo si el proyecto tiene sala de ventas se ofrece pedir una visita
    conVisita?: boolean;
}

export default function FormularioContacto({ idModeloCasa, conVisita = false }: FormularioContactoProps) {
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
            const { visita, ...datos } = dataForm;
            await crearSolicitud({
                ...datos,
                mensaje: dataForm.mensaje ?? '',
                id_modelo_casa:idModeloCasa,
                ...(conVisita && visita && { visitaPreferida: new Date(visita).toISOString() }),
            });
            setEnviado(true);
            reset();
        } catch (e) {
            const status = isAxiosError(e) ? e.response?.status : undefined;
            const detalle = isAxiosError(e) ? e.response?.data?.message : undefined;
            setError(status === 429
                ? 'Enviaste demasiadas solicitudes seguidas. Espera un minuto e inténtalo de nuevo.'
                // El backend explica por qué rechaza la visita (fecha pasada o muy lejana)
                : status === 400 && typeof detalle === 'string'
                    ? detalle
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
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    aria-label="Celular (WhatsApp)"
                    placeholder="+56 9 1234 5678"
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
                    maxLength={2000}
                    className="w-full border rounded-lg px-3 py-2"
                />
            </div>

            {conVisita && (
                <label className="flex flex-col gap-1 text-sm">
                    ¿Quieres visitar la sala de ventas? Fecha y hora preferida (opcional)
                    <input type="datetime-local" {...register('visita')} className="w-full border rounded-lg px-3 py-2" />
                    <span className="text-xs text-gray-500">Te confirmaremos la visita por teléfono o WhatsApp.</span>
                </label>
            )}

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
                className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50"
            >
                {isSubmitting ? 'Enviado' : 'Enviar formulario'}
            </button>
        </form>
    );
}