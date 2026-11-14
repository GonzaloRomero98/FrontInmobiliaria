import type { Normativa } from "@/types/normativa";
import type { TipoVivienda } from "@/types/modeloCasa";

export interface RevisionNormativa {
    maximoConstruido: number | null;
    exceso: number;
    maximoPrimerPiso: number | null;
}

const redondear = (valor: number) => Math.round(valor * 100) / 100;

// Aplica la OGUC: máximo construido = coef. de constructibilidad × terreno y primer piso = coef. de ocupación × terreno.
// Solo se revisan casas, porque en departamentos el coeficiente se aplica al terreno de todo el proyecto.
// Devuelve null cuando no hay nada que mostrar.
export function revisarNormativa(
    modelo: { tipoVivienda: TipoVivienda; superficieConstruida: number; superficieTerreno: number },
    normativa: Pick<Normativa, 'coefConstructibilidad' | 'coefOcupacionSuelo'>,
): RevisionNormativa | null {
    const { coefConstructibilidad, coefOcupacionSuelo } = normativa;
    if (modelo.tipoVivienda !== 'CASA' || !(modelo.superficieTerreno > 0)) return null;
    if (coefConstructibilidad == null && coefOcupacionSuelo == null) return null;

    const maximoConstruido = coefConstructibilidad == null ? null : redondear(coefConstructibilidad * modelo.superficieTerreno);
    const exceso = maximoConstruido != null && modelo.superficieConstruida > maximoConstruido
        ? redondear(modelo.superficieConstruida - maximoConstruido)
        : 0;
    const maximoPrimerPiso = coefOcupacionSuelo == null ? null : redondear(coefOcupacionSuelo * modelo.superficieTerreno);
    return { maximoConstruido, exceso, maximoPrimerPiso };
}
