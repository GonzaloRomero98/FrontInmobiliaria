'use client'

import { actualizarModeloCasa, duplicarModeloCasa, eliminarModeloCasa, getModelosAdmin } from "@/services/modeloCasa.service";
import { ETIQUETA_ESTADO, ModeloCasa } from "@/types/modeloCasa"
import { unidadesDisponibles } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { avisar, confirmar } from "@/components/Dialogos";
import { type ReactNode, useEffect, useState } from "react"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CargandoLista, Vacio } from "@/components/panel/Tablero";
import { COMPACTO, NORMAL, PANEL_EXITO, PANEL_PAGINA, PANEL_PRIMARIO, PANEL_SECUNDARIO, PILDORA, SUPERFICIE, TONO, CAMPO_PANEL } from "@/lib/estilos";

const OPCION_MENU = "flex items-center w-full min-h-10 max-md:min-h-11 text-left text-sm px-4 py-2 hover:bg-gray-50";

// Se usa <details> porque ya funciona con clic, Enter y Espacio sin programar el teclado.
function MenuMas({ children }: { children: ReactNode }) {
    return (
        <details className="relative">
            <summary className={`list-none cursor-pointer ${PANEL_SECUNDARIO} ${COMPACTO} [&::-webkit-details-marker]:hidden`}>
                Más<span className="sr-only"> acciones</span>
            </summary>
            <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-10">{children}</div>
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

    // La lista del admin llega completa, así que la búsqueda y el filtro se hacen en el navegador.
    const proyectos = [...new Map(modelos.filter((m) => m.proyecto).map((m) => [m.proyecto.id, m.proyecto.nombre])).entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'es'));
    const termino = busqueda.trim().toLocaleLowerCase('es');
    const visibles = modelos.filter((m) =>
        (!idProyecto || m.proyecto?.id === idProyecto) && (!termino || m.nombreModelo.toLocaleLowerCase('es').includes(termino)));

    return(
        <main className={PANEL_PAGINA}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Modelos de casa</h1>
                <Link href="/admin/modelosCasa/nuevo" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Crear modelo</Link>
            </div>
            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
            {modelos.length > 0 && (
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <label className="flex flex-col gap-1 flex-1 min-w-48 sm:max-w-sm text-sm font-medium text-gray-800">
                        Buscar modelo
                        <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} maxLength={100}
                            placeholder="Nombre del modelo"
                            className={CAMPO_PANEL} />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-800">
                        Proyecto
                        <select value={idProyecto} onChange={(e) => setIdProyecto(e.target.value)}
                            className={CAMPO_PANEL}>
                            <option value="">Todos los proyectos</option>
                            {proyectos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
                        </select>
                    </label>
                </div>
            )}
            {cargando ? (
                <CargandoLista etiqueta="Cargando modelos" />
            ) : modelos.length === 0 ? (
                !error && (
                    <Vacio texto="Todavía no hay modelos de casa.">
                        <Link href="/admin/modelosCasa/nuevo" className={`${PANEL_PRIMARIO} ${NORMAL}`}>Crear el primer modelo</Link>
                    </Vacio>
                )
            ) : visibles.length === 0 ? (
                <Vacio texto="Ningún modelo coincide con la búsqueda." />
            ):(
                <div className={`${SUPERFICIE} flex flex-col divide-y divide-gray-200`}>
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
                                        {!modelo.activo && <span className={`ml-2 ${PILDORA} ${TONO.neutro}`}>Borrador</span>}
                                        {modelo.activo && modelo.proyecto && !modelo.proyecto.activo && (
                                            <span className={`ml-2 ${PILDORA} ${TONO.aviso} max-sm:whitespace-normal`}>Proyecto despublicado: no se ve en el catálogo</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600">{modelo.proyecto?.nombre}</p>
                                </div>
                            </div>
                            {/* Editar es lo que más se hace. Un borrador muestra además Publicar, que es su siguiente paso. */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-600" title={ETIQUETA_ESTADO[modelo.estado]}>
                                    {unidadesDisponibles(modelo)} de {modelo.unidades} disponibles
                                </span>
                                {!modelo.activo && (
                                    <button type="button" onClick={() => alternarPublicado(modelo)} className={`${PANEL_EXITO} ${COMPACTO}`}>
                                        Publicar<span className="sr-only"> {modelo.nombreModelo}</span>
                                    </button>
                                )}
                                <Link href={`/admin/modelosCasa/${modelo.id}`} className={`${PANEL_PRIMARIO} ${COMPACTO}`}>
                                    Editar<span className="sr-only"> {modelo.nombreModelo}</span>
                                </Link>
                                <MenuMas>
                                    <Link href={`/admin/modelosCasa/${modelo.id}/fotos`} className={OPCION_MENU}>
                                        Fotos
                                    </Link>
                                    {modelo.activo && (
                                        <button type="button" onClick={(e) => { cerrarMenu(e); alternarPublicado(modelo); }} className={OPCION_MENU}>
                                            Despublicar
                                        </button>
                                    )}
                                    <button type="button" onClick={(e) => { cerrarMenu(e); duplicar(modelo); }} className={OPCION_MENU}>
                                        Duplicar
                                    </button>
                                    <button type="button" onClick={(e) => { cerrarMenu(e); eliminar(modelo); }} className={`${OPCION_MENU} text-red-700 border-t border-gray-100`}>
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
