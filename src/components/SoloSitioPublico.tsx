'use client'

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// El encabezado y el pie del sitio no van dentro del panel (admin y secretario), que tiene su propio menú
export default function SoloSitioPublico({ children }: { children: ReactNode }) {
    const ruta = usePathname();
    return ruta.startsWith('/admin') || ruta.startsWith('/secretario') ? null : children;
}
