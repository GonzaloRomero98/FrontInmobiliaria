'use client'

import { actualizarModeloCasa, duplicarModeloCasa, getModelosAdmin } from "@/services/modeloCasa.service";
import { ETIQUETA_ESTADO, ModeloCasa } from "@/types/modeloCasa"
import { unidadesDisponibles } from "@/lib/formato";
import { useEffect, useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

export default function ListadoModelosCasa(){
    const [modelos, setModelos] = useState<ModeloCasa[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const router = useRouter();

    useEffect(()=>{
        getModelosAdmin().then(setModelos).catch(()=> setError('No se pudo cargar los modelos')).finally(()=> setCargando(false));
    },[]);

    async function cambiar(modelo:ModeloCasa, cambios:{activo:boolean}){
        setError(null);
        try{
            await actualizarModeloCasa(modelo.id, cambios);
            setModelos((lista) => lista.map((m) => m.id === modelo.id ? {...m, ...cambios} : m));
        }catch{
            setError('No se pudo actualizar el modelo');
        }
    }

    function alternarPublicado(modelo:ModeloCasa){
        if(modelo.activo && !confirm(`¿Despublicar "${modelo.nombreModelo}"? Pasará a borrador y dejará de verse en el catálogo; sus solicitudes se conservan.`)) return;
        cambiar(modelo, {activo: !modelo.activo});
    }

    async function duplicar(modelo:ModeloCasa){
        const nombre = prompt('Nombre del nuevo modelo (la copia queda como borrador):', `${modelo.nombreModelo} (copia)`)?.trim();
        if(!nombre) return;
        setError(null);
        try{
            const copia = await duplicarModeloCasa(modelo.id, nombre);
            router.push(`/admin/modelosCasa/${copia.id}`);
        }catch(err){
            // Se muestra en un aviso: el mensaje de arriba de la lista no se ve si se duplicó desde más abajo
            const mensaje = isAxiosError(err) ? err.response?.data?.message : null;
            alert(Array.isArray(mensaje) ? mensaje.join('. ') : mensaje ?? 'No se pudo duplicar el modelo');
        }
    }

    if(cargando){
        return <main className="max-w-3xl mx-auto px-4 py-10">Cargando... </main>
    }

    return(
        <main className="max-w-3xl mx-auto px-4 py-10">
            <Link href="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>
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
                                    {unidadesDisponibles(modelo)} de {modelo.unidades} disponibles
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
