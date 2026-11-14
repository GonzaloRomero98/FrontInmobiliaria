'use client'

import { isAxiosError } from "axios";
import Link from "next/link";
import { crearSolicitud } from "@/services/solicitud.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
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
    visita: z.string().optional(),
    aceptaPrivacidad: z.boolean().refine((v) => v, 'Debes aceptar la política de privacidad'),
});

type FormValues = z.input<typeof esquemFormulario>;

const ETIQUETA = "flex flex-col gap-1 text-sm font-medium text-gray-700";
// text-base porque con letra menor a 16 px el iPhone hace zoom al tocar el campo.
const CAMPO = "w-full min-h-11 border rounded-lg px-3 py-2 text-base font-normal text-gray-900";

function MensajeError({ id, mensaje }: { id: string; mensaje?: string }) {
    return mensaje ? <p id={id} role="alert" className="text-red-700 text-sm mt-1">{mensaje}</p> : null;
}

interface FormularioContactoProps {
    idModeloCasa: string;
    conVisita?: boolean;
    sala?: { direccion: string; horario: string | null } | null;
}

export default function FormularioContacto({ idModeloCasa, conVisita = false, sala }: FormularioContactoProps) {
    const [enviado, setEnviado] = useState<{ nombre: string; celular: string; correo: string } | null>(null);
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
    const id = useId();
    // Liga cada campo con su mensaje de error para los lectores de pantalla.
    const conError = (campo: keyof typeof errors) =>
        errors[campo] ? { 'aria-invalid': true, 'aria-describedby': `${id}-${campo}` } : {};

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
            setEnviado({ nombre: dataForm.nombre.trim(), celular: dataForm.celular, correo: dataForm.correo });
            reset();
        } catch (e) {
            const status = isAxiosError(e) ? e.response?.status : undefined;
            const detalle = isAxiosError(e) ? e.response?.data?.message : undefined;
            setError(status === 429
                ? 'Enviaste demasiadas solicitudes seguidas. Espera un minuto e inténtalo de nuevo.'
                // El backend explica por qué rechaza la visita (fecha pasada o muy lejana).
                : status === 400 && typeof detalle === 'string'
                    ? detalle
                    : 'No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.');
        }
    }

    // Se promete contacto en 48 horas porque es el plazo en que el panel del secretario marca una solicitud como atrasada.
    if (enviado) {
        return (
            <div role="status" className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-900 flex flex-col gap-2">
                <p className="font-semibold">Listo, {enviado.nombre}. Recibimos tu solicitud.</p>
                <p>
                    Te contactaremos dentro de 48 horas al {enviado.celular.replace(/^\+569(\d{4})(\d{4})$/, '+56 9 $1 $2')} o
                    a {enviado.correo}.
                </p>
                {sala && (
                    <p className="text-sm">
                        Si prefieres, visítanos en la sala de ventas: {sala.direccion}{sala.horario ? `, ${sala.horario}` : ''}.
                    </p>
                )}
            </div>
        );
    }

    return (
        // noValidate para que los mensajes sean los de zod y no los del navegador.
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">¿Tienes dudas? Escríbenos</h2>

            <div>
                <label className={ETIQUETA}>
                    Nombre
                    <input {...register('nombre')} autoComplete="given-name" {...conError('nombre')} className={CAMPO} />
                </label>
                <MensajeError id={`${id}-nombre`} mensaje={errors.nombre?.message} />
            </div>

            <div>
                <label className={ETIQUETA}>
                    Apellido
                    <input {...register('apellido')} autoComplete="family-name" {...conError('apellido')} className={CAMPO} />
                </label>
                <MensajeError id={`${id}-apellido`} mensaje={errors.apellido?.message} />
            </div>

            <div>
                <label className={ETIQUETA}>
                    Correo electrónico
                    <input {...register('correo')} type="email" autoComplete="email" placeholder="ejemplo@correo.cl"
                        {...conError('correo')} className={CAMPO} />
                </label>
                <MensajeError id={`${id}-correo`} mensaje={errors.correo?.message} />
            </div>

            <div>
                <label className={ETIQUETA}>
                    Celular (WhatsApp)
                    <input {...register('celular')} type="tel" inputMode="tel" autoComplete="tel" maxLength={20}
                        placeholder="+56 9 1234 5678" {...conError('celular')} className={CAMPO} />
                </label>
                <MensajeError id={`${id}-celular`} mensaje={errors.celular?.message} />
            </div>

            <label className={ETIQUETA}>
                Mensaje (opcional)
                <textarea {...register('mensaje')} rows={3} maxLength={2000} className={CAMPO} />
            </label>

            {conVisita && (
                <label className={ETIQUETA}>
                    ¿Quieres visitar la sala de ventas? Fecha y hora preferida (opcional)
                    <input type="datetime-local" {...register('visita')} className={CAMPO} />
                    <span className="text-xs font-normal text-gray-500">Te confirmaremos la visita por teléfono o WhatsApp.</span>
                </label>
            )}

            <div>
                <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" {...register('aceptaPrivacidad')} {...conError('aceptaPrivacidad')} className="mt-0.5 w-5 h-5 shrink-0" />
                    <span>
                        Acepto que mis datos se usen para responder esta solicitud, según la{' '}
                        <Link href="/privacidad" target="_blank" className="underline">política de privacidad</Link>.
                    </span>
                </label>
                <MensajeError id={`${id}-aceptaPrivacidad`} mensaje={errors.aceptaPrivacidad?.message} />
            </div>

            {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50"
            >
                {isSubmitting ? 'Enviando…' : 'Enviar formulario'}
            </button>
        </form>
    );
}