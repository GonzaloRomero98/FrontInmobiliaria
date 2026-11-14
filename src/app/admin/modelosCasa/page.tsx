'use client'

import { actualizarModeloCasa, duplicarModeloCasa, eliminarModeloCasa, getModelosAdmin } from "@/services/modeloCasa.service";
import { ETIQUETA_ESTADO, ModeloCasa } from "@/types/modeloCasa"
import { unidadesDisponibles } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { avisar, confirmar } from "@/components/Dialogos";
import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";

const OPCION_MENU = "block w-full text-left text-sm px-4 py-2 hover:bg-gray-50";

// Se usa <details> porque ya funciona con clic, Enter y Espacio sin programar el teclado.
function MenuMas({ children }: { children: ReactNode }) {
    return (
        <details className="relative">
            <summary className="list-none cursor-pointer text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                Más<span className="sr-only"> acciones</span>
            </summary>
            <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg py-1 z-10">{children}</div>
        </details>
    );
}

function cerrarMenu(e: React.MouseEvent<HTMLElement>) {
    const menu = e.currentTarget.closest('details');
    if (menu) menu.open = false;
}

export default function ListadoModelosCasa(){
    const [modelos, setModelos] = useState<ModeloCasa[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [idProyecto, setIdProyecto] = useState('');
    const router = useRouter();

    useEffect(()=>{
        getModelosAdmin().then(setModelos).catch(()=> setError('No se pudieron cargar los modelos')).finally(()=> setCargando(false));
    },[]);

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

    // Despublicar se puede revertir, por eso no se pide confirmación y se ofrece Deshacer.
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

    // La lista del admin llega completa, así que la búsqueda y el filtro se hacen en el navegador.
    const proyectos = [...new Map(modelos.filter((m) => m.proyecto).map((m) => [m.proyecto.id, m.proyecto.nombre])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'));
    const termino = busqueda.trim().toLocaleLowerCase('es');
    const visibles = modelos.filter((m) =>
        (!idProyecto || m.proyecto?.id === idProyecto) && (!termino || m.nombreModelo.toLocaleLowerCase('es').includes(termino)));

    return(
        <main className="max-w-3xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Modelos de casa</h1>
                <Link href="/admin/modelosCasa/nuevo" className="bg-marca text-white text-sm rounded-lg px-4 py-2 font-medium hover:bg-marca/90">Crear modelo</Link>
            </div>
            {error && <p className="text-red-700">{error}</p>}
            {modelos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} maxLength={100}
                        placeholder="Buscar por nombre" aria-label="Buscar modelos por nombre"
                        className="flex-1 min-w-48 border rounded-lg px-3 py-2" />
                    <select value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)} aria-label="Filtrar por proyecto"
                        className="border rounded-lg px-3 py-2 bg-white">
                        <option value="">Todos los proyectos</option>
                        {proyectos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
                    </select>
                </div>
            )}
            {modelos.length === 0 ? (
                <p className="text-gray-500">No hay modelos de casa disponibles.</p>
            ) : visibles.length === 0 ? (
                <p className="text-gray-500">Ningún modelo coincide con la búsqueda.</p>
            ):(
                <div className="flex flex-col divide-y border rounded-xl">
                    {visibles.map((modelo)=>(
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
                                <span className="text-sm text-gray-600" title={ETIQUETA_ESTADO[modelo.estado]}>
                                    {modelo.unidades != null ? `${unidadesDisponibles(modelo)} de ${modelo.unidades} disponibles` : ETIQUETA_ESTADO[modelo.estado]}
                                </span>
                                <Link href={`/admin/modelosCasa/${modelo.id}`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Editar
                                </Link>
                                <Link href={`/admin/modelosCasa/${modelo.id}/fotos`} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-gray-50">
                                    Fotos
                                </Link>
                                <button type="button" onClick={() => alternarPublicado(modelo)}
                                    className={`text-sm border rounded-lg px-3 py-1.5 ${modelo.activo ? 'hover:bg-gray-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                                    {modelo.activo ? 'Despublicar' : 'Publicar'}
                                </button>
                                <MenuMas>
                                    <button type="button" onClick={(e) => { cerrarMenu(e); duplicar(modelo); }} className={OPCION_MENU}>
                                        Duplicar
                                    </button>
                                    <button type="button" onClick={(e) => { cerrarMenu(e); eliminar(modelo); }} className={`${OPCION_MENU} text-red-700`}>
                                        Eliminar
                                    </button>
                                </MenuMas>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}
