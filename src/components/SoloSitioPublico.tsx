'use client'

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function SoloSitioPublico({ children }: { children: ReactNode }) {
    const ruta = usePathname();
    return ['/admin', '/secretario', '/cuenta'].some((p) => ruta.startsWith(p)) ? null : children;
}
