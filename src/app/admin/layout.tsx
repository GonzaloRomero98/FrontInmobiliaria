import { ReactNode } from "react";
import PanelLayout from "@/components/panel/PanelLayout";

// Solo llega el ADMIN, porque proxy.ts ya revisa el rol antes.
export default function AdminLayout({ children }: { children: ReactNode }) {
    return <PanelLayout rol="ADMIN">{children}</PanelLayout>;
}
