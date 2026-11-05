'use client'

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormularioModeloCasa from "@/components/admin/FormularioModeloCasa";
import { getModeloAdminById } from "@/services/modeloCasa.service";
import { ModeloCasa } from "@/types/modeloCasa";

export default function EditarModeloCasa(){
    const { id } = useParams<{ id: string }>();
    const [modelo, setModelo] = useState<ModeloCasa | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        getModeloAdminById(id).then(setModelo).catch(()=> setError('No se pudo cargar el modelo'));
    },[id]);

    if (error) return <main className="max-w-lg mx-auto px-4 py-10 text-red-500">{error}</main>;
    if (!modelo) return <main className="max-w-lg mx-auto px-4 py-10">Cargando...</main>;

    return(
        <main className="max-w-lg mx-auto px-4 py-10">
            <Link href="/admin/modelosCasa" className="text-sm text-gray-500 hover:underline">← Modelos de casa</Link>
            <div className="flex items-baseline justify-between gap-2 mb-6">
                <h1 className="text-2xl font-bold">Editar {modelo.nombreModelo}</h1>
                <Link href={`/admin/modelosCasa/${modelo.id}/fotos`} className="text-sm underline">Fotos</Link>
            </div>
            <FormularioModeloCasa modelo={modelo} />
        </main>
    )
}
