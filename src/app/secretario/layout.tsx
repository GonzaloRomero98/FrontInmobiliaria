import { ReactNode } from "react";
import { cookies } from "next/headers";
import PanelLayout from "@/components/panel/PanelLayout";

// Aquí entran ADMIN y SECRETARIO. El rol se lee en el servidor para que aparezca el menú correcto desde el inicio.
export default async function SecretarioLayout({ children }: { children: ReactNode }) {
    const rol = (await cookies()).get('rol_usuario')?.value;
    return <PanelLayout rol={rol}>{children}</PanelLayout>;
}
