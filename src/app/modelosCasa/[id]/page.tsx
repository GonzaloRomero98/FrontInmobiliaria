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
import { equivalencia, formatearCLP, formatearNumero, formatearPrecio, plural, textoQuedan } from "@/lib/formato";
import { ChevronLeft } from "lucide-react";
import { URL_SITIO } from "@/lib/sitio";
import { ETIQUETA_ESTADO, ETIQUETA_TIPO_VIVIENDA, imagenesModelo } from "@/types/modeloCasa";
import EtapaEntrega from "@/components/EtapaEntrega";
import SalaVentas from "@/components/SalaVentas";
import Image from "next/image";
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

    const datos: [string, string][] = [
        ['Tipo', ETIQUETA_TIPO_VIVIENDA[modelo.tipoVivienda] ?? 'Casa'],
        ['Dormitorios', String(modelo.dormitorios)],
        ['Baños', String(modelo.banos)],
        ...(modelo.estacionamientos ? [['Estacionamientos', String(modelo.estacionamientos)] as [string, string]] : []),
        ['Construidos', `${formatearNumero(modelo.superficieConstruida)} m²`],
        ...(modelo.superficieTerreno != null ? [['Terreno', `${formatearNumero(modelo.superficieTerreno)} m²`] as [string, string]] : []),
        ...(modelo.mascotas ? [['Mascotas', 'Se aceptan'] as [string, string]] : []),
    ];

   return (
        <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 flex flex-col gap-6">
            <header>
                <Link href={`/proyectos/${modelo.proyecto.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-acento hover:underline">
                    <ChevronLeft size={16} aria-hidden="true" />{modelo.proyecto.nombre}
                </Link>
                <h1 className="text-3xl sm:text-4xl font-bold mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {modelo.nombreModelo}
                    {modelo.estado && modelo.estado !== 'DISPONIBLE' && (
                        <span className={`text-sm font-semibold text-white px-2 py-1 rounded ${modelo.estado === 'VENDIDO' ? 'bg-gray-600' : 'bg-amber-700'}`}>
                            {ETIQUETA_ESTADO[modelo.estado]}
                        </span>
                    )}
                </h1>
                <p className="text-gray-600 mt-1">{modelo.proyecto.ciudad.nombre}, {modelo.proyecto.ciudad.region.nombre}</p>
                <EtapaEntrega etapa={modelo.proyecto.etapa} fechaEntrega={modelo.proyecto.fechaEntrega} />
            </header>

            {/* Orden del DOM = orden en móvil: galería, precio, detalles, contacto. En escritorio, precio y contacto van a la derecha */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-10 items-start">
                <div className="lg:col-span-2">
                    <GaleriaModelo idModelo={modelo.id} titulo={modelo.nombreModelo} modelo3dUrl={modelo.modelo3dUrl} imagenes={imagenesModelo(modelo)} />
                </div>

                <section aria-label="Precio" className="border rounded-2xl p-5 flex flex-col gap-4 lg:col-start-3 lg:row-start-1">
                    <div>
                        <p className="text-sm text-gray-600">{modelo.tipoOperacion === 'VENTA' ? 'Precio de venta' : 'Arriendo mensual'}</p>
                        <p className="font-titulo text-3xl font-bold text-acento">{formatearPrecio(precio, modelo.moneda)}</p>
                        {otraMoneda && (
                            <p className="text-sm text-gray-600 mt-1">≈ {otraMoneda} · UF {formatearCLP(uf!.valor)} al {fechaUF(uf!)}</p>
                        )}
                        {modelo.gastosComunes != null && (
                            <p className="text-sm text-gray-600">Gastos comunes {formatearCLP(modelo.gastosComunes)} al mes</p>
                        )}
                    </div>
                    {/* unidades falta si la API aún no tiene la migración de reservas */}
                    {modelo.estado === 'DISPONIBLE' && modelo.unidades != null && (
                        <p className="text-sm font-medium text-gray-900">{textoQuedan(modelo)}</p>
                    )}
                    {(modelo.bono || modelo.subsidios?.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                            {modelo.bono && <span className="bg-acento-suave text-acento text-sm font-semibold px-3 py-1 rounded-full">{modelo.bono}</span>}
                            {modelo.subsidios?.map((s) => (
                                <span key={s} className="border border-gray-300 text-gray-700 text-sm px-3 py-1 rounded-full">Apto subsidio {s}</span>
                            ))}
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <a href="#contacto" className="bg-marca text-white rounded-lg py-3 text-center font-medium hover:bg-marca/90 transition-colors">
                            Solicitar información
                        </a>
                        <BotonWhatsApp mensaje={`Hola, me interesa el modelo ${modelo.nombreModelo} del proyecto ${modelo.proyecto.nombre} (${urlActual}).`} />
                        <BotonComparar idModelo={modelo.id} variante="completo" />
                    </div>
                    {/* En el celular el QR no sirve: el visor ya trae su botón de RA */}
                    {modelo.modelo3dUrl && (
                        <div className="hidden lg:block border-t pt-4">
                            <QrAr urlPropiedad={`${urlActual}/ar?src=qr`} />
                        </div>
                    )}
                </section>

                <div className="lg:col-span-2 flex flex-col gap-10">
                    <section className="flex flex-col gap-4" aria-labelledby="titulo-caracteristicas">
                        <h2 id="titulo-caracteristicas" className="text-xl font-bold">Características</h2>
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 border-y py-5">
                            {datos.map(([etiqueta, valor]) => (
                                <div key={etiqueta}>
                                    <dt className="text-sm text-gray-600">{etiqueta}</dt>
                                    <dd className="text-lg font-semibold text-gray-900 tabular-nums">{valor}</dd>
                                </div>
                            ))}
                        </dl>
                        {modelo.caracteristicas.length > 0 && (
                            <ul className="flex flex-wrap gap-2" aria-label="Equipamiento">
                                {modelo.caracteristicas.map((c) => (
                                    <li key={c.id} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{c.nombre}</li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {modelo.proyecto.descripcion && (
                        <section className="flex flex-col gap-3" aria-labelledby="titulo-proyecto">
                            <h2 id="titulo-proyecto" className="text-xl font-bold">Sobre el proyecto</h2>
                            <p className="text-gray-700 leading-relaxed max-w-prose">{modelo.proyecto.descripcion}</p>
                            <Link href={`/proyectos/${modelo.proyecto.id}`} className="text-sm font-medium text-acento hover:underline self-start">
                                Ver el proyecto, su ubicación y los demás modelos
                            </Link>
                        </section>
                    )}

                    {modelo.planoUrl && (
                        <section className="flex flex-col gap-3" aria-labelledby="titulo-plano">
                            <h2 id="titulo-plano" className="text-xl font-bold">Plano de planta</h2>
                            <a href={modelo.planoUrl} target="_blank" rel="noopener noreferrer" className="relative block w-full aspect-[4/3] border rounded-xl bg-white">
                                <Image src={modelo.planoUrl} alt={`Plano de planta del modelo ${modelo.nombreModelo}`} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-contain p-2" />
                            </a>
                            <p className="text-xs text-gray-600">Haz clic para ver el plano en tamaño completo.</p>
                        </section>
                    )}

                    {modelo.tipoOperacion === 'VENTA' && (
                        <SimuladorDividendo precio={precio} moneda={modelo.moneda} valorUF={uf?.valor ?? null} />
                    )}
                </div>

                <div className="flex flex-col gap-4 lg:col-start-3 lg:row-start-2 lg:sticky lg:top-6">
                    <section id="contacto" className="border rounded-2xl p-5 scroll-mt-6" aria-label="Formulario de contacto">
                        <FormularioContacto idModeloCasa={modelo.id} conVisita={!!modelo.proyecto.salaDireccion} />
                    </section>
                    <SalaVentas proyecto={modelo.proyecto} />
                </div>
            </div>
        </main>
    );
}
