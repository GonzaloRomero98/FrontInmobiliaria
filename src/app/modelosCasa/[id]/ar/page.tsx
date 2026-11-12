import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Visor3D from "@/components/Visor3D";
import { getModeloCasaById } from "@/services/modeloCasa.service";
import RegistrarEscaneo from "./RegistrarEscaneo";

// Destino del QR: la vista de RA directa. El navegador exige un toque para abrir la cámara,
// así que el botón "Ver en tu espacio" queda grande y a mano.
export const metadata: Metadata = {
    title: 'Ver en tu espacio (RA)',
    robots: { index: false },
};

export default async function VistaAR({ params, searchParams }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ src?: string }>;
}) {
    const { id } = await params;
    const modelo = await getModeloCasaById(id).catch(() => null);
    if (!modelo) notFound();
    if (!modelo.modelo3dUrl) redirect(`/modelosCasa/${id}`);
    const desdeQr = (await searchParams).src === 'qr';

    return (
        <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
            {desdeQr && <RegistrarEscaneo idModelo={modelo.id} />}
            <div>
                <h1 className="font-titulo text-2xl font-bold">{modelo.nombreModelo}</h1>
                <p className="text-gray-600">{modelo.proyecto.nombre}</p>
            </div>

            <Visor3D idModelo={modelo.id} modeloUrl={modelo.modelo3dUrl} titulo={modelo.nombreModelo}
                altura="65vh" botonArGrande />

            <ol className="text-sm text-gray-700 list-decimal pl-5 flex flex-col gap-1">
                <li>Toca <strong>Ver en tu espacio (AR)</strong>.</li>
                <li>Apunta la cámara al suelo y mueve el celular despacio hasta que aparezca la vivienda.</li>
                <li>Camina alrededor para verla a escala real.</li>
            </ol>
            <p className="text-xs text-gray-500">
                Si no ves el botón, tu dispositivo no es compatible con realidad aumentada: igual puedes girar el modelo con el dedo.
            </p>

            <Link href={`/modelosCasa/${modelo.id}`} className="text-center border rounded-lg py-2.5 font-medium hover:bg-gray-50">
                Ver ficha completa, precio y contacto
            </Link>
        </main>
    );
}
