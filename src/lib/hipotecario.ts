export interface ParametrosCredito {
    precio: number;
    piePorcentaje: number;
    tasaAnual: number;
    plazoAnios: number;
}

export interface ResultadoCredito {
    pie: number;
    montoCredito: number;
    dividendo: number;
    totalPagado: number;
    intereses: number;
    rentaSugerida: number;
}

// Parte máxima de la renta que los bancos suelen aceptar para el dividendo.
export const CARGA_FINANCIERA_MAXIMA = 0.25;

// Dividendo con cuota fija (sistema francés), sin seguros ni gastos operacionales.
export function calcularCredito({ precio, piePorcentaje, tasaAnual, plazoAnios }: ParametrosCredito): ResultadoCredito {
    const pie = precio * (piePorcentaje / 100);
    const montoCredito = precio - pie;
    const meses = plazoAnios * 12;
    const tasaMensual = tasaAnual / 100 / 12;

    const dividendo = meses === 0
        ? 0
        : tasaMensual === 0
            ? montoCredito / meses
            : montoCredito * tasaMensual / (1 - Math.pow(1 + tasaMensual, -meses));

    const totalPagado = dividendo * meses;
    return {
        pie,
        montoCredito,
        dividendo,
        totalPagado,
        intereses: totalPagado - montoCredito,
        rentaSugerida: dividendo / CARGA_FINANCIERA_MAXIMA,
    };
}
