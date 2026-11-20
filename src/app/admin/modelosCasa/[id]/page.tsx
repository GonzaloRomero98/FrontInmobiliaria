'use client'

import Link from "next/link";
import { CargandoLista } from "@/components/panel/Tablero";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import FormularioModeloCasa from "@/components/admin/FormularioModeloCasa";
import { getModeloAdminById } from "@/services/modeloCasa.service";
import { ModeloCasa } from "@/types/modeloCasa";
import { PANEL_PAGINA } from "@/lib/estilos";

export default function EditarModeloCasa(){
    const { id } = useParams<{ id: string }>();
    const [modelo, setModelo] = useState<ModeloCasa | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(()=>{
        getModeloAdminById(id).then(setModelo).catch(()=> setError('No se pudo cargar el modelo'));
    },[id]);

    if (error) return <main className={`${PANEL_PAGINA} text-red-700`}>{error}</main>;
    if (!modelo) return <main className={PANEL_PAGINA}><Link href="/admin/modelosCasa" className="text-sm text-gray-600 hover:underline">← Modelos de casa</Link><div className="max-w-2xl mt-4"><CargandoLista filas={3} alto="h-40" etiqueta="Cargando el modelo" /></div></main>;

    return(
        <main className={PANEL_PAGINA}>
            <Link href="/admin/modelosCasa" className="text-sm text-gray-500 hover:underline">← Modelos de casa</Link>
            <div className="max-w-2xl flex items-baseline justify-between gap-2 mb-6">
                <h1 className="text-2xl font-bold">Editar {modelo.nombreModelo}</h1>
                <Link href={`/admin/modelosCasa/${modelo.id}/fotos`} className="text-sm text-acento underline">Fotos</Link>
            </div>
            <div className="max-w-2xl"><FormularioModeloCasa modelo={modelo} /></div>
        </main>
    )
}
