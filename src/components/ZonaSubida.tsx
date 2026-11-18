'use client';

import { useState, type ReactNode } from "react";
import { CircleAlert, RefreshCw, Trash2, Upload, type LucideIcon } from "lucide-react";

const MB = 1024 * 1024;

export function formatoPeso(bytes: number) {
    if (bytes < MB) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / MB).toLocaleString('es-CL', { maximumFractionDigits: 1 })} MB`;
}

interface ZonaSubidaProps {
    icono: LucideIcon;
    queSubir: string;
    ayuda: string;
    error?: boolean;
    deshabilitado?: boolean;
    onElegir: () => void;
    onSoltar: (archivo: File) => void;
}

export default function ZonaSubida({ icono: Icono, queSubir, ayuda, error = false, deshabilitado = false, onElegir, onSoltar }: ZonaSubidaProps) {
    const [arrastrando, setArrastrando] = useState(false);

    const estilo = arrastrando
        ? 'border-solid border-marca bg-marca/10'
        : error
            ? 'border-dashed border-red-600 bg-red-50'
            : 'border-dashed border-gray-300 bg-white hover:border-marca';

    return (
        <button
            type="button"
            onClick={onElegir}
            disabled={deshabilitado}
            onDragOver={(e) => { e.preventDefault(); if (!deshabilitado) setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                const archivo = e.dataTransfer.files[0];
                if (archivo && !deshabilitado) onSoltar(archivo);
            }}
            // Los hijos no reciben eventos para que dragleave no salte al pasar sobre ellos.
            className={`w-full border-2 rounded-xl px-5 py-7 flex flex-col items-center gap-2.5 text-center transition-colors *:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:opacity-50 disabled:cursor-not-allowed ${estilo}`}
        >
            <span className={`size-12 rounded-full flex items-center justify-center ${arrastrando ? 'bg-marca text-white' : error ? 'bg-red-100 text-red-700' : 'bg-marca/10 text-marca'}`}>
                {arrastrando ? <Upload className="size-6" aria-hidden /> : <Icono className="size-6" aria-hidden />}
            </span>
            {arrastrando
                ? <span className="text-sm font-semibold text-marca">Suelta el archivo aquí</span>
                : <span className="text-sm text-gray-800">Arrastra {queSubir} aquí o <span className="font-semibold text-marca underline">elige un archivo</span></span>}
            <span className="text-xs text-gray-500">{ayuda}</span>
        </button>
    );
}

interface FilaArchivoProps {
    archivo: File;
    deshabilitado?: boolean;
    onCambiar: () => void;
    onQuitar: () => void;
    children?: ReactNode;
}

export function FilaArchivo({ archivo, deshabilitado = false, onCambiar, onQuitar, children }: FilaArchivoProps) {
    return (
        <div className={`flex items-center gap-3 p-3 ${deshabilitado ? 'opacity-60' : ''}`}>
            {children}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate" title={archivo.name}>{archivo.name}</p>
                <p className="text-xs text-gray-500">{formatoPeso(archivo.size)} · {archivo.name.split('.').pop()?.toUpperCase()}</p>
            </div>
            <button type="button" onClick={onCambiar} disabled={deshabilitado}
                className="h-10 px-3.5 border border-gray-300 rounded-lg text-sm font-medium text-marca flex items-center gap-1.5 hover:bg-gray-50 disabled:cursor-not-allowed">
                <RefreshCw className="size-4" aria-hidden /> Cambiar
            </button>
            <button type="button" onClick={onQuitar} disabled={deshabilitado}
                className="h-10 px-3 rounded-lg text-sm font-medium text-red-700 flex items-center gap-1.5 hover:bg-red-50 disabled:cursor-not-allowed">
                <Trash2 className="size-4" aria-hidden /> Quitar
            </button>
        </div>
    );
}

export function MensajeError({ children }: { children: ReactNode }) {
    return (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-700">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {children}
        </p>
    );
}
