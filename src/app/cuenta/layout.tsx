import { ReactNode } from "react";
import { cookies } from "next/headers";
import PanelLayout from "@/components/panel/PanelLayout";

// /cuenta la ven ADMIN y SECRETARIO (lo exige proxy.ts): se muestra dentro del panel, con su menú.
export default async function CuentaLayout({ children }: { children: ReactNode }) {
    const rol = (await cookies()).get('rol_usuario')?.value;
    return <PanelLayout rol={rol}>{children}</PanelLayout>;
}
