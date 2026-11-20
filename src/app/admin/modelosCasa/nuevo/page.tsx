import Link from "next/link";
import FormularioModeloCasa from "@/components/admin/FormularioModeloCasa";
import { PANEL_PAGINA } from "@/lib/estilos";

export default function NuevoModeloCasa(){
    return(
        <main className={PANEL_PAGINA}>
            <Link href="/admin/modelosCasa" className="text-sm text-gray-500 hover:underline">← Modelos de casa</Link>
            <h1 className="text-2xl font-bold mb-6">Crear modelo de casa</h1>
            <div className="max-w-2xl"><FormularioModeloCasa /></div>
        </main>
    )
}
