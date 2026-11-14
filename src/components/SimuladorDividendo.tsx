'use client'

import { useState } from "react";
import { calcularCredito, CARGA_FINANCIERA_MAXIMA } from "@/lib/hipotecario";
import { formatearCLP, formatearUF } from "@/lib/formato";
import { Moneda } from "@/types/modeloCasa";

interface SimuladorDividendoProps {
    precio: number;
    moneda: Moneda;
    valorUF: number | null;
}

const PLAZOS = [15, 20, 25, 30];

export default function SimuladorDividendo({ precio, moneda, valorUF }: SimuladorDividendoProps) {
    const [pie, setPie] = useState(20);
    const [tasa, setTasa] = useState(4.5);
    const [plazo, setPlazo] = useState(25);

    const resultado = calcularCredito({ precio, piePorcentaje: pie, tasaAnual: tasa, plazoAnios: plazo });

    function monto(valor: number) {
        if (moneda === 'UF') {
            return (
                <>
                    <span>{formatearUF(valor)}</span>
                    {valorUF && <span className="block text-xs text-gray-500">≈ {formatearCLP(valor * valorUF)}</span>}
                </>
            );
        }
        return <span>{formatearCLP(valor)}</span>;
    }

    return (
        <section className="p-4 border rounded-xl flex flex-col gap-4" aria-labelledby="titulo-simulador">
            <h3 id="titulo-simulador" className="font-semibold text-lg">Simula tu dividendo</h3>

            <label className="flex flex-col gap-1 text-sm">
                <span className="flex justify-between"><span>Pie</span><strong>{pie}%</strong></span>
                <input type="range" min={10} max={50} step={5} value={pie} onChange={(e) => setPie(Number(e.target.value))} />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                    Tasa anual (%)
                    <input
                        type="number" min={0} max={20} step={0.1} value={tasa}
                        onChange={(e) => setTasa(Math.min(20, Math.max(0, Number(e.target.value) || 0)))}
                        className="border rounded-lg px-3 py-2"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Plazo
                    <select value={plazo} onChange={(e) => setPlazo(Number(e.target.value))} className="border rounded-lg px-3 py-2">
                        {PLAZOS.map((p) => <option key={p} value={p}>{p} años</option>)}
                    </select>
                </label>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">Dividendo mensual estimado</p>
                <p className="text-3xl font-bold">
                    {moneda === 'UF' ? formatearUF(resultado.dividendo) : formatearCLP(resultado.dividendo)}
                </p>
                {moneda === 'UF' && valorUF && (
                    <p className="text-gray-700">≈ {formatearCLP(resultado.dividendo * valorUF)} al valor actual de la UF</p>
                )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-gray-500">Pie</dt><dd className="font-medium">{monto(resultado.pie)}</dd></div>
                <div><dt className="text-gray-500">Crédito</dt><dd className="font-medium">{monto(resultado.montoCredito)}</dd></div>
                <div><dt className="text-gray-500">Intereses totales</dt><dd className="font-medium">{monto(resultado.intereses)}</dd></div>
                <div>
                    <dt className="text-gray-500">Renta líquida sugerida</dt>
                    <dd className="font-medium">{monto(resultado.rentaSugerida)}</dd>
                </div>
            </dl>

            <p className="text-xs text-gray-500 leading-relaxed">
                Cálculo referencial con cuota fija. No incluye seguros de desgravamen e incendio ni gastos operacionales.
                La renta sugerida supone que el dividendo no supera el {CARGA_FINANCIERA_MAXIMA * 100}% de tus ingresos,
                criterio habitual de los bancos. Consulta la tasa vigente y tu evaluación con tu banco.
            </p>
        </section>
    );
}
