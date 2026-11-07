'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import EtapaEntrega from "@/components/EtapaEntrega";
import { calcularCredito } from "@/lib/hipotecario";
import { equivalencia, formatearCLP, formatearNumero, formatearPrecio, plural } from "@/lib/formato";
import { fechaUF, type ValorUF } from "@/lib/uf";
import { getSolicitud, Solicitud } from "@/services/solicitud.service";
import { ETIQUETA_ESTADO, ETIQUETA_TIPO_VIVIENDA } from "@/types/modeloCasa";

const fecha = (d: Date) => d.toLocaleDateString('es-CL');

// Al imprimir solo queda la hoja: sin encabezado/pie del sitio ni panel, y con los colores de fondo
const ESTILO_IMPRESION = `
@page { size: A4; margin: 14mm; }
@media print {
  header, footer, .no-imprimir { display: none !important; }
  main { padding: 0 !important; max-width: none !important; }
  .hoja { border: none !important; box-shadow: none !important; padding: 0 !important; }
}
.hoja, .hoja * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

function Fila({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string | null }) {
    return (
        <div className="flex justify-between gap-4 py-2 border-b last:border-b-0">
            <dt className="text-gray-600">{etiqueta}</dt>
            <dd className="text-right font-medium">
                {valor}
                {detalle && <span className="block text-xs font-normal text-gray-500">≈ {detalle}</span>}
            </dd>
        </div>
    );
}

function Campo({ etiqueta, valor, onCambio, min, max, step = 1 }: { etiqueta: string; valor: number; onCambio: (v: number) => void; min: number; max: number; step?: number }) {
    return (
        <label className="flex flex-col gap-1 text-sm">
            {etiqueta}
            <input type="number" value={valor} min={min} max={max} step={step}
                // Fuera de rango se acota: el PDF nunca muestra un pie de 150 % o un plazo negativo
                onChange={(e) => onCambio(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
                className="border rounded-lg px-3 py-2" />
        </label>
    );
}

export default function Cotizacion({ idSolicitud, uf }: { idSolicitud: string; uf: ValorUF | null }) {
    const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pie, setPie] = useState(20);
    const [tasa, setTasa] = useState(4.5);
    const [plazo, setPlazo] = useState(25);
    const [validez, setValidez] = useState(15);
    const [nota, setNota] = useState('');

    useEffect(() => {
        getSolicitud(idSolicitud).then(setSolicitud).catch(() => setError('No se pudo cargar la solicitud'));
    }, [idSolicitud]);

    // El título es el nombre de archivo que propone "Guardar como PDF"
    useEffect(() => {
        if (solicitud) document.title = `Cotización ${solicitud.modeloCasa.nombreModelo} - ${solicitud.nombre} ${solicitud.apellido}`;
    }, [solicitud]);

    if (error) return <main className="max-w-3xl mx-auto px-4 py-10 text-red-600">{error}</main>;
    if (!solicitud) return <main className="max-w-3xl mx-auto px-4 py-10">Cargando...</main>;

    const modelo = solicitud.modeloCasa;
    const { proyecto } = modelo;
    const precio = Number(modelo.precio);
    const valorUF = uf?.valor ?? null;
    const esVenta = modelo.tipoOperacion === 'VENTA';
    const credito = calcularCredito({ precio, piePorcentaje: pie, tasaAnual: tasa, plazoAnios: plazo });
    const monto = (v: number) => formatearPrecio(v, modelo.moneda);
    const otra = (v: number) => equivalencia(v, modelo.moneda, valorUF);
    const hoy = new Date();
    const vence = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + validez);

    return (
        <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
            <style>{ESTILO_IMPRESION}</style>

            <section className="no-imprimir flex flex-col gap-4 p-5 border rounded-xl bg-gray-50" aria-label="Ajustes de la cotización">
                <div className="flex flex-wrap justify-between items-baseline gap-2">
                    <Link href="/secretario" className="text-sm text-gray-500 hover:underline">← Solicitudes</Link>
                    <p className="text-xs text-gray-500">Este panel no aparece en el PDF.</p>
                </div>
                {modelo.estado !== 'DISPONIBLE' && (
                    <p role="alert" className="text-sm font-medium text-amber-800 bg-amber-100 rounded-lg px-3 py-2">
                        Atención: este modelo está {ETIQUETA_ESTADO[modelo.estado].toLowerCase()}.
                    </p>
                )}
                {esVenta && (
                    <div className="grid grid-cols-3 gap-2">
                        <Campo etiqueta="Pie (%)" valor={pie} onCambio={setPie} min={0} max={100} />
                        <Campo etiqueta="Tasa anual (%)" valor={tasa} onCambio={setTasa} min={0} max={20} step={0.1} />
                        <Campo etiqueta="Plazo (años)" valor={plazo} onCambio={setPlazo} min={1} max={40} />
                    </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                    <Campo etiqueta="Validez (días)" valor={validez} onCambio={setValidez} min={1} max={90} />
                    <label className="col-span-2 flex flex-col gap-1 text-sm">
                        Nota (opcional)
                        <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={300}
                            placeholder="Ej.: precio sujeto a disponibilidad" className="border rounded-lg px-3 py-2" />
                    </label>
                </div>
                <button type="button" onClick={() => window.print()} className="bg-marca text-white rounded-lg py-2.5 font-medium">
                    Descargar PDF
                </button>
                <p className="text-xs text-gray-500 -mt-2">En el diálogo de impresión elige &quot;Guardar como PDF&quot;.</p>
            </section>

            <article className="hoja flex flex-col gap-5 p-8 border rounded-xl bg-white text-gray-900" aria-label="Cotización">
                <div className="flex justify-between items-start gap-4">
                    {/* <img> y no next/image: debe estar cargada al momento de imprimir */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-inmocap.png" alt="Inmocap" className="h-10 w-auto" />
                    <div className="text-right text-sm">
                        <p className="text-lg font-bold">Cotización</p>
                        <p>Emitida el {fecha(hoy)}</p>
                        <p>Válida hasta el {fecha(vence)}</p>
                    </div>
                </div>

                <div className="text-sm">
                    <p className="font-semibold">Cliente</p>
                    <p>{solicitud.nombre} {solicitud.apellido} · {solicitud.correo} · {solicitud.celular}</p>
                </div>

                <div className="flex gap-4 border-t pt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {modelo.imgPrincipal && <img src={modelo.imgPrincipal} alt={modelo.nombreModelo} className="w-40 h-28 object-cover rounded-lg" />}
                    <div className="text-sm">
                        <p className="text-xl font-bold">{modelo.nombreModelo}</p>
                        <p>{ETIQUETA_TIPO_VIVIENDA[modelo.tipoVivienda] ?? 'Casa'} · {esVenta ? 'Venta' : 'Arriendo'}</p>
                        <p>{proyecto.nombre}, {proyecto.ciudad.nombre}, {proyecto.ciudad.region.nombre}</p>
                        <EtapaEntrega etapa={proyecto.etapa} fechaEntrega={proyecto.fechaEntrega} />
                        <p className="mt-2 text-gray-700">
                            {plural(modelo.dormitorios, 'dormitorio', 'dormitorios')} · {plural(modelo.banos, 'baño', 'baños')}
                            {modelo.estacionamientos ? ` · ${plural(modelo.estacionamientos, 'estacionamiento', 'estacionamientos')}` : ''}
                            {` · ${formatearNumero(modelo.superficieConstruida)} m² construidos`}
                            {modelo.superficieTerreno != null && ` · ${formatearNumero(modelo.superficieTerreno)} m² de terreno`}
                        </p>
                    </div>
                </div>

                <dl className="text-sm border-t pt-2">
                    <Fila etiqueta={esVenta ? 'Precio' : 'Arriendo mensual'} valor={monto(precio)} detalle={otra(precio)} />
                    {modelo.bono && <Fila etiqueta="Bono" valor={modelo.bono} />}
                    {modelo.subsidios?.length > 0 && <Fila etiqueta="Apto para subsidio" valor={modelo.subsidios.join(', ')} />}
                    {modelo.gastosComunes != null && <Fila etiqueta="Gastos comunes" valor={`${formatearCLP(modelo.gastosComunes)} al mes`} />}
                    {esVenta && (
                        <>
                            <Fila etiqueta={`Pie (${formatearNumero(pie)} %)`} valor={monto(credito.pie)} detalle={otra(credito.pie)} />
                            <Fila etiqueta="Monto del crédito" valor={monto(credito.montoCredito)} detalle={otra(credito.montoCredito)} />
                            <Fila etiqueta={`Dividendo estimado (${plazo} años, ${formatearNumero(tasa)} % anual)`} valor={`${monto(credito.dividendo)} al mes`} detalle={otra(credito.dividendo)} />
                            <Fila etiqueta="Renta líquida sugerida" valor={monto(credito.rentaSugerida)} detalle={otra(credito.rentaSugerida)} />
                        </>
                    )}
                </dl>

                {nota.trim() && <p className="text-sm border-l-4 border-marca pl-3">{nota.trim()}</p>}

                <p className="text-xs text-gray-500 border-t pt-3">
                    Valores referenciales{uf ? `; UF ${formatearCLP(uf.valor)} al ${fechaUF(uf)}` : ''}.
                    {esVenta && ' El dividendo es una estimación con cuota fija, sin seguros ni gastos operacionales, y está sujeto a la evaluación del banco.'}
                    {' '}Precio y disponibilidad sujetos a confirmación.
                </p>
            </article>
        </main>
    );
}
