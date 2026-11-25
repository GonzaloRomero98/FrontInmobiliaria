'use client'

import { useCallback, useRef, useState } from "react";
import { getDireccion } from "@/services/ubicacion.service";

// Cada clic en el mapa pide la dirección de ese punto. Si el admin hace otro clic antes de que llegue la respuesta,
// la respuesta vieja se descarta para no pisar la dirección del punto nuevo.
export function useDireccionDelMapa(alEncontrar: (direccion: string) => void) {
    const [buscando, setBuscando] = useState(false);
    const [aviso, setAviso] = useState<string | null>(null);
    const ultimoPedido = useRef(0);

    const buscar = useCallback(async (latitud: number, longitud: number) => {
        const pedido = ++ultimoPedido.current;
        setBuscando(true);
        setAviso(null);
        try {
            const direccion = await getDireccion(latitud, longitud);
            if (pedido !== ultimoPedido.current) return;
            if (direccion) alEncontrar(direccion);
            else setAviso('No hay una calle registrada en ese punto. Escribe la dirección.');
        } catch {
            if (pedido !== ultimoPedido.current) return;
            setAviso('No se pudo obtener la dirección. Escríbela a mano.');
        } finally {
            if (pedido === ultimoPedido.current) setBuscando(false);
        }
    }, [alEncontrar]);

    return { buscando, aviso, buscar };
}
