'use client'

import SubidaImagen from "@/components/SubidaImagen";
import SubidaModelo3d from "@/components/SubirArchivo";
import { getCaracteristicas } from "@/services/caracteristica.service";
import { actualizarModeloCasa, crearModeloCasa, nombreModeloDisponible } from "@/services/modeloCasa.service";
import { getProyectos } from "@/services/proyecto.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { Caracteristica } from "@/types/caracteristicas";
import { ETIQUETA_TIPO_VIVIENDA, ModeloCasa, ModeloCasaInput, Moneda, Operacion, SUBSIDIOS } from "@/types/modeloCasa";
import { Proyecto } from "@/types/proyecto";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const esquemaModeloCasa = z.object({
    id_proyecto: z.string().min(1, 'Selecciona el proyecto'),
    // trim: el nombre que se comprueba es el mismo que se guarda
    nombreModelo: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
    tipoOperacion: z.enum(['VENTA', 'ARRIENDO']),
    dormitorios: z.string().min(1, 'Campo Obligatorio'),
    banos: z.string().min(1,'Campo obligatorio'),
    estacionamiento: z.string().min(1,'campoObligatorio'),
    mascotas: z.boolean(),
    superficieConstruida: z.string().min(1, 'Campo Obligatorio'),
    tipoVivienda: z.enum(['CASA', 'DEPARTAMENTO']),
    // Obligatoria solo en casas (ver superRefine)
    superficieTerreno: z.string().optional(),
    precio: z.string().min(1, 'Campo Obligatorio'),
    moneda: z.enum(['UF','CLP']),
    gastosComunes: z.string().regex(/^\d*$/, 'Monto en pesos, sin puntos ni decimales').optional(),
    subsidios: z.array(z.enum(['DS1', 'DS19'])),
    bono: z.string().trim().max(150, 'Máximo 150 caracteres').optional(),
    quitarPlano: z.boolean().optional(),
    imgPrincipal: z.string().optional(),
    quitarModelo3d: z.boolean().optional(),
    unidades: z.string().regex(/^[1-9]\d{0,3}$/, 'Entre 1 y 9999 unidades'),
    publicado: z.boolean(),
}).superRefine((datos, ctx) => {
    if (datos.tipoVivienda === 'CASA' && !datos.superficieTerreno) {
        ctx.addIssue({ code: 'custom', path: ['superficieTerreno'], message: 'Campo obligatorio en una casa' });
    }
})

type FormValues = z.infer<typeof esquemaModeloCasa>;

// Valores iniciales del formulario: vacíos al crear, los del modelo al editar
function valoresIniciales(modelo?: ModeloCasa): Partial<FormValues> {
    if (!modelo) return {mascotas:false, tipoVivienda:'CASA', subsidios:[], unidades:'1', publicado:true};
    return {
        id_proyecto: modelo.proyecto.id,
        nombreModelo: modelo.nombreModelo,
        tipoOperacion: modelo.tipoOperacion,
        dormitorios: String(modelo.dormitorios),
        banos: String(modelo.banos),
        estacionamiento: String(modelo.estacionamientos),
        mascotas: modelo.mascotas,
        superficieConstruida: String(modelo.superficieConstruida),
        tipoVivienda: modelo.tipoVivienda,
        superficieTerreno: modelo.superficieTerreno == null ? '' : String(modelo.superficieTerreno),
        precio: String(modelo.precio),
        moneda: modelo.moneda,
        gastosComunes: modelo.gastosComunes == null ? '' : String(modelo.gastosComunes),
        subsidios: modelo.subsidios ?? [],
        bono: modelo.bono ?? '',
        quitarModelo3d: false,
        quitarPlano: false,
        unidades: String(modelo.unidades),
        publicado: modelo.activo,
    };
}

