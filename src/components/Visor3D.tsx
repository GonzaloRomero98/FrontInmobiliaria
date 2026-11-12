'use client';

import { useEffect, useRef, useState } from "react";
import { registrarEventoModelo } from "@/services/metricas.service";

interface Visor3DProps {
    idModelo:string;
    modeloUrl:string;
    titulo:string;
    // px, o cualquier alto CSS (p. ej. '70vh')
    altura?:number | string;
    rotarAutomatico?:boolean;
    botonArGrande?:boolean;
}

export default function Visor3D({idModelo, modeloUrl, titulo, altura = 500, rotarAutomatico = true, botonArGrande = false}:Visor3DProps){
    const visor = useRef<HTMLElement>(null);
    const [error, setError] = useState(false);
    // model-viewer guarda en caché el fallo por URL: el reintento pide la misma URL con otro parámetro (S3 lo ignora)
    const [intento, setIntento] = useState(0);
    const src = intento ? `${modeloUrl}${modeloUrl.includes('?') ? '&' : '?'}reintento=${intento}` : modeloUrl;

    useEffect(()=>{
        import('@google/model-viewer');
    },[]);

    useEffect(()=>{
        const el = visor.current;
        const alFallar = () => setError(true);
        el?.addEventListener('error', alFallar);
        return () => el?.removeEventListener('error', alFallar);
    },[]);

    function reintentar(){
        setError(false);
        setIntento((i) => i + 1);
    }

    return(
        <div className="relative">
        <model-viewer
        ref={visor}
        src={src}
        alt={`Modelo 3D de ${titulo}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={rotarAutomatico || undefined}
        shadow-intensity="1"
        exposure="1"
        loading={typeof altura === 'number' && altura < 500 ? 'lazy' : 'eager'}
        reveal="auto"
        style={{
            // relativo: el botón AR (position absolute) se ubica dentro del visor y no en la página
            position: 'relative',
            display: 'block',
            width: '100%',
            height: typeof altura === 'number' ? `${altura}px` : altura,
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
        }}
        >
        {/* model-viewer solo muestra este botón si el dispositivo puede abrir la RA */}
        <button
            slot="ar-button"
            onClick={() => registrarEventoModelo(idModelo, 'AR_INICIADA')}
            style={botonArGrande ? {
                position: 'absolute', left: '50%', bottom: '20px', transform: 'translateX(-50%)',
                backgroundColor: '#16304b', color: 'white', borderRadius: '9999px', border: 'none',
                padding: '16px 28px', fontSize: '1.05rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
            } : {
                backgroundColor: 'white', borderRadius: '8px', border: 'none', position: 'absolute',
                top: '16px', right: '16px', padding: '10px 16px', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
        >
            Ver en tu espacio (AR)
        </button>
        </model-viewer>
        {error && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-100 p-6 text-center">
                <p className="font-medium text-gray-800">No se pudo cargar el modelo 3D.</p>
                <p className="text-sm text-gray-600">Revisa tu conexión e inténtalo de nuevo.</p>
                <button type="button" onClick={reintentar} className="bg-marca text-white rounded-lg px-4 py-2 font-medium">
                    Reintentar
                </button>
            </div>
        )}
        </div>
    );
}
