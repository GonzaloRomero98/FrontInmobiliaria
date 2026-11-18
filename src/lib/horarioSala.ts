// Mismo formato que el backend (proyecto/horarioSala.ts). Ordenados como Date.getDay(): 0 = domingo.
export const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'] as const;
export type DiaSemana = typeof DIAS_SEMANA[number];
// Cada día tiene sus tramos [abre, cierra] en "HH:MM". Un día que no aparece está cerrado.
export type HorariosSala = Partial<Record<DiaSemana, [string, string][]>>;

// Para mostrar la semana empezando el lunes.
export const SEMANA: { dia: DiaSemana; nombre: string; corto: string }[] = [
    { dia: 'lun', nombre: 'Lunes', corto: 'Lun' },
    { dia: 'mar', nombre: 'Martes', corto: 'Mar' },
    { dia: 'mie', nombre: 'Miércoles', corto: 'Mié' },
    { dia: 'jue', nombre: 'Jueves', corto: 'Jue' },
    { dia: 'vie', nombre: 'Viernes', corto: 'Vie' },
    { dia: 'sab', nombre: 'Sábado', corto: 'Sáb' },
    { dia: 'dom', nombre: 'Domingo', corto: 'Dom' },
];

const PASO_MIN = 30;
// Se ofrecen 30 días aunque el backend acepta hasta 60: una lista más larga cuesta recorrerla en el celular.
const DIAS_OFRECIDOS = 30;
// Salas guardadas antes del horario por día: se ofrece un rango razonable y el backend no restringe.
const SIN_HORARIO: [string, string][] = [['09:00', '19:00']];

const aMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
const aHora = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Horas cada 30 minutos, incluidos los extremos.
export function horasEntre(desde: string, hasta: string): string[] {
    const horas: string[] = [];
    for (let m = aMinutos(desde); m <= aMinutos(hasta); m += PASO_MIN) horas.push(aHora(m));
    return horas;
}

// La última hora que se ofrece es media hora antes del cierre. Hoy solo cuentan las horas que aún no pasan.
// shortcut: usa la hora del navegador, que se asume en Chile; si no lo está, el backend (en hora de Chile) rechaza con mensaje claro.
export function horasDelDia(horarios: HorariosSala | null, fecha: Date, ahora: Date): string[] {
    const tramos = horarios ? horarios[DIAS_SEMANA[fecha.getDay()]] ?? [] : SIN_HORARIO;
    const esHoy = fecha.toDateString() === ahora.toDateString();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return tramos.flatMap(([abre, cierra]) => horasEntre(abre, aHora(aMinutos(cierra) - PASO_MIN)))
        .filter((hora) => !esHoy || aMinutos(hora) > minutosAhora);
}

export interface DiaVisita { valor: string; etiqueta: string; horas: string[] }

// Solo los días con alguna hora libre. "valor" va en "AAAA-MM-DD" local para armar la fecha sin pasar por UTC.
export function diasDeVisita(horarios: HorariosSala | null, ahora: Date): DiaVisita[] {
    const dias: DiaVisita[] = [];
    for (let i = 0; i < DIAS_OFRECIDOS; i++) {
        const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i);
        const horas = horasDelDia(horarios, fecha, ahora);
        if (!horas.length) continue;
        const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        const texto = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' });
        dias.push({ valor, etiqueta: i === 0 ? `Hoy, ${texto}` : i === 1 ? `Mañana, ${texto}` : texto, horas });
    }
    return dias;
}

// Texto para mostrar, agrupando días seguidos con el mismo horario: "Lun a vie 10:00 a 18:00 · Sáb 10:00 a 14:00".
export function textoHorario(horarios: HorariosSala): string | null {
    const grupos: { desde: number; hasta: number; texto: string }[] = [];
    SEMANA.forEach(({ dia }, i) => {
        const tramos = horarios[dia];
        if (!tramos?.length) return;
        const texto = tramos.map(([abre, cierra]) => `${abre} a ${cierra}`).join(' y ');
        const ultimo = grupos[grupos.length - 1];
        if (ultimo && ultimo.texto === texto && ultimo.hasta === i - 1) ultimo.hasta = i;
        else grupos.push({ desde: i, hasta: i, texto });
    });
    if (!grupos.length) return null;
    return grupos.map(({ desde, hasta, texto }) => {
        const dias = desde === hasta ? SEMANA[desde].corto
            : `${SEMANA[desde].corto} ${hasta === desde + 1 ? 'y' : 'a'} ${SEMANA[hasta].corto.toLowerCase()}`;
        return `${dias} ${texto}`;
    }).join(' · ');
}
