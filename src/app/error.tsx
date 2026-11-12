'use client';

import { useEffect } from "react";
import Link from "next/link";

// Cualquier página que no pudo cargar (p. ej. la API no responde): aviso y reintento, sin perder el encabezado
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
                <button type="button" onClick={() => retry()} className="bg-marca text-white rounded-lg px-5 py-2.5 font-medium">
                    Reintentar
                </button>
                <Link href="/" className="border rounded-lg px-5 py-2.5 font-medium">Ir al inicio</Link>
            </div>
        </main>
    );
}
