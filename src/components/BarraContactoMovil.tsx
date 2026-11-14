'use client'

import { useEffect, useState } from "react";

// Solo se ve en el celular, donde el formulario queda muy abajo en la ficha.
// Se oculta cuando el formulario está en pantalla para no taparlo.
export default function BarraContactoMovil({ precio, detalle }: { precio: string; detalle: string }) {
    const [formularioVisible, setFormularioVisible] = useState(false);

    useEffect(() => {
        const formulario = document.getElementById('contacto');
        if (!formulario) return;
        const observador = new IntersectionObserver(([entrada]) => setFormularioVisible(entrada.isIntersecting));
        observador.observe(formulario);
        return () => observador.disconnect();
    }, []);

    if (formularioVisible) return null;

    return (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-titulo text-lg font-bold text-acento leading-tight truncate">{precio}</p>
                    <p className="text-xs text-gray-600 truncate">{detalle}</p>
                </div>
                <a href="#contacto" className="shrink-0 bg-marca text-white rounded-lg px-4 py-3 font-medium hover:bg-marca/90">
                    Solicitar información
                </a>
            </div>
        </div>
    );
}
