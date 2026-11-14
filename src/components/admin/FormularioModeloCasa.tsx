'use client'

import SubidaImagen from "@/components/SubidaImagen";
import SubidaModelo3d from "@/components/SubirArchivo";
import { getCaracteristicas } from "@/services/caracteristica.service";
import { actualizarModeloCasa, crearModeloCasa, nombreModeloDisponible } from "@/services/modeloCasa.service";
import { getNormativa, getProyectos } from "@/services/proyecto.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { formatearNumero } from "@/lib/formato";
import { revisarNormativa } from "@/lib/normativa";
import { Caracteristica } from "@/types/caracteristicas";
import { ETIQUETA_TIPO_VIVIENDA, ModeloCasa, ModeloCasaInput, Moneda, Operacion, SUBSIDIOS } from "@/types/modeloCasa";
import { Normativa } from "@/types/normativa";
import { Proyecto } from "@/types/proyecto";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const esquemaModeloCasa = z.object({
    id_proyecto: z.string().min(1, 'Selecciona el proyecto'),
    nombreModelo: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
    tipoOperacion: z.enum(['VENTA', 'ARRIENDO']),
    dormitorios: z.string().min(1, 'Campo obligatorio'),
    banos: z.string().min(1,'Campo obligatorio'),
    estacionamiento: z.string().min(1, 'Campo obligatorio'),
    mascotas: z.boolean(),
    superficieConstruida: z.string().min(1, 'Campo obligatorio'),
    tipoVivienda: z.enum(['CASA', 'DEPARTAMENTO']),
    superficieTerreno: z.string().optional(),
    precio: z.string().min(1, 'Campo obligatorio'),
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

const ETIQUETA = "flex flex-col gap-1 text-sm";
const CAMPO = "w-full border rounded-lg px-3 py-2";
const SECCION = "flex flex-col gap-4";
const TITULO_SECCION = "font-titulo font-semibold text-marca mb-3";

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
        // Si la API no tiene la migración de reservas no envía unidades, por eso se usa 1.
        unidades: String(modelo.unidades ?? 1),
        publicado: modelo.activo,
    };
}

