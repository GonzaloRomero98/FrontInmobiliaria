import type { Metadata } from "next";
import Cotizacion from "@/components/Cotizacion";
import { obtenerValorUF } from "@/lib/uf";

export const metadata: Metadata = { title: 'Cotización', robots: { index: false } };

// La UF se obtiene en el servidor (mindicador.cl, con caché); la solicitud la carga el cliente con el token
export default async function PaginaCotizacion({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const uf = await obtenerValorUF();
    return <Cotizacion idSolicitud={id} uf={uf} />;
}
