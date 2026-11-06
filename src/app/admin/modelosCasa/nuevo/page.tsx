import Link from "next/link";
import FormularioModeloCasa from "@/components/admin/FormularioModeloCasa";

export default function NuevoModeloCasa(){
    return(
        <main className="max-w-lg mx-auto px-4 py-10">
            <Link href="/admin/modelosCasa" className="text-sm text-gray-500 hover:underline">← Modelos de casa</Link>
            <h1 className="text-2xl font-bold mb-6">Crear modelo de casa</h1>
            <FormularioModeloCasa />
        </main>
    )
}
