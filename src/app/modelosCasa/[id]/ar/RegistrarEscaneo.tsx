'use client';

import { useEffect, useRef } from "react";
import { registrarEventoModelo } from "@/services/metricas.service";

export default function RegistrarEscaneo({ idModelo }: { idModelo: string }) {
    // Evita contar el escaneo dos veces cuando React ejecuta el efecto doble en desarrollo.
    const registrado = useRef(false);
    useEffect(() => {
        if (registrado.current) return;
        registrado.current = true;
        registrarEventoModelo(idModelo, 'QR_ESCANEADO');
    }, [idModelo]);
    return null;
}
