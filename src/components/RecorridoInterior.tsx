'use client';

import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Medidas en metros, igual que el modelo GLB.
const ALTURA_OJOS = 1.6;
const RADIO = 0.3;
const ESCALON = 0.4;
const VELOCIDAD = 1.4;
const SENSIBILIDAD = 0.005;
const RECORRIDO_PERILLA = 40;
// Mismos decodificadores Draco que usa model-viewer. La CSP ya permite gstatic.
const DRACO = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
const TECLAS: Record<string, [number, number]> = { // cada tecla da [adelante, lado]
    KeyW: [1, 0], ArrowUp: [1, 0], KeyS: [-1, 0], ArrowDown: [-1, 0],
    KeyD: [0, 1], ArrowRight: [0, 1], KeyA: [0, -1], ArrowLeft: [0, -1],
};
const EJE_Y = new THREE.Vector3(0, 1, 0);
const ABAJO = new THREE.Vector3(0, -1, 0);

interface RecorridoInteriorProps {
    modeloUrl: string;
    titulo: string;
    altura?: number | string;
    sesionAr?: XRSession | null;
    capaAr?: HTMLElement | null;
}

// Recorrido en primera persona dentro del GLB. Parte en el nodo "Entrada" si el modelo lo tiene
// (un Empty de Blender en la puerta); si no, en el centro de la planta.
// Con sesionAr la casa se muestra a escala real sobre la cámara, con la entrada donde está la persona.
export default function RecorridoInterior({ modeloUrl, titulo, altura = 500, sesionAr, capaAr }: RecorridoInteriorProps) {
    const contenedor = useRef<HTMLDivElement>(null);
    const lienzo = useRef<HTMLDivElement>(null);
    const perilla = useRef<HTMLDivElement>(null);
    const joystick = useRef({ x: 0, y: 0 });
    const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
    const [intento, setIntento] = useState(0);
    const [colocada, setColocada] = useState(false);
    const iniciarAr = useRef<((sesion: XRSession) => void) | null>(null);

    useEffect(() => {
        const div = contenedor.current!;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.toneMapping = THREE.NeutralToneMapping;
        const canvas = renderer.domElement;
        lienzo.current!.appendChild(canvas);

        const escena = new THREE.Scene();
        const fondo = new THREE.Color('#f3f4f6');
        escena.background = fondo;
        const pmrem = new THREE.PMREMGenerator(renderer);
        const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        escena.environment = entorno;
        const camara = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
        camara.rotation.order = 'YXZ';

        const ajustarTamano = () => {
            renderer.setSize(div.clientWidth, div.clientHeight);
            camara.aspect = div.clientWidth / div.clientHeight;
            camara.updateProjectionMatrix();
        };
        const observador = new ResizeObserver(ajustarTamano);
        observador.observe(div);
        ajustarTamano();

        let modelo: THREE.Object3D | null = null;
        const pies = new THREE.Vector3();
        let yaw = 0, pitch = 0;
        const rayo = new THREE.Raycaster();
        const origen = new THREE.Vector3(), dir = new THREE.Vector3(), mov = new THREE.Vector3();

        const toca = (desde: number, direccion: THREE.Vector3, distancia: number) => {
            rayo.set(origen.copy(pies).setY(pies.y + desde), direccion);
            rayo.far = distancia;
            return rayo.intersectObject(modelo!, true)[0];
        };
        // Se revisa a la altura de las rodillas y del pecho, así también frenan un mueble bajo o una ventana.
        const choca = (direccion: THREE.Vector3, distancia: number) =>
            !!(toca(0.5, direccion, distancia) || toca(1.5, direccion, distancia));
        const ajustarPiso = () => {
            const piso = toca(ESCALON, ABAJO, ESCALON + 3);
            if (piso) pies.y = piso.point.y;
        };

        const draco = new DRACOLoader().setDecoderPath(DRACO);
        let cancelado = false;
        new GLTFLoader().setDRACOLoader(draco).load(modeloUrl, (gltf) => {
            if (cancelado) return;
            modelo = gltf.scene;
            // Los muros suelen exportarse con una sola cara. Sin DoubleSide se ven transparentes desde adentro y los rayos de colisión los atraviesan.
            modelo.traverse((o) => {
                const malla = o as THREE.Mesh;
                if (malla.isMesh) for (const m of [malla.material].flat()) m.side = THREE.DoubleSide;
            });
            escena.add(modelo);
            modelo.updateMatrixWorld(true);

            const entrada = modelo.getObjectByName('Entrada');
            if (entrada) {
                entrada.getWorldPosition(pies);
                const frente = new THREE.Vector3(0, 0, -1).applyQuaternion(entrada.getWorldQuaternion(new THREE.Quaternion()));
                yaw = Math.atan2(-frente.x, -frente.z);
            } else {
                const caja = new THREE.Box3().setFromObject(modelo);
                caja.getCenter(pies);
                pies.y = caja.min.y;
            }
            ajustarPiso();
            setEstado('listo');
        }, undefined, () => { if (!cancelado) setEstado('error'); });

        // El teclado solo funciona con el visor enfocado, para no quitarle las flechas al resto de la página.
        const teclas = new Set<string>();
        const alTeclear = (e: KeyboardEvent) => {
            if (!TECLAS[e.code]) return;
            e.preventDefault();
            if (e.type === 'keydown') teclas.add(e.code);
            else teclas.delete(e.code);
        };
        const alDesenfocar = () => teclas.clear();
        div.addEventListener('keydown', alTeclear);
        div.addEventListener('keyup', alTeclear);
        div.addEventListener('blur', alDesenfocar);

        let arrastre: number | null = null, px = 0, py = 0;
        canvas.addEventListener('pointerdown', (e) => {
            if (arrastre !== null) return;
            arrastre = e.pointerId; px = e.clientX; py = e.clientY;
            canvas.setPointerCapture(e.pointerId);
            div.focus();
        });
        canvas.addEventListener('pointermove', (e) => {
            if (e.pointerId !== arrastre) return;
            yaw += (e.clientX - px) * SENSIBILIDAD;
            pitch = THREE.MathUtils.clamp(pitch + (e.clientY - py) * SENSIBILIDAD, -1.4, 1.4);
            px = e.clientX; py = e.clientY;
        });
        const soltar = (e: PointerEvent) => { if (e.pointerId === arrastre) arrastre = null; };
        canvas.addEventListener('pointerup', soltar);
        canvas.addEventListener('pointercancel', soltar);

        // En RA se apunta al suelo y con el primer punto se ubica la casa, con la entrada bajo los pies.
        // El ancla corrige la deriva del seguimiento, que hacía que la casa se moviera al caminar.
        let fuenteHit: XRHitTestSource | undefined;
        let ancla: XRAnchor | undefined;
        let enSuelo = false, enAr = false;
        const anclaInicial = new THREE.Vector3(), baseModelo = new THREE.Vector3();
        // La RA usa este mismo renderer y al salir se vuelve al recorrido con joystick.
        // Destruir el contexto WebGL justo al cerrar la sesión hacía caer la pestaña en Android.
        iniciarAr.current = (sesion) => {
            if (enAr) return;
            enAr = true;
            enSuelo = false;
            escena.background = null;
            sesion.addEventListener('end', () => {
                enAr = false;
                fuenteHit = undefined;
                ancla = undefined;
                renderer.xr.enabled = false;
                escena.background = fondo;
                if (modelo) { modelo.position.set(0, 0, 0); modelo.rotation.y = 0; modelo.visible = true; }
                setColocada(false);
            });
            renderer.xr.enabled = true;
            renderer.xr.setReferenceSpaceType('local');
            renderer.xr.setSession(sesion)
                .then(() => sesion.requestReferenceSpace('viewer'))
                .then((espacio) => sesion.requestHitTestSource?.({ space: espacio }))
                .then((f) => { if (cancelado) f?.cancel(); else fuenteHit = f; })
                .catch(() => sesion.end().catch(() => {}));
        };
        const colocarEnElSuelo = (frame: XRFrame) => {
            const ref = renderer.xr.getReferenceSpace()!;
            const ojos = frame.getViewerPose(ref)?.transform;
            const hit = frame.getHitTestResults(fuenteHit!)[0];
            const suelo = hit?.getPose(ref)?.transform.position;
            // Si el punto está a menos de medio metro bajo los ojos, probablemente es una mesa y no el suelo.
            if (!ojos || !suelo || ojos.position.y - suelo.y < 0.5) return;
            const { x, y, z, w } = ojos.orientation;
            const frente = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(x, y, z, w));
            const giro = Math.atan2(-frente.x, -frente.z) - yaw;
            modelo!.rotation.y = giro;
            modelo!.position.set(ojos.position.x, suelo.y, ojos.position.z).sub(pies.clone().applyAxisAngle(EJE_Y, giro));
            baseModelo.copy(modelo!.position);
            anclaInicial.set(suelo.x, suelo.y, suelo.z);
            hit.createAnchor?.()?.then((a) => { if (cancelado) a.delete(); else ancla = a; }, () => {});
            fuenteHit!.cancel();
            fuenteHit = undefined;
            enSuelo = true;
            setColocada(true);
        };
        const seguirAncla = (frame: XRFrame) => {
            const p = frame.getPose(ancla!.anchorSpace, renderer.xr.getReferenceSpace()!)?.transform.position;
            if (p) modelo!.position.set(p.x, p.y, p.z).sub(anclaInicial).add(baseModelo);
        };

        let anterior = 0;
        renderer.setAnimationLoop((tiempo, frame) => {
            const dt = Math.min((tiempo - (anterior || tiempo)) / 1000, 0.1);
            anterior = tiempo;
            if (enAr) {
                if (modelo && frame && fuenteHit) colocarEnElSuelo(frame);
                if (modelo && frame && ancla) seguirAncla(frame);
                // Mientras no esté ubicada, la casa no se dibuja porque aparecería alrededor de la cabeza.
                if (modelo) modelo.visible = enSuelo;
            } else if (modelo) {
                let adelante = -joystick.current.y, lado = joystick.current.x;
                for (const t of teclas) { adelante += TECLAS[t][0]; lado += TECLAS[t][1]; }
                mov.set(lado, 0, -adelante).clampLength(0, 1).multiplyScalar(VELOCIDAD * dt).applyAxisAngle(EJE_Y, yaw);
                // Cada eje se mueve por separado para deslizarse por un muro en vez de quedar pegado.
                for (const eje of ['x', 'z'] as const) {
                    if (!mov[eje]) continue;
                    dir.set(0, 0, 0)[eje] = Math.sign(mov[eje]);
                    if (!choca(dir, Math.abs(mov[eje]) + RADIO)) pies[eje] += mov[eje];
                }
                if (mov.lengthSq()) ajustarPiso();
            }
            camara.position.set(pies.x, pies.y + ALTURA_OJOS, pies.z);
            camara.rotation.set(pitch, yaw, 0);
            renderer.render(escena, camara);
        });

        return () => {
            cancelado = true;
            iniciarAr.current = null;
            renderer.setAnimationLoop(null);
            // La sesión no se cierra aquí porque React monta dos veces en desarrollo. La cierran el botón Salir o el botón atrás.
            if (enAr) { fuenteHit?.cancel(); ancla?.delete(); }
            setColocada(false);
            observador.disconnect();
            div.removeEventListener('keydown', alTeclear);
            div.removeEventListener('keyup', alTeclear);
            div.removeEventListener('blur', alDesenfocar);
            escena.traverse((o) => {
                const malla = o as THREE.Mesh;
                if (!malla.isMesh) return;
                malla.geometry.dispose();
                for (const m of [malla.material].flat()) {
                    for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
                    m.dispose();
                }
            });
            entorno.dispose();
            pmrem.dispose();
            draco.dispose();
            renderer.dispose();
            canvas.remove();
        };
    }, [modeloUrl, intento]);

    useEffect(() => {
        if (sesionAr) iniciarAr.current?.(sesionAr);
    }, [sesionAr]);

    function moverJoystick(e: EventoPuntero<HTMLDivElement>) {
        const r = e.currentTarget.getBoundingClientRect();
        const v = new THREE.Vector2(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2)
            .clampLength(0, RECORRIDO_PERILLA);
        joystick.current = { x: v.x / RECORRIDO_PERILLA, y: v.y / RECORRIDO_PERILLA };
        perilla.current!.style.transform = `translate(${v.x}px, ${v.y}px)`;
    }

    function soltarJoystick() {
        joystick.current = { x: 0, y: 0 };
        perilla.current!.style.transform = '';
    }

    function reintentar() {
        setEstado('cargando');
        setIntento((i) => i + 1);
    }

    return (
        <div ref={contenedor} tabIndex={0} aria-label={`Recorrido interior de ${titulo}. Arrastra para mirar; WASD o flechas para caminar.`}
            className="relative overflow-hidden rounded-xl bg-gray-100 touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-marca"
            style={{ height: typeof altura === 'number' ? `${altura}px` : altura }}>
            <div ref={lienzo} className="absolute inset-0" />

            {estado === 'cargando' && (
                <p className="absolute inset-0 flex items-center justify-center text-gray-600">Cargando recorrido…</p>
            )}
            {estado === 'error' && (
                <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100 p-6 text-center">
                    <p className="font-medium text-gray-800">No se pudo cargar el modelo 3D.</p>
                    <p className="text-sm text-gray-600">Revisa tu conexión e inténtalo de nuevo.</p>
                    <button type="button" onClick={reintentar} className="bg-marca text-white rounded-lg px-4 py-2 font-medium">
                        Reintentar
                    </button>
                </div>
            )}

            <div aria-hidden className="absolute bottom-5 left-5 size-28 rounded-full bg-black/25 hidden [@media(pointer:coarse)]:block"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); moverJoystick(e); }}
                onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) moverJoystick(e); }}
                onPointerUp={soltarJoystick}
                onPointerCancel={soltarJoystick}>
                <div ref={perilla} className="absolute left-1/2 top-1/2 size-12 -ml-6 -mt-6 rounded-full bg-white/90 shadow pointer-events-none" />
            </div>

            {sesionAr && capaAr && createPortal(
                <div className="flex h-full flex-col items-center justify-between p-5 text-center">
                    <button type="button" onClick={() => sesionAr.end().catch(() => {})}
                        className="self-end rounded-full bg-white px-5 py-2.5 font-semibold text-gray-900 shadow">
                        Salir
                    </button>
                    {!colocada && (
                        <p role="status" className="rounded-xl bg-black/65 px-4 py-3 font-medium text-white">
                            {estado === 'error' ? 'No se pudo cargar el modelo 3D. Sal e inténtalo de nuevo.'
                                : estado === 'cargando' ? 'Cargando la casa…'
                                : 'Apunta el celular al suelo, cerca de tus pies. La casa aparecerá a tu alrededor, desde la entrada.'}
                        </p>
                    )}
                </div>,
                capaAr,
            )}
        </div>
    );
}
