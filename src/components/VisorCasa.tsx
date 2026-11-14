'use client';

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps } from "react";
import Visor3D from "./Visor3D";
import { avisar } from "./Dialogos";

// three.js solo se descarga si la persona entra al recorrido.
const RecorridoInterior = dynamic(() => import("./RecorridoInterior"), { ssr: false });

// Donde hay WebXR (Android con Chrome) el botón de RA muestra la casa alrededor de la persona.
// En iPhone no hay WebXR, así que se mantiene la RA exterior de Quick Look.
export default function VisorCasa(props: ComponentProps<typeof Visor3D>) {
    const [interior, setInterior] = useState(false);
    const [soportaAr, setSoportaAr] = useState(false);
    const [sesionAr, setSesionAr] = useState<XRSession | null>(null);
    const [capaAr, setCapaAr] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        navigator.xr?.isSessionSupported('immersive-ar').then(setSoportaAr, () => {});
    }, []);

    // La sesión se pide en el mismo toque porque el navegador no abre la cámara sin un gesto reciente.
    async function entrarAr() {
        try {
            const sesion = await navigator.xr!.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'anchors'],
                domOverlay: { root: capaAr! },
            });
            // Al salir se queda en el recorrido. Volver a model-viewer en ese momento hacía caer la pestaña.
            sesion.addEventListener('end', () => { setSesionAr(null); setInterior(true); });
            setSesionAr(sesion);
        } catch {
            avisar('No se pudo abrir la cámara. Revisa que el navegador tenga permiso para usarla.', { error: true });
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <div role="group" aria-label="Modo de vista" className="grid grid-cols-2 gap-1 rounded-lg border p-1 text-sm font-medium">
                {[false, true].map((modo) => (
                    <button key={String(modo)} type="button" aria-pressed={interior === modo} onClick={() => setInterior(modo)}
                        className={`rounded-md py-2 ${interior === modo ? 'bg-marca text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                        {modo ? 'Recorrido interior' : 'Vista exterior'}
                    </button>
                ))}
            </div>
            {interior || sesionAr
                ? <RecorridoInterior modeloUrl={props.modeloUrl} titulo={props.titulo} altura={props.altura}
                    sesionAr={sesionAr} capaAr={capaAr} />
                : <Visor3D {...props} alEntrarAr={soportaAr ? entrarAr : undefined} />}
            {/* Durante la RA el navegador muestra esta capa sobre la cámara. */}
            <div ref={setCapaAr} />
        </div>
    );
}
