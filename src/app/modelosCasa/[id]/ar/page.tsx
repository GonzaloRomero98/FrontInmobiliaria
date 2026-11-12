import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import VisorCasa from "@/components/VisorCasa";
import { getModeloCasaById } from "@/services/modeloCasa.service";
import RegistrarEscaneo from "./RegistrarEscaneo";

// Destino del QR: vista exterior con RA y recorrido interior. El navegador exige un toque para abrir
// la cámara, así que el botón "Ver en tu espacio" queda grande y a mano.
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

            <VisorCasa idModelo={modelo.id} modeloUrl={modelo.modelo3dUrl} titulo={modelo.nombreModelo}
                altura="65vh" botonArGrande />

            <ul className="text-sm text-gray-700 list-disc pl-5 flex flex-col gap-1">
                <li>
                    <strong>Vista exterior:</strong> toca <strong>Ver en tu espacio (AR)</strong>, apunta la cámara al suelo
                    y mueve el celular despacio hasta que aparezca la vivienda a escala real.
                </li>
                <li>
                    <strong>Recorrido interior:</strong> camina con el joystick y arrastra el dedo para mirar.
                    En computador: teclas WASD o flechas y arrastrar con el mouse.
                </li>
            </ul>
            <p className="text-xs text-gray-500">
                Si no ves el botón de AR, tu dispositivo no es compatible con realidad aumentada: igual puedes girar el modelo o recorrerlo por dentro.
            </p>

            <Link href={`/modelosCasa/${modelo.id}`} className="text-center border rounded-lg py-2.5 font-medium hover:bg-gray-50">
                Ver ficha completa, precio y contacto
            </Link>
        </main>
    );
}
