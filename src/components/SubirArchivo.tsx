'use client'

import { useRef, useState } from "react"
import { Box } from "lucide-react";
import ZonaSubida, { FilaArchivo, MensajeError } from "./ZonaSubida";

const tamañoMaximo = 100*1024*1024;

interface SubidaModelo3dProps{
    archivoSeleccionado:(archivo:File | null) => void;
    progreso?:number;
    subiendo?:boolean;
}

export default function SubidaModelo3d({archivoSeleccionado, progreso = 0, subiendo = false}:SubidaModelo3dProps){
    const inputRef = useRef<HTMLInputElement>(null);
    const [archivo, setArchivo] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const quitar = () => {
        setArchivo(null);
        archivoSeleccionado(null);
    };

    const elegir = (nuevo: File) => {
        setError(null);

        const extension = nuevo.name.split('.').pop()?.toLowerCase();

        if(extension !== 'glb' && extension !== 'gltf'){
            setError(`El archivo debe ser .glb o .gltf${extension && extension !== nuevo.name.toLowerCase() ? ` (elegiste un .${extension})` : ''}`);
            quitar();
            return;
        }

        if(nuevo.size > tamañoMaximo){
            setError('El modelo 3D no debe superar los 100 MB');
            quitar();
            return;
        }

        setArchivo(nuevo);
        archivoSeleccionado(nuevo);
    };

    return(
        <div className="flex flex-col gap-2">
            <input
                ref={inputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => {
                    const nuevo = e.target.files?.[0];
                    e.target.value = '';
                    if (nuevo) elegir(nuevo);
                }}
                disabled={subiendo}
                className="hidden"
            />
            {archivo ? (
                <div className="border border-gray-200 rounded-xl bg-white">
                    <FilaArchivo archivo={archivo} deshabilitado={subiendo} onCambiar={() => inputRef.current?.click()} onQuitar={quitar}>
                        <span className="size-12 shrink-0 rounded-lg bg-marca/10 text-marca flex items-center justify-center">
                            <Box className="size-6" aria-hidden />
                        </span>
                    </FilaArchivo>
                    {subiendo && (
                        <div className="px-3 pb-3 flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-marca">Subiendo modelo 3D… {Math.round(progreso)} %</span>
                            <div className="w-full h-1.5 rounded-full bg-marca/10">
                                <div className="h-1.5 rounded-full bg-marca transition-all" style={{width:`${progreso}%`}} />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <ZonaSubida
                    icono={Box}
                    queSubir="el modelo 3D"
                    ayuda="GLB o GLTF · máx. 100 MB"
                    error={error !== null}
                    deshabilitado={subiendo}
                    onElegir={() => inputRef.current?.click()}
                    onSoltar={elegir}
                />
            )}
            {error && <MensajeError>{error}</MensajeError>}
        </div>
    )
}
