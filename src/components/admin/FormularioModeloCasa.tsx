'use client'

import SubidaImagen from "@/components/SubidaImagen";
import SubidaModelo3d from "@/components/SubirArchivo";
import { getCaracteristicas } from "@/services/caracteristica.service";
import { actualizarModeloCasa, crearModeloCasa, nombreModeloDisponible } from "@/services/modeloCasa.service";
import { getProyectos } from "@/services/proyecto.service";
import { obtenerUrlSubida, subirArchivo } from "@/services/s3.service";
import { Caracteristica } from "@/types/caracteristicas";
import { ETIQUETA_ESTADO, ModeloCasa, ModeloCasaInput, Moneda, Operacion } from "@/types/modeloCasa";
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
    superficieTerreno: z.string().min(1,'Campo Obligatorio'),
    precio: z.string().min(1, 'Campo Obligatorio'),
    moneda: z.enum(['UF','CLP']),
    gastosComunes:z.boolean().optional(),
    imgPrincipal: z.string().optional(),
    quitarModelo3d: z.boolean().optional(),
    estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO']),
    publicado: z.boolean(),
})

type FormValues = z.infer<typeof esquemaModeloCasa>;

// Valores iniciales del formulario: vacíos al crear, los del modelo al editar
function valoresIniciales(modelo?: ModeloCasa): Partial<FormValues> {
    if (!modelo) return {mascotas:false, gastosComunes:false, estado:'DISPONIBLE', publicado:true};
    return {
        id_proyecto: modelo.proyecto.id,
        nombreModelo: modelo.nombreModelo,
        tipoOperacion: modelo.tipoOperacion,
        dormitorios: String(modelo.dormitorios),
        banos: String(modelo.banos),
        estacionamiento: String(modelo.estacionamientos),
        mascotas: modelo.mascotas,
        superficieConstruida: String(modelo.superficieConstruida),
        superficieTerreno: String(modelo.superficieTerreno),
        precio: String(modelo.precio),
        moneda: modelo.moneda,
        gastosComunes: modelo.gastosComunes,
        quitarModelo3d: false,
        estado: modelo.estado,
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

    //Validacion del archivo

    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [subiendoModelo3D, setSubiendoModelo3d]  = useState(false);

    //Progreso de subida
    const [progresoImagen, setProgresoImagen] = useState(0);
    const [progresoModelo3d, setProgresoModelo3d] = useState(0);

    //acciones formulario
    const{register, handleSubmit, watch, setValue, setError:setFormError, formState:{errors,isSubmitting}}=useForm<FormValues>({
        resolver: zodResolver(esquemaModeloCasa),
        defaultValues: valoresIniciales(modelo)
    });
    const quitarModelo3d = watch('quitarModelo3d');

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

            const inputFormModelo: ModeloCasaInput = {
                id_proyecto: dataForm.id_proyecto,
                nombreModelo: dataForm.nombreModelo,
                tipoOperacion: dataForm.tipoOperacion as Operacion,
                dormitorios: Number(dataForm.dormitorios),
                banos: Number(dataForm.banos),
                estacionamiento: Number(dataForm.estacionamiento),
                mascotas: dataForm.mascotas,
                superficieConstruida: Number(dataForm.superficieConstruida),
                superficieTerreno: Number(dataForm.superficieTerreno),
                precio: Number(dataForm.precio),
                moneda: dataForm.moneda as Moneda,
                gastosComunes: dataForm.gastosComunes ?? false,
                imgPrincipal,
                caracteristicasID: caracteristicaSeleccionadas,
                estado: dataForm.estado,
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
            setError(isAxiosError(e) && e.response?.status === 409
                ? 'Ya existe un modelo con ese nombre'
                : modelo ? 'No se pudo guardar el modelo' : 'No se pudo crear el modelo');
            setSubiendoImagen(false);
            setSubiendoModelo3d(false);
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
                        <input {...register('superficieTerreno')} type="number" step="0.01" placeholder="Superficie terreno (m²)" className="w-full border rounded-lg px-3 py-2" />
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
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register('gastosComunes')} />
                        Tiene gastos comunes
                    </label>
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

                <div className="grid grid-cols-2 gap-2 items-center">
                    <select {...register('estado')} aria-label="Estado comercial" className="w-full border rounded-lg px-3 py-2">
                        {Object.entries(ETIQUETA_ESTADO).map(([valor, etiqueta]) => (
                            <option key={valor} value={valor}>{etiqueta}</option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" {...register('publicado')} />
                        Publicado en el catálogo
                    </label>
                </div>
                <p className="text-xs text-gray-500 -mt-2">Sin publicar queda como borrador: solo se ve en este panel.</p>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting || subiendoImagen || subiendoModelo3D}
                    className="bg-marca text-white rounded-lg py-3 font-medium disabled:opacity-50"
                >
                    {subiendoImagen ? 'Subiendo imagen...' : subiendoModelo3D ? 'Subiendo modelo 3D...' : isSubmitting ? 'Guardando...' : modelo ? 'Guardar cambios' : 'Crear modelo de casa'}
                </button>
            </form>
    )
}
