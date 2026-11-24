'use client'

import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { crearCaracteristica, getCaracteristicas } from "@/services/caracteristica.service";
import { Caracteristica } from "@/types/caracteristicas";
import { CargandoLista, Vacio } from "@/components/panel/Tablero";
import { NORMAL, PANEL_PAGINA, PANEL_PRIMARIO, SUPERFICIE, CAMPO_PANEL } from "@/lib/estilos";

export default function Caracteristicas(){
    const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>([]);
    const [cargando, setCargando] = useState(true);
    const [nombre, setNombre] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        getCaracteristicas().then(setCaracteristicas).catch(()=> setError('No se pudieron cargar las características')).finally(()=> setCargando(false));
    },[]);

    async function agregar(e:FormEvent){
        e.preventDefault();
        const limpio = nombre.trim();
        if(!limpio) return;
        setError(null);
        setGuardando(true);
        try{
            const nueva = await crearCaracteristica(limpio);
            setCaracteristicas((lista) => [...lista, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
            setNombre('');
        }catch(err){
            setError(isAxiosError(err) && err.response?.status === 409 ? 'Esa característica ya existe' : 'No se pudo crear la característica');
        }finally{
            setGuardando(false);
        }
    }

    return(
        <main className={`${PANEL_PAGINA} flex flex-col gap-6`}>
            <div>
                <h1 className="text-2xl font-bold">Características</h1>
                <p className="text-gray-600 text-sm">Comodidades que se pueden marcar en cada modelo de casa.</p>
            </div>

            <form onSubmit={agregar} className="flex flex-wrap items-end gap-2 max-w-xl">
                <label className="flex flex-col gap-1 flex-1 min-w-56 text-sm font-medium text-gray-800">
                    Nueva característica
                    <input
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Piscina"
                        maxLength={150}
                        className={CAMPO_PANEL}
                    />
                </label>
                <button type="submit" disabled={guardando || !nombre.trim()} className={`${PANEL_PRIMARIO} ${NORMAL}`}>
                    {guardando ? 'Agregando...' : 'Agregar'}
                </button>
            </form>
            {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}

            {cargando ? (
                <CargandoLista filas={1} alto="h-24" etiqueta="Cargando características" />
            ) : caracteristicas.length === 0 ? (
                !error && <Vacio texto="Todavía no hay características. Agrega la primera con el campo de arriba." />
            ) : (
                <ul className={`${SUPERFICIE} p-5 flex flex-wrap gap-2`}>
                    {caracteristicas.map((c) => (
                        <li key={c.id} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{c.nombre}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}
