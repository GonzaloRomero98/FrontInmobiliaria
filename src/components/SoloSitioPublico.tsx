'use client'

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function SoloSitioPublico({ children }: { children: ReactNode }) {
    const ruta = usePathname();
    return ruta.startsWith('/admin') || ruta.startsWith('/secretario') ? null : children;
}
