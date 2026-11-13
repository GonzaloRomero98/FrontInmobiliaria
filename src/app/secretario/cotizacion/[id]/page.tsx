import type { Metadata } from "next";
import Cotizacion from "@/components/Cotizacion";
import { obtenerValorUF } from "@/lib/uf";

export const metadata: Metadata = { title: 'Cotización', robots: { index: false } };

// La UF se obtiene en el servidor (mindicador.cl, con caché); la solicitud la carga el cliente con el token.
// ?folio=<id de la cotización> abre una ya emitida para reimprimirla con sus valores guardados.
export default async function PaginaCotizacion({ params, searchParams }: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ folio?: string }>;
}) {
    const { id } = await params;
    const { folio } = await searchParams;
    const uf = await obtenerValorUF();
    return <Cotizacion idSolicitud={id} idCotizacion={folio} uf={uf} />;
}
