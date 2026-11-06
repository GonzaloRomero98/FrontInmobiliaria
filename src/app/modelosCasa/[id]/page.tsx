import type { Metadata } from "next";
import { cache } from "react";
import FormularioContacto from "@/components/FormularioContacto";
import QrAr from "@/components/QrAr";
import GaleriaModelo from "@/components/GaleriaModelo";
import BotonWhatsApp from "@/components/BotonWhatsApp";
import BotonComparar from "@/components/BotonComparar";
import SimuladorDividendo from "@/components/SimuladorDividendo";
import { getModeloCasaById } from "@/services/modeloCasa.service";
import { fechaUF, obtenerValorUF } from "@/lib/uf";
import { equivalencia, formatearCLP, formatearNumero, formatearPrecio, plural } from "@/lib/formato";
import { URL_SITIO } from "@/lib/sitio";
import { ETIQUETA_ESTADO, imagenesModelo } from "@/types/modeloCasa";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 60;

const obtenerModelo = cache(async (id: string) => {
    try {
        return await getModeloCasaById(id);
    } catch (err) {
        console.error("error: ", err);
        return null;
    }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const modelo = await obtenerModelo((await params).id);
    if (!modelo) return { title: 'Propiedad no encontrada' };
    const operacion = modelo.tipoOperacion === 'VENTA' ? 'en venta' : 'en arriendo';
    const descripcion = `${plural(modelo.dormitorios, 'dormitorio', 'dormitorios')}, ${plural(modelo.banos, 'baño', 'baños')}, ${formatearNumero(modelo.superficieConstruida)} m² ${operacion} en ${modelo.proyecto.ciudad.nombre}. ${formatearPrecio(modelo.precio, modelo.moneda)}. Recórrela en 3D.`;
    return {
        title: `${modelo.nombreModelo} · ${modelo.proyecto.nombre}`,
        description: descripcion,
        alternates: { canonical: `/modelosCasa/${modelo.id}` },
        openGraph: {
            title: `${modelo.nombreModelo} ${operacion} · ${formatearPrecio(modelo.precio, modelo.moneda)}`,
            description: descripcion,
            images: modelo.imgPrincipal ? [{ url: modelo.imgPrincipal, alt: modelo.nombreModelo }] : undefined,
        },
    };
}

export default async function DetallePropiedadID({params}:{params:Promise<{id:string}>;}){
    const { id } = await params;
    const modelo = await obtenerModelo(id);
    if (!modelo) notFound();

    const uf = await obtenerValorUF();
    const precio = Number(modelo.precio);
    const otraMoneda = equivalencia(precio, modelo.moneda, uf?.valor ?? null);
    const urlActual = `${URL_SITIO}/modelosCasa/${modelo.id}`;

   return (
        <main className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <GaleriaModelo titulo={modelo.nombreModelo} modelo3dUrl={modelo.modelo3dUrl} imagenes={imagenesModelo(modelo)} />

                    <div>
                        <h1 className="text-3xl font-bold">
                            {modelo.nombreModelo}
                            {modelo.estado && modelo.estado !== 'DISPONIBLE' && (
                                <span className={`ml-3 align-middle text-sm font-semibold text-white px-2 py-1 rounded ${modelo.estado === 'VENDIDO' ? 'bg-gray-500' : 'bg-amber-700'}`}>
                                    {ETIQUETA_ESTADO[modelo.estado]}
                                </span>
                            )}
                        </h1>
                        <p>
                            <Link href={`/proyectos/${modelo.proyecto.id}`} className="underline">{modelo.proyecto.nombre}</Link>
                            , {modelo.proyecto.ciudad.nombre}, {modelo.proyecto.ciudad.region.nombre}
                        </p>
                        <p className="text-2xl font-bold mt-3 text-acento">{formatearPrecio(precio, modelo.moneda)}</p>
                        {otraMoneda && (
                            <p className="text-gray-600">
                                ≈ {otraMoneda} <span className="text-sm">(UF {formatearCLP(uf!.valor)} al {fechaUF(uf!)})</span>
                            </p>
                        )}
                        {modelo.gastosComunes && <p className="text-sm text-gray-600 mt-1">+ gastos comunes</p>}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-gray-700">
                            <span>{plural(modelo.dormitorios, 'dormitorio', 'dormitorios')}</span>
                            <span>{plural(modelo.banos, 'baño', 'baños')}</span>
                            {modelo.estacionamientos ? <span>{plural(modelo.estacionamientos, 'estacionamiento', 'estacionamientos')}</span> : null}
                            <span>{formatearNumero(modelo.superficieConstruida)} m² construidos</span>
                            <span>{formatearNumero(modelo.superficieTerreno)} m² de terreno</span>
                            {modelo.mascotas && <span>Acepta mascotas</span>}
                        </div>
                        {modelo.caracteristicas.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {modelo.caracteristicas.map((c) => (
                                    <span key={c.id} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                                        {c.nombre}
                                    </span>
                                ))}
                            </div>
                        )}
                        {modelo.proyecto.descripcion && (
                            <p className="mt-6 text-gray-700 leading-relaxed">{modelo.proyecto.descripcion}</p>
                        )}
                    </div>

                    {modelo.tipoOperacion === 'VENTA' && (
                        <SimuladorDividendo precio={precio} moneda={modelo.moneda} valorUF={uf?.valor ?? null} />
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <BotonWhatsApp mensaje={`Hola, me interesa el modelo ${modelo.nombreModelo} del proyecto ${modelo.proyecto.nombre} (${urlActual}).`} />
                    <BotonComparar idModelo={modelo.id} variante="completo" />
                    {modelo.modelo3dUrl && <QrAr urlPropiedad={urlActual}></QrAr>}
                    <div className="p-4 border rounded-xl">
                        <FormularioContacto idModeloCasa={modelo.id}></FormularioContacto>
                    </div>
                </div>
            </div>
        </main>
    );
}
