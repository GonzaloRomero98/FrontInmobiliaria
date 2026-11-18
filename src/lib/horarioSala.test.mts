import { test } from "node:test";
import assert from "node:assert/strict";
import { diasDeVisita, fechaVisitaCorta, horasDelDia, textoHorario } from "./horarioSala.ts";

test('fecha corta de la visita en hora de Chile', () => {
    // 18-11-2026 a las 12:00 de Chile (UTC-3).
    const ahora = Date.parse('2026-11-18T15:00:00Z');
    assert.equal(fechaVisitaCorta('2026-11-18T14:00:00Z', ahora), 'Hoy 11:00');
    assert.equal(fechaVisitaCorta('2026-11-19T02:00:00Z', ahora), 'Hoy 23:00'); // ya es 19 en UTC, pero sigue siendo 18 en Chile
    assert.equal(fechaVisitaCorta('2026-11-19T19:30:00Z', ahora), 'Mañana 16:30');
    assert.equal(fechaVisitaCorta('2026-11-17T14:00:00Z', ahora), 'Ayer 11:00');
    assert.match(fechaVisitaCorta('2026-11-20T14:00:00Z', ahora), /^vie.*20.*nov.* · 11:00$/);
});

const horarios = { lun: [['10:00', '12:00']], sab: [['10:00', '11:00']] } as const;
const h = horarios as unknown as Parameters<typeof horasDelDia>[0];
// Lunes 16-11-2026 a las 08:00 locales.
const lunes8 = new Date(2026, 10, 16, 8, 0);

test('horas cada 30 minutos hasta media hora antes del cierre', () => {
    assert.deepEqual(horasDelDia(h, new Date(2026, 10, 23), lunes8), ['10:00', '10:30', '11:00', '11:30']);
});

test('hoy solo ofrece las horas que aún no pasan', () => {
    assert.deepEqual(horasDelDia(h, new Date(2026, 10, 16), new Date(2026, 10, 16, 10, 30)), ['11:00', '11:30']);
});

test('un día cerrado no tiene horas', () => {
    assert.deepEqual(horasDelDia(h, new Date(2026, 10, 17), lunes8), []);
});

test('sin horario cargado se ofrece de 9:00 a 18:30', () => {
    const horas = horasDelDia(null, new Date(2026, 10, 17), lunes8);
    assert.equal(horas[0], '09:00');
    assert.equal(horas[horas.length - 1], '18:30');
});

test('solo aparecen los días abiertos, con hoy y mañana marcados', () => {
    const dias = diasDeVisita(h, lunes8);
    assert.deepEqual(dias.slice(0, 3).map((d) => d.valor), ['2026-11-16', '2026-11-21', '2026-11-23']);
    assert.match(dias[0].etiqueta, /^Hoy, /);
    assert.ok(dias.every((d) => d.horas.length > 0));
});

test('texto agrupa días seguidos con el mismo horario', () => {
    const t = (x: object) => textoHorario(x as Parameters<typeof textoHorario>[0]);
    const semana = { lun: [['10:00', '18:00']], mar: [['10:00', '18:00']], mie: [['10:00', '18:00']], jue: [['10:00', '18:00']], vie: [['10:00', '18:00']], sab: [['10:00', '14:00']] };
    assert.equal(t(semana), 'Lun a vie 10:00 a 18:00 · Sáb 10:00 a 14:00');
    assert.equal(t({ sab: [['10:00', '14:00']], dom: [['10:00', '14:00']] }), 'Sáb y dom 10:00 a 14:00');
    assert.equal(t({ lun: [['10:00', '18:00']], mie: [['10:00', '18:00']] }), 'Lun 10:00 a 18:00 · Mié 10:00 a 18:00');
    assert.equal(t({}), null);
});
