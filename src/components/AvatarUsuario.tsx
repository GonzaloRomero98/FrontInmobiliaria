import Image from "next/image";

// Foto de perfil o, si no hay, las iniciales del primer nombre y el último apellido ("Ana María Pérez" -> "AP")
export default function AvatarUsuario({nombre, fotoUrl, tamano = 32}:{nombre:string; fotoUrl?:string | null; tamano?:number}){
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    const extremos = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;
    const iniciales = extremos.map((parte) => parte[0].toUpperCase()).join('') || '?';
    const estilo = {width:tamano, height:tamano};

    if(fotoUrl){
        return <Image src={fotoUrl} alt="" width={tamano} height={tamano} style={estilo} className="rounded-full object-cover shrink-0" />;
    }
    return (
        <span aria-hidden style={{...estilo, fontSize:tamano * 0.4}}
            className="rounded-full bg-marca text-white font-semibold flex items-center justify-center shrink-0">
            {iniciales}
        </span>
    );
}
