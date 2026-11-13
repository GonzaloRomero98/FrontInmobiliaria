'use client'

import { actualizarModeloCasa, duplicarModeloCasa, eliminarModeloCasa, getModelosAdmin } from "@/services/modeloCasa.service";
import { ETIQUETA_ESTADO, ModeloCasa } from "@/types/modeloCasa"
import { unidadesDisponibles } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { avisar, confirmar } from "@/components/Dialogos";
import { useEffect, useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ListadoModelosCasa(){
    const [modelos, setModelos] = useState<ModeloCasa[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const router = useRouter();

    useEffect(()=>{
        getModelosAdmin().then(setModelos).catch(()=> setError('No se pudo cargar los modelos')).finally(()=> setCargando(false));
    },[]);

    // Los errores van en un aviso: el mensaje de arriba de la lista no se ve si se actuó desde más abajo
    async function cambiar(modelo:ModeloCasa, cambios:{activo:boolean}):Promise<boolean>{
        try{
            await actualizarModeloCasa(modelo.id, cambios);
            setModelos((lista) => lista.map((m) => m.id === modelo.id ? {...m, ...cambios} : m));
            return true;
        }catch{
            avisar('No se pudo actualizar el modelo', {error:true});
            return false;
        }
    }

    // Despublicar es reversible: se hace sin preguntar y se ofrece deshacer
    async function alternarPublicado(modelo:ModeloCasa){
        const despublicando = modelo.activo;
        if(await cambiar(modelo, {activo: !modelo.activo}) && despublicando){
            avisar(`«${modelo.nombreModelo}» pasó a borrador y ya no se ve en el catálogo. Sus solicitudes se conservan.`,
                {accion: {texto:'Deshacer', alHacer: () => cambiar(modelo, {activo:true})}});
        }
    }

    function duplicar(modelo:ModeloCasa){
        return confirmar({
            titulo:`Duplicar «${modelo.nombreModelo}»`,
            mensaje:'La copia queda como borrador, con los mismos datos, características y fotos.',
            boton:'Duplicar',
            campo:{etiqueta:'Nombre del nuevo modelo', inicial:`${modelo.nombreModelo} (copia)`},
            // Se llama con el diálogo abierto: un nombre repetido (409) se muestra ahí mismo y se puede corregir
            accion: async (nombre) => {
                try{
                    const copia = await duplicarModeloCasa(modelo.id, nombre);
                    router.push(`/admin/modelosCasa/${copia.id}`);
                }catch(err){
                    return mensajeError(err, 'No se pudo duplicar el modelo');
                }
            },
        });
    }

    async function eliminar(modelo:ModeloCasa){
        const confirmado = await confirmar({
            titulo:`Eliminar «${modelo.nombreModelo}»`,
            mensaje:<>
                <p>Se borra definitivamente, con sus fotos y métricas. <strong>No se puede deshacer.</strong></p>
                <p>Si solo quieres sacarlo del catálogo, despublícalo. Un modelo con solicitudes de clientes no se puede eliminar.</p>
            </>,
            boton:'Eliminar definitivamente',
            peligroso:true,
            campo:{etiqueta:`Escribe «${modelo.nombreModelo}» para confirmar`},
            accion: async (texto) => {
                if(texto !== modelo.nombreModelo) return 'El nombre no coincide.';
                try{
                    await eliminarModeloCasa(modelo.id);
                }catch(err){
                    return mensajeError(err, 'No se pudo eliminar el modelo');
                }
            },
        });
        if(confirmado === null) return;
        setModelos((lista) => lista.filter((m) => m.id !== modelo.id));
        avisar(`«${modelo.nombreModelo}» fue eliminado.`);
    }

    if(cargando){
        return <main className="max-w-3xl mx-auto px-4 py-10">Cargando... </main>
    }

    return(
        <main className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Modelos de casa</h1>
                <Link href="/admin/modelosCasa/nuevo" className='text-sm underline'> Crear modelo</Link>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            {modelos.length === 0 ? (
                <p className="text-gray-500">No hay modelos de casa disponibles.</p>
            ):(
                <div className="flex flex-col divide-y border rounded-xl">
                    {modelos.map((modelo)=>(
                        <div key={modelo.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <div className="flex items-center gap-3">
                                {modelo.imgPrincipal && (
                                    <img src={modelo.imgPrincipal} alt=""
                                        className={`w-14 h-14 object-cover rounded-lg border ${modelo.activo ? '' : 'opacity-50'}`}
                                    />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {modelo.nombreModelo}
                                        {!modelo.activo && <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Borrador</span>}
                                        {modelo.activo && modelo.proyecto && !modelo.proyecto.activo && (
                                            <span className="ml-2 text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded">Proyecto despublicado: no se ve en el catálogo</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500">{modelo.proyecto?.nombre}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {/* El estado lo calculan las reservas; aquí solo se muestra */}
                                <span className="text-sm text-gray-600" title={ETIQUETA_ESTADO[modelo.estado]}>
                                    {modelo.unidades != null ? `${unidadesDisponibles(modelo)} de ${modelo.unidades} disponibles` : ETIQUETA_ESTADO[modelo.estado]}
                                </span>
                                <Link href={`/admin/modelosCasa/${modelo.id}`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Editar
                                </Link>
                                <Link href={`/admin/modelosCasa/${modelo.id}/fotos`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Fotos
                                </Link>
                                <button type="button" onClick={() => duplicar(modelo)} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Duplicar
                                </button>
                                <button type="button" onClick={() => alternarPublicado(modelo)}
                                    className={`text-sm border rounded-lg px-3 py-1.5 ${modelo.activo ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                                    {modelo.activo ? 'Despublicar' : 'Publicar'}
                                </button>
                                <button type="button" onClick={() => eliminar(modelo)} className="text-sm text-red-600 px-2 py-1.5 hover:underline">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
