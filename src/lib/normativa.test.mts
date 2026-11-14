import { test } from "node:test";
import assert from "node:assert/strict";
import { revisarNormativa } from "./normativa.ts";

// Se corre con "npm test" (usa el test runner que trae Node, sin dependencias extra).
const normativa = { coefConstructibilidad: 1.6, coefOcupacionSuelo: 0.6 };
const casa = (superficieConstruida: number, superficieTerreno = 120) =>
    ({ tipoVivienda: 'CASA' as const, superficieConstruida, superficieTerreno });

test('casa bajo el máximo: cumple', () => {
    assert.deepEqual(revisarNormativa(casa(150), normativa), { maximoConstruido: 192, exceso: 0, maximoPrimerPiso: 72 });
});

test('casa sobre el máximo: informa el exceso', () => {
    assert.equal(revisarNormativa(casa(210), normativa)?.exceso, 18);
});

test('casa justo en el máximo: cumple', () => {
    assert.equal(revisarNormativa(casa(192), normativa)?.exceso, 0);
});

test('decimales: el exceso se redondea a 2 decimales', () => {
    assert.equal(revisarNormativa(casa(192.37), normativa)?.exceso, 0.37);
});

test('solo con ocupación de suelo: no compara la superficie construida', () => {
    assert.deepEqual(revisarNormativa(casa(500), { coefConstructibilidad: null, coefOcupacionSuelo: 0.6 }),
        { maximoConstruido: null, exceso: 0, maximoPrimerPiso: 72 });
});

test('proyecto sin coeficientes: no aplica', () => {
    assert.equal(revisarNormativa(casa(150), { coefConstructibilidad: null, coefOcupacionSuelo: null }), null);
});

test('departamento: no aplica', () => {
    assert.equal(revisarNormativa({ ...casa(150), tipoVivienda: 'DEPARTAMENTO' }, normativa), null);
});

test('terreno vacío o en 0: no aplica', () => {
    assert.equal(revisarNormativa(casa(150, 0), normativa), null);
    assert.equal(revisarNormativa(casa(150, NaN), normativa), null);
});
