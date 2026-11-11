import { ReactNode } from "react";
import PanelLayout from "@/components/panel/PanelLayout";

// proxy.ts ya garantiza que aquí solo entra el ADMIN
export default function AdminLayout({ children }: { children: ReactNode }) {
    return <PanelLayout rol="ADMIN">{children}</PanelLayout>;
}
