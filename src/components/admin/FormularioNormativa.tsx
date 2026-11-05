'use client'

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { guardarNormativa } from "@/services/proyecto.service";
import { Normativa, NormativaInput, Riesgo, RIESGOS } from "@/types/normativa";

const numeroOpcional = (min: number, max: number) => z.string().refine(
    (v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    `Debe ser un número entre ${min} y ${max}`,
);

const esquema = z.object({
    instrumento: z.string().min(1, 'Indica el instrumento (ej: Plan Regulador Comunal de Talca)').max(200),
    zona: z.string().min(1, 'Indica la zona').max(50),
    usosPermitidos: z.string().min(1, 'Describe los usos permitidos'),
    alturaMaximaPisos: numeroOpcional(1, 200),
    alturaMaximaMetros: numeroOpcional(0, 1000),
    densidadMaxima: numeroOpcional(0, 100000),
    coefConstructibilidad: numeroOpcional(0, 100),
    ocupacionSueloPorcentaje: numeroOpcional(0, 100),
    riesgos: z.array(z.string()),
    urlOrdenanza: z.string().refine((v) => v === '' || /^https?:\/\/\S+$/.test(v), 'Debe ser una URL que empiece con http:// o https://'),
    fechaConsulta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica la fecha de consulta'),
    observaciones: z.string().max(2000),
});

type Valores = z.infer<typeof esquema>;

const aNumero = (v: string) => (v === '' ? undefined : Number(v));
const texto = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

function valoresIniciales(n: Normativa | null): Valores {
    return {
        instrumento: n?.instrumento ?? '',
        zona: n?.zona ?? '',
        usosPermitidos: n?.usosPermitidos ?? '',
        alturaMaximaPisos: texto(n?.alturaMaximaPisos),
        alturaMaximaMetros: texto(n?.alturaMaximaMetros),
        densidadMaxima: texto(n?.densidadMaxima),
        coefConstructibilidad: texto(n?.coefConstructibilidad),
        ocupacionSueloPorcentaje: n?.coefOcupacionSuelo != null ? String(Math.round(n.coefOcupacionSuelo * 100)) : '',
        riesgos: n?.riesgos ?? [],
        urlOrdenanza: n?.urlOrdenanza ?? '',
        fechaConsulta: n?.fechaConsulta?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        observaciones: n?.observaciones ?? '',
    };
}

export default function FormularioNormativa({ idProyecto, normativa }: { idProyecto: string; normativa: Normativa | null }) {
    const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Valores>({
        resolver: zodResolver(esquema),
        defaultValues: valoresIniciales(normativa),
    });

    async function onSubmit(v: Valores) {
        setMensaje(null);
        const ocupacion = aNumero(v.ocupacionSueloPorcentaje);
        const datos: NormativaInput = {
            instrumento: v.instrumento.trim(),
            zona: v.zona.trim(),
            usosPermitidos: v.usosPermitidos.trim(),
            alturaMaximaPisos: aNumero(v.alturaMaximaPisos),
            alturaMaximaMetros: aNumero(v.alturaMaximaMetros),
            densidadMaxima: aNumero(v.densidadMaxima),
            coefConstructibilidad: aNumero(v.coefConstructibilidad),
            coefOcupacionSuelo: ocupacion === undefined ? undefined : Number((ocupacion / 100).toFixed(2)),
            riesgos: v.riesgos as Riesgo[],
            urlOrdenanza: v.urlOrdenanza.trim() || undefined,
            fechaConsulta: v.fechaConsulta,
            observaciones: v.observaciones.trim() || undefined,
        };
        try {
            await guardarNormativa(idProyecto, datos);
            setMensaje({ tipo: 'ok', texto: 'Normativa guardada. Ya se muestra en la ficha del proyecto.' });
        } catch {
            setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Revisa los datos.' });
        }
    }

    const campo = "w-full border rounded-lg px-3 py-2";
    const error = (clave: keyof Valores) => errors[clave] && <p className="text-red-500 text-sm mt-1">{errors[clave]?.message}</p>;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5 border rounded-xl">
            <div>
                <h2 className="text-xl font-semibold">Normativa urbana (plan regulador)</h2>
                <p className="text-sm text-gray-500">
                    Copia los datos de la ordenanza del Plan Regulador Comunal (o Intercomunal) para la zona del terreno.
                    Lo ideal es tomarlos del Certificado de Informaciones Previas (CIP) del proyecto.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                    <label className="text-sm">Instrumento</label>
                    <input {...register('instrumento')} placeholder="Plan Regulador Comunal de Talca (2019)" className={campo} />
                    {error('instrumento')}
                </div>
                <div>
                    <label className="text-sm">Zona</label>
                    <input {...register('zona')} placeholder="ZH-2" className={campo} />
                    {error('zona')}
                </div>
            </div>

            <div>
                <label className="text-sm">Usos permitidos</label>
                <textarea {...register('usosPermitidos')} rows={3} className={campo}
                    placeholder="Residencial; equipamiento de comercio y servicios de escala menor. Prohibido industria y bodegaje." />
                {error('usosPermitidos')}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                    <label className="text-sm">Altura máx. (pisos)</label>
                    <input {...register('alturaMaximaPisos')} inputMode="numeric" className={campo} />
                    {error('alturaMaximaPisos')}
                </div>
                <div>
                    <label className="text-sm">Altura máx. (metros)</label>
                    <input {...register('alturaMaximaMetros')} inputMode="decimal" className={campo} />
                    {error('alturaMaximaMetros')}
                </div>
                <div>
                    <label className="text-sm">Densidad máx. (hab/ha)</label>
                    <input {...register('densidadMaxima')} inputMode="numeric" className={campo} />
                    {error('densidadMaxima')}
                </div>
                <div>
                    <label className="text-sm">Coef. constructibilidad</label>
                    <input {...register('coefConstructibilidad')} inputMode="decimal" placeholder="1.6" className={campo} />
                    {error('coefConstructibilidad')}
                </div>
                <div>
                    <label className="text-sm">Ocupación de suelo (%)</label>
                    <input {...register('ocupacionSueloPorcentaje')} inputMode="numeric" placeholder="60" className={campo} />
                    {error('ocupacionSueloPorcentaje')}
                </div>
            </div>

            <fieldset>
                <legend className="text-sm mb-2">Áreas de riesgo que afectan la zona</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Object.entries(RIESGOS) as [Riesgo, string][]).map(([clave, etiqueta]) => (
                        <label key={clave} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" value={clave} {...register('riesgos')} />
                            {etiqueta}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                    <label className="text-sm">URL de la ordenanza oficial</label>
                    <input {...register('urlOrdenanza')} placeholder="https://..." className={campo} />
                    {error('urlOrdenanza')}
                </div>
                <div>
                    <label className="text-sm">Fecha de consulta</label>
                    <input type="date" {...register('fechaConsulta')} className={campo} />
                    {error('fechaConsulta')}
                </div>
            </div>

            <div>
                <label className="text-sm">Observaciones (opcional)</label>
                <textarea {...register('observaciones')} rows={2} className={campo} placeholder="Ej: modificación del PRC en trámite" />
                {error('observaciones')}
            </div>

            {mensaje && <p className={`text-sm ${mensaje.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{mensaje.texto}</p>}

            <button type="submit" disabled={isSubmitting} className="bg-black text-white rounded-lg py-2.5 font-medium disabled:opacity-50">
                {isSubmitting ? 'Guardando...' : 'Guardar normativa'}
            </button>
        </form>
    );
}
