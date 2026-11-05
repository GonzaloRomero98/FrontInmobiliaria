'use client';

import { useEffect } from "react";

interface Visor3DProps {
    modeloUrl:string;
    titulo:string;
    altura?:number;
    rotarAutomatico?:boolean;
}

export default function Visor3D({modeloUrl,titulo, altura = 500, rotarAutomatico = true}:Visor3DProps){
    useEffect(()=>{
        import('@google/model-viewer');
    },[]);

    return(
        <model-viewer
        src={modeloUrl}
        alt={`Modelo 3D de ${titulo}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={rotarAutomatico || undefined}
        shadow-intensity="1"
        exposure="1"
        loading={altura < 500 ? 'lazy' : 'eager'}
        reveal="auto"
        style={{
            // relativo: el botón AR (position absolute) se ubica dentro del visor y no en la página
            position: 'relative',
            display: 'block',
            width: '100%',
            height: `${altura}px`,
            backgroundColor: '#f3f4f6',
            borderRadius: '12px',
        }}
        >
        <button
            slot="ar-button"
            style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: 'none',
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '10px 16px',
            fontWeight: 600,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
        >
            Ver en tu espacio (AR)
        </button>
        </model-viewer>
    );
}