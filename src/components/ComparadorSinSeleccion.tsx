'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MAXIMO_COMPARAR, useComparador } from "@/lib/comparador";

export default function ComparadorSinSeleccion() {
    const { ids } = useComparador();
    const router = useRouter();

    useEffect(() => {
        if (ids.length > 0) router.replace(`/comparar?ids=${ids.join(',')}`);
    }, [ids, router]);

    return (
        <div className="p-8 border rounded-xl text-center flex flex-col items-center gap-3">
            <p className="text-gray-700">
                Elige hasta {MAXIMO_COMPARAR} modelos con el botón <strong>+ Comparar</strong> y míralos lado a lado,
                con su recorrido 3D.
            </p>
            <Link href="/buscar" className="bg-marca text-white rounded-lg px-5 py-2.5 font-medium">Buscar propiedades</Link>
        </div>
    );
}