export default function FormularioModeloCasa({ modelo }: { modelo?: ModeloCasa }){
    const router = useRouter();

    //Precarga de los datos
    const[proyectos, setProyectos] = useState<Proyecto[]>([]);
    const[caracteristica, setCaracteristica] = useState<Caracteristica[]>([]);
    const[caracteristicaSeleccionadas, setCaracteristicaSeleccionadas] = useState<number[]>(modelo?.caracteristicas.map((c) => c.id) ?? []);
    const [error, setError ] = useState<string | null >(null);

    //guardado del archivo
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [archivoModelo3D, setArchivoModelo3D] = useState<File | null>(null);
    const [archivoPlano, setArchivoPlano] = useState<File | null>(null);

    //Validacion del archivo

    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [subiendoModelo3D, setSubiendoModelo3d]  = useState(false);
    const [subiendoPlano, setSubiendoPlano] = useState(false);

    //Progreso de subida
    const [progresoImagen, setProgresoImagen] = useState(0);
    const [progresoModelo3d, setProgresoModelo3d] = useState(0);
    const [progresoPlano, setProgresoPlano] = useState(0);

    //acciones formulario
    const{register, handleSubmit, watch, setValue, setError:setFormError, formState:{errors,isSubmitting}}=useForm<FormValues>({
        resolver: zodResolver(esquemaModeloCasa),
        defaultValues: valoresIniciales(modelo)
    });
    const quitarModelo3d = watch('quitarModelo3d');
    const quitarPlano = watch('quitarPlano');
    const esCasa = watch('tipoVivienda') === 'CASA';

    useEffect(()=>{
        getProyectos().then(setProyectos).catch(()=> setError('no se pudo cargar los proyectos'));
        getCaracteristicas().then(setCaracteristica).catch(()=>setError('no se puedo cargar las caracteristicas'));
    },[]);

    // El select se llena después del primer render: se vuelve a fijar el proyecto del modelo
    useEffect(()=>{
        if(modelo && proyectos.length) setValue('id_proyecto', modelo.proyecto.id);
    },[modelo, proyectos, setValue]);

    function mostrarCaracteristicas(id:number){
        setCaracteristicaSeleccionadas((prev)=>prev.includes(id) ? prev.filter((caracteristica) => caracteristica !== id):[...prev, id])
    }

    async function onSubmit(dataForm:FormValues) {
        setError(null);

        // Al editar, la imagen solo se reemplaza si se elige una nueva
        if(!archivoImagen && !modelo){
            setFormError('imgPrincipal',{type:'manual', message:'Falta subir la imagen de la propiedad'});
            return;
        }

        try{
            // Antes de subir la imagen y el .glb: con un nombre repetido no se sube nada a S3
            if(!(await nombreModeloDisponible(dataForm.nombreModelo, modelo?.id))){
                setFormError('nombreModelo', {type:'manual', message:'Ya existe un modelo con ese nombre. Elige otro antes de subir los archivos.'});
                return;
            }

            let imgPrincipal = modelo?.imgPrincipal ?? '';
            if(archivoImagen){
                setSubiendoImagen(true);
                const {uploadUrl: urlImagen, publicUrl: publicUrlImagen, contentType: tipoImagen} = await obtenerUrlSubida(archivoImagen, 'modelosImagenes');
                await subirArchivo(archivoImagen, urlImagen, tipoImagen, setProgresoImagen);
                setSubiendoImagen(false);
                imgPrincipal = publicUrlImagen;
            }

            // El modelo 3D es opcional: se conserva el actual, se reemplaza o se quita
            let modelo3dUrl: string | null = dataForm.quitarModelo3d ? null : modelo?.modelo3dUrl ?? null;
            if(archivoModelo3D && !dataForm.quitarModelo3d){
                setSubiendoModelo3d(true);
                const {uploadUrl: urlModelo3d, publicUrl: publicUrlModelo3d, contentType: tipoModelo3d} = await obtenerUrlSubida(archivoModelo3D, 'modelos3D');
                await subirArchivo(archivoModelo3D, urlModelo3d, tipoModelo3d, setProgresoModelo3d);
                setSubiendoModelo3d(false);
                modelo3dUrl = publicUrlModelo3d;
            }

            // Plano de planta opcional: misma lógica que el modelo 3D
            let planoUrl: string | null = dataForm.quitarPlano ? null : modelo?.planoUrl ?? null;
            if(archivoPlano && !dataForm.quitarPlano){
                setSubiendoPlano(true);
                const {uploadUrl, publicUrl, contentType} = await obtenerUrlSubida(archivoPlano, 'modelosImagenes');
                await subirArchivo(archivoPlano, uploadUrl, contentType, setProgresoPlano);
                setSubiendoPlano(false);
                planoUrl = publicUrl;
            }

            const inputFormModelo: ModeloCasaInput = {
                id_proyecto: dataForm.id_proyecto,
                nombreModelo: dataForm.nombreModelo,
                tipoOperacion: dataForm.tipoOperacion as Operacion,
                dormitorios: Number(dataForm.dormitorios),
                banos: Number(dataForm.banos),
                estacionamiento: Number(dataForm.estacionamiento),
                mascotas: dataForm.mascotas,
                superficieConstruida: Number(dataForm.superficieConstruida),
                tipoVivienda: dataForm.tipoVivienda,
                superficieTerreno: dataForm.superficieTerreno ? Number(dataForm.superficieTerreno) : null,
                precio: Number(dataForm.precio),
                moneda: dataForm.moneda as Moneda,
                gastosComunes: dataForm.gastosComunes ? Number(dataForm.gastosComunes) : null,
                planoUrl,
                subsidios: dataForm.subsidios,
                bono: dataForm.bono || null,
                imgPrincipal,
                caracteristicasID: caracteristicaSeleccionadas,
                unidades: Number(dataForm.unidades),
                activo: dataForm.publicado,
            };
            // Al crear sin 3D no se envía el campo; al editar null lo quita
            if(modelo3dUrl !== null || modelo) inputFormModelo.modelo3dUrl = modelo3dUrl;

            if(modelo){
                await actualizarModeloCasa(modelo.id, inputFormModelo);
                router.push('/admin/modelosCasa');
            }else{
                const creado = await crearModeloCasa(inputFormModelo);
                // Un borrador no tiene ficha pública todavía
                router.push(creado.activo ? `/modelosCasa/${creado.id}` : '/admin/modelosCasa');
            }
        }catch(e){
            const status = isAxiosError(e) ? e.response?.status : undefined;
            const mensaje = isAxiosError(e) ? e.response?.data?.message : undefined;
            setError(status === 409
                ? 'Ya existe un modelo con ese nombre'
                // 400 de reglas de negocio (p. ej. unidades por debajo de las reservadas o vendidas)
                : status === 400 && typeof mensaje === 'string' ? mensaje
                : modelo ? 'No se pudo guardar el modelo' : 'No se pudo crear el modelo');
            setSubiendoImagen(false);
            setSubiendoModelo3d(false);
            setSubiendoPlano(false);
        }
    }

    return(
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                    <select {...register('id_proyecto')} className="w-full border rounded-lg px-3 py-2">
                        <option value="">Selecciona un proyecto</option>
                        {proyectos.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                    {errors.id_proyecto && <p className="text-red-500 text-sm mt-1">{errors.id_proyecto.message}</p>}
                </div>

                <div>
                    <input
                        {...register('nombreModelo')}
                        placeholder="Nombre del modelo"
                        className="w-full border rounded-lg px-3 py-2"
                    />
                    {errors.nombreModelo && <p className="text-red-500 text-sm mt-1">{errors.nombreModelo.message}</p>}
                </div>

                <div>
                    <select {...register('tipoOperacion')} className="w-full border rounded-lg px-3 py-2">
                        <option value="VENTA">Venta</option>
                        <option value="ARRIENDO">Arriendo</option>
                    </select>
                </div>

                <div>
                    <select {...register('tipoVivienda')} aria-label="Tipo de vivienda" className="w-full border rounded-lg px-3 py-2">
                        {Object.entries(ETIQUETA_TIPO_VIVIENDA).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <input {...register('dormitorios')} type="number" placeholder="Dormitorios" className="w-full border rounded-lg px-3 py-2" />
                        {errors.dormitorios && <p className="text-red-500 text-sm mt-1">{errors.dormitorios.message}</p>}
                    </div>
                    <div>
                        <input {...register('banos')} type="number" placeholder="Baños" className="w-full border rounded-lg px-3 py-2" />
                        {errors.banos && <p className="text-red-500 text-sm mt-1">{errors.banos.message}</p>}
                    </div>
                    <div>
                        <input {...register('estacionamiento')} type="number" placeholder="Estacionamientos" className="w-full border rounded-lg px-3 py-2" />
                        {errors.estacionamiento && <p className="text-red-500 text-sm mt-1">{errors.estacionamiento.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <input {...register('superficieConstruida')} type="number" step="0.01" placeholder="Superficie construida (m²)" className="w-full border rounded-lg px-3 py-2" />
                        {errors.superficieConstruida && <p className="text-red-500 text-sm mt-1">{errors.superficieConstruida.message}</p>}
                    </div>
                    <div>
                        <input {...register('superficieTerreno')} type="number" step="0.01" placeholder={esCasa ? 'Superficie terreno (m²)' : 'Superficie terreno (m², opcional)'} aria-label="Superficie terreno" className="w-full border rounded-lg px-3 py-2" />
                        {errors.superficieTerreno && <p className="text-red-500 text-sm mt-1">{errors.superficieTerreno.message}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <input {...register('precio')} type="number" step="0.0001" placeholder="Precio" className="w-full border rounded-lg px-3 py-2" />
                        {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio.message}</p>}
                    </div>
                    <div>
                        <select {...register('moneda')} className="w-full border rounded-lg px-3 py-2">
                            <option value="UF">UF</option>
                            <option value="CLP">CLP</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register('mascotas')} />
                        Permite mascotas
                    </label>
                </div>

                <div>
                    <input {...register('gastosComunes')} type="number" min="0" step="1"
                        placeholder={esCasa ? 'Gastos comunes mensuales en $ (si es condominio)' : 'Gastos comunes mensuales en $ (opcional)'}
                        aria-label="Gastos comunes" className="w-full border rounded-lg px-3 py-2" />
                    {errors.gastosComunes && <p className="text-red-500 text-sm mt-1">{errors.gastosComunes.message}</p>}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex gap-4 text-sm">
                        <span className="font-medium">Apto para subsidio:</span>
                        {SUBSIDIOS.map((s) => (
                            <label key={s} className="flex items-center gap-2">
                                <input type="checkbox" value={s} {...register('subsidios')} />
                                {s}
                            </label>
                        ))}
                    </div>
                    <input {...register('bono')} maxLength={150} placeholder="Bono o promoción (opcional), ej.: Bono pie 10%"
                        aria-label="Bono" className="w-full border rounded-lg px-3 py-2" />
                    {errors.bono && <p className="text-red-500 text-sm mt-1">{errors.bono.message}</p>}
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Características</p>
                    <div className="grid grid-cols-2 gap-1">
                        {caracteristica.map((c) => (
                            <label key={c.id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={caracteristicaSeleccionadas.includes(c.id)}
                                    onChange={() => mostrarCaracteristicas(c.id)}
                                />
                                {c.nombre}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Imagen principal{modelo && ' (elige una solo si quieres reemplazarla)'}</p>
                    {modelo?.imgPrincipal && !archivoImagen && (
                        <img src={modelo.imgPrincipal} alt="Imagen actual" className="w-32 h-24 object-cover rounded-lg border mb-2" />
                    )}
                    <SubidaImagen archivoSeleccionado={setArchivoImagen} progreso={progresoImagen} subiendo={subiendoImagen} />
                    {errors.imgPrincipal && <p className="text-red-500 text-sm mt-1">{errors.imgPrincipal.message}</p>}
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Modelo 3D (.glb o .gltf, opcional)</p>
                    {modelo?.modelo3dUrl && (
                        <label className="flex items-center gap-2 text-sm mb-2">
                            <input type="checkbox" {...register('quitarModelo3d')} />
                            Quitar el modelo 3D actual
                        </label>
                    )}
                    {!quitarModelo3d && (
                        <SubidaModelo3d archivoSeleccionado={setArchivoModelo3D} progreso={progresoModelo3d} subiendo={subiendoModelo3D} />
                    )}
                    <p className="text-xs text-gray-500 mt-1">Sin modelo 3D la ficha muestra la imagen principal.</p>
                </div>

                <div>
                    <p className="text-sm font-medium mb-2">Plano de planta (imagen, opcional)</p>
                    {modelo?.planoUrl && (
                        <>
                            {!archivoPlano && !quitarPlano && <img src={modelo.planoUrl} alt="Plano actual" className="w-32 h-24 object-contain rounded-lg border mb-2" />}
                            <label className="flex items-center gap-2 text-sm mb-2">
                                <input type="checkbox" {...register('quitarPlano')} />
                                Quitar el plano actual
                            </label>
                        </>
                    )}
                    {!quitarPlano && (
                        <SubidaImagen archivoSeleccionado={setArchivoPlano} progreso={progresoPlano} subiendo={subiendoPlano} />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                    <label className="text-sm">
                        Unidades (casas de este modelo)
                        <input type="number" min={1} max={9999} step={1} {...register('unidades')}
                            className="w-full border rounded-lg px-3 py-2 mt-1" />
                        {errors.unidades && <span className="text-red-500 text-xs">{errors.unidades.message}</span>}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register('publicado')} />
                        Publicado en el catálogo
                    </label>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                    El estado (disponible, reservado o vendido) se calcula con las reservas.
                    Sin publicar queda como borrador: solo se ve en este panel.
                </p>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting || subiendoImagen || subiendoModelo3D || subiendoPlano}
                    className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50"
                >
                    {subiendoImagen ? 'Subiendo imagen...' : subiendoModelo3D ? 'Subiendo modelo 3D...' : subiendoPlano ? 'Subiendo plano...' : isSubmitting ? 'Guardando...' : modelo ? 'Guardar cambios' : 'Crear modelo de casa'}
                </button>
            </form>
    )
}
