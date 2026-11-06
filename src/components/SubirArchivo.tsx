'use client'

import { useState } from "react"

const tamañoMaximo = 100*1024*1024;

interface SubidaModelo3dProps{
    archivoSeleccionado:(archivo:File | null) => void;
    progreso?:number;
    subiendo?:boolean;
}

export default function SubidaModelo3d({archivoSeleccionado, progreso = 0, subiendo = false}:SubidaModelo3dProps){
    const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>)=>{
        const archivo = e.target.files?.[0] ?? null;
        setError(null);

        if(!archivo){
            setNombreArchivo(null);
            archivoSeleccionado(null);
            return;
        }

        const extension = archivo.name.split('.').pop()?.toLowerCase();
        
        if(extension !== 'glb' && extension !== 'gltf'){
            setError('El archivo debe ser .glb o gltf');
            archivoSeleccionado(null);
            e.target.value = '';
            return;
        }

        if(archivo.size > tamañoMaximo){
            setError('El modelo 3D no debe superar los 100MB')
            archivoSeleccionado(null)
            e.target.value = '';
            return;
        }

        setNombreArchivo(archivo.name);
        archivoSeleccionado(archivo);
    };

    return(
        <div className="flex flex-col gap-2">
            <input type="file"
            accept=".glb, .gltf"
            onChange={manejarCambio}
            disabled={subiendo}
            className="text-sm"
            />
            {nombreArchivo && <p className="text-sm text-gray-600">Archivo:{nombreArchivo}</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {subiendo &&(
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-marca h-2 rounded-full transition-all" style={{width:`${progreso}%`}}></div>
                </div>
            )}
        </div>
    )
}