'use client';
import { QRCodeSVG } from "qrcode.react";

interface QRArProps{
    urlPropiedad:string;
}

export default function QrAr({urlPropiedad}:QRArProps){
    return(
        <div className="flex items-center gap-4">
            <QRCodeSVG value={urlPropiedad} size={96} className="shrink-0" />
            <p className="text-sm text-gray-700">
                <span className="block font-semibold text-gray-900">Mírala en tu espacio</span>
                Escanea con tu celular para verla en realidad aumentada.
            </p>
        </div>
    );
}
