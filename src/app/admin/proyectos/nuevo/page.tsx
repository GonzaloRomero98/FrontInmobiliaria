'use client'

import { Ciudad, Region } from "@/types/ubicacion";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { gerRegiones, getCiudades } from "@/services/ubicacion.service";
import z from "zod";
import { crearPoryecto } from "@/services/proyecto.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import SubidaImagen from "@/components/SubidaImagen";
import { SelectorUbicacion } from "@/components/mapas";

const esquemaProyecto = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').max(150),
    id_region: z.string().min(1, 'Selecciona una region'),
    id_ciudad: z.string().min(1, 'Selecciona una ciudad'),
    descripcion: z.string().optional(),
    direccion: z.string().max(200).optional(),
    imagenPortada: z.string().optional() // se completa recién tras subir a S3 en el submit
});

type FormValues = z.infer<typeof esquemaProyecto>;

export default function NuevoProyecto() {
    const router = useRouter();
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [latitud, setLatitud] = useState<number | null>(null);
    const [longitud, setLongitud] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setError: setFormError, // renombrado para no chocar con el useState "error" de arriba
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(esquemaProyecto) });

    const idRegionSeleccionada = watch('id_region');

    useEffect(() => {
        gerRegiones().then(setRegiones).catch(() => setError('No se pudo cargar las regiones'));
    }, []);

    useEffect(() => {
        if (!idRegionSeleccionada) {
            setCiudades([]);
            return;
        }
        setValue('id_ciudad', '');
        getCiudades(Number(idRegionSeleccionada)).then(setCiudades).catch(() => setError('No se ha podido cargar las ciudades'));
    }, [idRegionSeleccionada, setValue]);

    async function onSubmit(dataForm: FormValues) {
        setError(null);

        if (!archivoImagen) {
            setFormError('imagenPortada', { type: 'manual', message: 'Falta subir la imagen' });
            return;
        }

        try {
            setSubiendoImagen(true);
            setProgreso(0);

            const { uploadUrl, publicUrl, contentType } = await obtenerUrlSubida(archivoImagen, 'proyectos');
            await subirArchivo(archivoImagen, uploadUrl, contentType, setProgreso);

            const proyecto = await crearPoryecto({
                nombre: dataForm.nombre,
                id_ciudad: Number(dataForm.id_ciudad),
                descripcion: dataForm.descripcion || undefined,
                imagenPortada: publicUrl,
                direccion: dataForm.direccion?.trim() || undefined,
                ...(latitud !== null && longitud !== null && { latitud, longitud }),
            });

            // Siguiente paso: completar la normativa del plan regulador
            router.push(`/admin/proyectos/${proyecto.id}`);
        } catch {
            setError('No se pudo crear el proyecto, revisa bien los datos');
        } finally {
            setSubiendoImagen(false);
        }
    }

    return (
        <main className="max-w-lg mx-auto px-4 py-10">
            <Link href="/admin/proyectos" className="text-sm text-gray-500 hover:underline">← Proyectos</Link>
            <h1 className="text-2xl font-bold mb-6">Crear proyecto</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                    <input
                        {...register('nombre')}
                        placeholder="Nombre del proyecto"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                    {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>

                <div>
                    <select {...register('id_region')} className="w-full border rounded-lg px-3 py-2">
                        <option value="">Selecciona una región</option>
                        {regiones.map((r) => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                    </select>
                    {errors.id_region && <p className="text-red-500 text-sm mt-1">{errors.id_region.message}</p>}
                </div>

                <div>
                    <select
                        {...register('id_ciudad')}
                        className="w-full border rounded-lg px-3 py-2"
                        disabled={!idRegionSeleccionada}
                    >
                        <option value="">Selecciona una ciudad</option>
                        {ciudades.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                    {errors.id_ciudad && <p className="text-red-500 text-sm mt-1">{errors.id_ciudad.message}</p>}
                </div>

                <div>
                    <textarea
                        {...register('descripcion')}
                        placeholder="Descripción (opcional)"
                        className="w-full border rounded-lg px-3 py-2"
                        rows={3}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        {...register('direccion')}
                        placeholder="Dirección (opcional)"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                    <p className="text-sm text-gray-500">
                        Ubicación en el mapa (opcional): haz clic donde está el proyecto.
                        {latitud !== null && longitud !== null && <> Seleccionado: {latitud}, {longitud}</>}
                    </p>
                    <SelectorUbicacion latitud={latitud} longitud={longitud} onCambio={(lat, lng) => { setLatitud(lat); setLongitud(lng); }} />
                </div>

                <div>
                    <SubidaImagen
                        archivoSeleccionado={setArchivoImagen}
                        progreso={progreso}
                        subiendo={subiendoImagen}
                    />
                    {errors.imagenPortada && <p className="text-red-500 text-sm mt-1">{errors.imagenPortada.message}</p>}
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting || subiendoImagen}
                    className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50"
                >
                    {subiendoImagen ? 'Subiendo imagen...' : isSubmitting ? 'Creando...' : 'Crear proyecto'}
                </button>
            </form>
        </main>
    )
}