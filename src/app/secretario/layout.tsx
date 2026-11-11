import { ReactNode } from "react";
import { cookies } from "next/headers";
import PanelLayout from "@/components/panel/PanelLayout";

// ADMIN y SECRETARIO entran aquí: el rol (cookie) decide qué secciones muestra el menú, sin parpadeo al cargar
export default async function SecretarioLayout({ children }: { children: ReactNode }) {
    const rol = (await cookies()).get('rol_usuario')?.value;
    return <PanelLayout rol={rol}>{children}</PanelLayout>;
}
