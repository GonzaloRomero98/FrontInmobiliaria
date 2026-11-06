import { ETIQUETA_ETAPA, EtapaProyecto, formatearMesEntrega } from "@/types/proyecto";

export default function EtapaEntrega({ etapa, fechaEntrega }: { etapa: EtapaProyecto | null; fechaEntrega: string | null }) {
    // En entrega inmediata la fecha no aporta
    const fecha = fechaEntrega && etapa !== 'ENTREGA_INMEDIATA' ? fechaEntrega : null;
    if (!etapa && !fecha) return null;
    return (
        <p className="flex flex-wrap items-center gap-2 mt-2 text-sm">
            {etapa && <span className="bg-marca text-white font-semibold px-2 py-0.5 rounded">{ETIQUETA_ETAPA[etapa]}</span>}
            {fecha && <span className="text-gray-700">Entrega estimada: {formatearMesEntrega(fecha)}</span>}
        </p>
    );
}
