'use client'

import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { crearCaracteristica, getCaracteristicas } from "@/services/caracteristica.service";
import { Caracteristica } from "@/types/caracteristicas";

export default function Caracteristicas(){
    const [caracteristicas, setCaracteristicas] = useState<Caracteristica[]>([]);
    const [nombre, setNombre] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        getCaracteristicas().then(setCaracteristicas).catch(()=> setError('No se pudieron cargar las características'));
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
        <main className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Características</h1>
                <p className="text-gray-500 text-sm">Comodidades que se pueden marcar en cada modelo de casa.</p>
            </div>

            <form onSubmit={agregar} className="flex gap-2">
                <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Piscina"
                    maxLength={150}
                    aria-label="Nombre de la característica"
                    className="flex-1 border rounded-lg px-3 py-2"
                />
                <button type="submit" disabled={guardando || !nombre.trim()} className="bg-marca text-white rounded-lg px-4 font-medium disabled:opacity-50">
                    {guardando ? 'Agregando...' : 'Agregar'}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {caracteristicas.length === 0 ? (
                <p className="text-gray-500">Todavía no hay caracteristicas.</p>
            ) : (
                <ul className="flex flex-wrap gap-2">
                    {caracteristicas.map((c) => (
                        <li key={c.id} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{c.nombre}</li>
                    ))}
                </ul>
            )}
        </main>
    )
}
