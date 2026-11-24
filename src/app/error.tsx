'use client';

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos";
import { useEffect } from "react";
import Link from "next/link";

// Se muestra cuando una página no pudo cargar, por ejemplo si la API no responde. Mantiene el encabezado y permite reintentar.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="max-w-xl mx-auto px-4 py-20 flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold">No pudimos cargar esta página</h1>
            <p className="text-gray-600">
                El servicio no está disponible en este momento. Intenta de nuevo en unos segundos.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => retry()} className={`${BOTON_PRIMARIO} min-h-12 px-5`}>
                    Reintentar
                </button>
                <Link href="/" className={`${BOTON_SECUNDARIO} min-h-12 px-5`}>Ir al inicio</Link>
            </div>
        </main>
    );
}