export default function FormularioModeloCasa({ modelo }: { modelo?: ModeloCasa }){
    const router = useRouter();

    const[proyectos, setProyectos] = useState<Proyecto[]>([]);
    const[caracteristica, setCaracteristica] = useState<Caracteristica[]>([]);
    const[caracteristicaSeleccionadas, setCaracteristicaSeleccionadas] = useState<number[]>(modelo?.caracteristicas.map((c) => c.id) ?? []);
    const [error, setError ] = useState<string | null >(null);

    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [archivoModelo3D, setArchivoModelo3D] = useState<File | null>(null);
    const [archivoPlano, setArchivoPlano] = useState<File | null>(null);

    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [subiendoModelo3D, setSubiendoModelo3d]  = useState(false);
    const [subiendoPlano, setSubiendoPlano] = useState(false);

    const [progresoImagen, setProgresoImagen] = useState(0);
    const [progresoModelo3d, setProgresoModelo3d] = useState(0);
    const [progresoPlano, setProgresoPlano] = useState(0);

    const{register, handleSubmit, watch, setValue, setError:setFormError, formState:{errors,isSubmitting}}=useForm<FormValues>({
        resolver: zodResolver(esquemaModeloCasa),
        defaultValues: valoresIniciales(modelo)
    });
    const quitarModelo3d = watch('quitarModelo3d');
    const quitarPlano = watch('quitarPlano');
    const esCasa = watch('tipoVivienda') === 'CASA';
    const idProyecto = watch('id_proyecto');

    // Se guarda junto al id del proyecto para no mostrar la normativa del proyecto anterior mientras carga la nueva.
    const [normativa, setNormativa] = useState<{ idProyecto: string; datos: Normativa | null } | null>(null);
    const normativaActual = idProyecto && normativa?.idProyecto === idProyecto ? normativa.datos : undefined;
    const revision = normativaActual ? revisarNormativa({
        tipoVivienda: watch('tipoVivienda'),
        superficieConstruida: Number(watch('superficieConstruida')),
        superficieTerreno: Number(watch('superficieTerreno')),
    }, normativaActual) : null;
    const sinCoeficientes = normativaActual === null
        || (normativaActual !== undefined && normativaActual.coefConstructibilidad == null && normativaActual.coefOcupacionSuelo == null);

    useEffect(()=>{
        getProyectos().then(setProyectos).catch(()=> setError('no se pudo cargar los proyectos'));
        getCaracteristicas().then(setCaracteristica).catch(()=>setError('no se puedo cargar las caracteristicas'));
    },[]);

    useEffect(()=>{
        if(!idProyecto) return;
        let vigente = true;
        // Si falla solo se pierde la ayuda de la normativa, el formulario sigue funcionando.
        getNormativa(idProyecto).then((datos) => { if(vigente) setNormativa({ idProyecto, datos }); }).catch(() => {});
        return () => { vigente = false; };
    },[idProyecto]);

    useEffect(()=>{
        if(modelo && proyectos.length) setValue('id_proyecto', modelo.proyecto.id);
    },[modelo, proyectos, setValue]);

    function mostrarCaracteristicas(id:number){
        setCaracteristicaSeleccionadas((prev)=>prev.includes(id) ? prev.filter((caracteristica) => caracteristica !== id):[...prev, id])
    }

    async function onSubmit(dataForm:FormValues) {
        setError(null);

        if(!archivoImagen && !modelo){
            setFormError('imgPrincipal',{type:'manual', message:'Falta subir la imagen de la propiedad'});
            return;
        }

        try{
            // El nombre se revisa antes de subir la imagen y el .glb, para no subir archivos a S3 si está repetido.
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

            let modelo3dUrl: string | null = dataForm.quitarModelo3d ? null : modelo?.modelo3dUrl ?? null;
            if(archivoModelo3D && !dataForm.quitarModelo3d){
                setSubiendoModelo3d(true);
                const {uploadUrl: urlModelo3d, publicUrl: publicUrlModelo3d, contentType: tipoModelo3d} = await obtenerUrlSubida(archivoModelo3D, 'modelos3D');
                await subirArchivo(archivoModelo3D, urlModelo3d, tipoModelo3d, setProgresoModelo3d);
                setSubiendoModelo3d(false);
                modelo3dUrl = publicUrlModelo3d;
            }

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
            // Al crear sin 3D el campo no se envía. Al editar, null quita el modelo 3D.
            if(modelo3dUrl !== null || modelo) inputFormModelo.modelo3dUrl = modelo3dUrl;

            if(modelo){
                await actualizarModeloCasa(modelo.id, inputFormModelo);
                router.push('/admin/modelosCasa');
            }else{
                const creado = await crearModeloCasa(inputFormModelo);
                router.push(creado.activo ? `/modelosCasa/${creado.id}` : '/admin/modelosCasa');
            }
        }catch(e){
            const status = isAxiosError(e) ? e.response?.status : undefined;
            const mensaje = isAxiosError(e) ? e.response?.data?.message : undefined;
            setError(status === 409
                ? 'Ya existe un modelo con ese nombre'
                : status === 400 && typeof mensaje === 'string' ? mensaje
                : modelo ? 'No se pudo guardar el modelo' : 'No se pudo crear el modelo');
            setSubiendoImagen(false);
            setSubiendoModelo3d(false);
            setSubiendoPlano(false);
        }
    }

    return(
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
                <fieldset className={SECCION}>
                    <legend className={TITULO_SECCION}>Identificación</legend>
                    <div>
                        <label className={ETIQUETA}>
                            Proyecto
                            <select {...register('id_proyecto')} className={CAMPO}>
                                <option value="">Selecciona un proyecto</option>
                                {proyectos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </label>
                        {errors.id_proyecto && <p className="text-red-500 text-sm mt-1">{errors.id_proyecto.message}</p>}
                    </div>

                    <div>
                        <label className={ETIQUETA}>
                            Nombre del modelo
                            <input {...register('nombreModelo')} className={CAMPO} />
                        </label>
                        {errors.nombreModelo && <p className="text-red-500 text-sm mt-1">{errors.nombreModelo.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <label className={ETIQUETA}>
                            Operación
                            <select {...register('tipoOperacion')} className={CAMPO}>
                                <option value="VENTA">Venta</option>
                                <option value="ARRIENDO">Arriendo</option>
                            </select>
                        </label>
                        <label className={ETIQUETA}>
                            Tipo de vivienda
                            <select {...register('tipoVivienda')} className={CAMPO}>
                                {Object.entries(ETIQUETA_TIPO_VIVIENDA).map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>{etiqueta}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </fieldset>

                <fieldset className={SECCION}>
                    <legend className={TITULO_SECCION}>Programa</legend>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className={ETIQUETA}>
                                Dormitorios
                                <input {...register('dormitorios')} type="number" min="0" className={CAMPO} />
                            </label>
                            {errors.dormitorios && <p className="text-red-500 text-sm mt-1">{errors.dormitorios.message}</p>}
                        </div>
                        <div>
                            <label className={ETIQUETA}>
                                Baños
                                <input {...register('banos')} type="number" min="0" className={CAMPO} />
                            </label>
                            {errors.banos && <p className="text-red-500 text-sm mt-1">{errors.banos.message}</p>}
                        </div>
                        <div>
                            <label className={ETIQUETA}>
                                Estacionamientos
                                <input {...register('estacionamiento')} type="number" min="0" className={CAMPO} />
                            </label>
                            {errors.estacionamiento && <p className="text-red-500 text-sm mt-1">{errors.estacionamiento.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={ETIQUETA}>
                                Superficie construida (m²)
                                <input {...register('superficieConstruida')} type="number" step="0.01" className={CAMPO} />
                            </label>
                            {errors.superficieConstruida && <p className="text-red-500 text-sm mt-1">{errors.superficieConstruida.message}</p>}
                        </div>
                        <div>
                            <label className={ETIQUETA}>
                                {esCasa ? 'Superficie terreno (m²)' : 'Superficie terreno (m², opcional)'}
                                <input {...register('superficieTerreno')} type="number" step="0.01" className={CAMPO} />
                            </label>
                            {errors.superficieTerreno && <p className="text-red-500 text-sm mt-1">{errors.superficieTerreno.message}</p>}
                        </div>
                    </div>

                    {esCasa && revision && normativaActual && (
                        <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${revision.exceso > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'text-gray-600'}`}>
                            <p className="font-medium">Plan regulador{normativaActual.zona && ` (zona ${normativaActual.zona})`}</p>
                            <ul className="mt-1">
                                {revision.maximoConstruido !== null && (
                                    <li>
                                        Máximo construido: {formatearNumero(revision.maximoConstruido)} m²
                                        (coef. {formatearNumero(normativaActual.coefConstructibilidad ?? 0)} × {formatearNumero(Number(watch('superficieTerreno')))} m² de terreno)
                                    </li>
                                )}
                                {revision.exceso > 0 && (
                                    <li className="font-medium">Este modelo supera el máximo en {formatearNumero(revision.exceso)} m². Revísalo con el arquitecto antes de publicarlo.</li>
                                )}
                                {revision.maximoPrimerPiso !== null && (
                                    <li>
                                        Primer piso máx.: {formatearNumero(revision.maximoPrimerPiso)} m²
                                        (ocupación de suelo {formatearNumero((normativaActual.coefOcupacionSuelo ?? 0) * 100, 0)} %), solo como referencia
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                    {esCasa && sinCoeficientes && (
                        <p className="text-xs text-gray-500">
                            Este proyecto no tiene coeficientes cargados en su normativa, por eso no se puede calcular el máximo construido.{' '}
                            <Link href={`/admin/proyectos/${idProyecto}`} className="underline">Completar la normativa</Link>
                        </p>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register('mascotas')} />
                        Permite mascotas
                    </label>

                    <div>
                        <p className="text-sm mb-2">Características</p>
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
                </fieldset>

                <fieldset className={SECCION}>
                    <legend className={TITULO_SECCION}>Precio</legend>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={ETIQUETA}>
                                Precio
                                <input {...register('precio')} type="number" step="0.0001" min="0" className={CAMPO} />
                            </label>
                            {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio.message}</p>}
                        </div>
                        <label className={ETIQUETA}>
                            Moneda
                            <select {...register('moneda')} className={CAMPO}>
                                <option value="UF">UF</option>
                                <option value="CLP">CLP</option>
                            </select>
                        </label>
                    </div>

                    <div>
                        <label className={ETIQUETA}>
                            {esCasa ? 'Gastos comunes mensuales en $ (si es condominio)' : 'Gastos comunes mensuales en $ (opcional)'}
                            <input {...register('gastosComunes')} type="number" min="0" step="1" className={CAMPO} />
                        </label>
                        {errors.gastosComunes && <p className="text-red-500 text-sm mt-1">{errors.gastosComunes.message}</p>}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm" role="group" aria-label="Apto para subsidio">
                        <span>Apto para subsidio:</span>
                        {SUBSIDIOS.map((s) => (
                            <label key={s} className="flex items-center gap-2">
                                <input type="checkbox" value={s} {...register('subsidios')} />
                                {s}
                            </label>
                        ))}
                    </div>

                    <div>
                        <label className={ETIQUETA}>
                            Bono o promoción (opcional)
                            <input {...register('bono')} maxLength={150} placeholder="Ej.: Bono pie 10%" className={CAMPO} />
                        </label>
                        {errors.bono && <p className="text-red-500 text-sm mt-1">{errors.bono.message}</p>}
                    </div>
                </fieldset>

                <fieldset className={SECCION}>
                <legend className={TITULO_SECCION}>Archivos</legend>
                <div>
                    <p className="text-sm mb-2">Imagen principal{modelo && ' (elige una solo si quieres reemplazarla)'}</p>
                    {modelo?.imgPrincipal && !archivoImagen && (
                        <img src={modelo.imgPrincipal} alt="Imagen actual" className="w-32 h-24 object-cover rounded-lg border mb-2" />
                    )}
                    <SubidaImagen archivoSeleccionado={setArchivoImagen} progreso={progresoImagen} subiendo={subiendoImagen} />
                    {errors.imgPrincipal && <p className="text-red-500 text-sm mt-1">{errors.imgPrincipal.message}</p>}
                </div>

                <div>
                    <p className="text-sm mb-2">Modelo 3D (.glb o .gltf, opcional)</p>
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
                    <p className="text-sm mb-2">Plano de planta (imagen, opcional)</p>
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
                </fieldset>

                <fieldset className={SECCION}>
                <legend className={TITULO_SECCION}>Publicación</legend>
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
                </fieldset>

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
