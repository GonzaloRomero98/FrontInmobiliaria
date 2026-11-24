'use client';

import { BOTON_PRIMARIO } from "@/lib/estilos";
import { useEffect, useRef, useState } from "react";
import { registrarEventoModelo } from "@/services/metricas.service";
import { useMovimientoReducido } from "@/lib/movimiento";
import { CargandoVisor } from "./Esqueleto";

interface Visor3DProps {
    idModelo:string;
    modeloUrl:string;
    titulo:string;
    altura?:number | string;
    rotarAutomatico?:boolean;
    botonArGrande?:boolean;
    // Si se pasa, el botón de RA llama a esta función en vez de abrir la RA de model-viewer.
    alEntrarAr?:() => void;
}

export default function Visor3D({idModelo, modeloUrl, titulo, altura = 500, rotarAutomatico = true, botonArGrande = false, alEntrarAr}:Visor3DProps){
    const visor = useRef<HTMLElement>(null);
    const sinMovimiento = useMovimientoReducido();
    const [error, setError] = useState(false);
    const [cargado, setCargado] = useState(false);
    const [progreso, setProgreso] = useState(0);
    // model-viewer guarda el error en caché por URL, así que el reintento agrega un parámetro que S3 ignora.
    const [intento, setIntento] = useState(0);
    const src = intento ? `${modeloUrl}${modeloUrl.includes('?') ? '&' : '?'}reintento=${intento}` : modeloUrl;

    useEffect(()=>{
        // Si no baja el código del visor, se muestra el error en vez de dejar el esqueleto para siempre.
        import('@google/model-viewer').catch(() => setError(true));
    },[]);

    useEffect(()=>{
        const el = visor.current;
        const alFallar = () => setError(true);
        const alCargar = () => setCargado(true);
        const alAvanzar = (e: Event) => setProgreso((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
        el?.addEventListener('error', alFallar);
        el?.addEventListener('load', alCargar);
        el?.addEventListener('progress', alAvanzar);
        return () => {
            el?.removeEventListener('error', alFallar);
            el?.removeEventListener('load', alCargar);
            el?.removeEventListener('progress', alAvanzar);
        };
    },[]);

    function reintentar(){
        setError(false);
        setCargado(false);
        setProgreso(0);
        setIntento((i) => i + 1);
    }

    return(
        <div className="relative" aria-busy={!cargado && !error}>
        <model-viewer
        ref={visor}
        src={src}
        alt={`Modelo 3D de ${titulo}`}
        ar={!alEntrarAr}
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={(rotarAutomatico && !sinMovimiento) || undefined}
        shadow-intensity="1"
        exposure="1"
        loading={typeof altura === 'number' && altura < 500 ? 'lazy' : 'eager'}
        reveal="auto"
        style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            height: typeof altura === 'number' ? `${altura}px` : altura,
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
        }}
        >
        <button
            slot={alEntrarAr ? undefined : 'ar-button'}
            onClick={() => { registrarEventoModelo(idModelo, 'AR_INICIADA'); alEntrarAr?.(); }}
            style={botonArGrande ? {
                position: 'absolute', left: '50%', bottom: '20px', transform: 'translateX(-50%)',
                backgroundColor: 'var(--color-marca)', color: 'white', borderRadius: '9999px', border: 'none',
                padding: '16px 28px', fontSize: '1.05rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
            } : {
                backgroundColor: 'white', borderRadius: '8px', border: 'none', position: 'absolute',
                top: '16px', right: '16px', padding: '10px 16px', fontWeight: 600, boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
        >
            Ver en tu espacio (RA)
        </button>
        </model-viewer>
        {!cargado && !error && <CargandoVisor texto="Cargando modelo 3D" progreso={progreso} />}
        {error && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-100 p-6 text-center">
                <p className="font-medium text-gray-800">No se pudo cargar el modelo 3D.</p>
                <p className="text-sm text-gray-600">Revisa tu conexión e inténtalo de nuevo.</p>
                <button type="button" onClick={reintentar} className={`${BOTON_PRIMARIO} min-h-11 px-4`}>
                    Reintentar
                </button>
            </div>
        )}
        </div>
    );
}
