import { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = HTMLAttributes<HTMLElement> & {
    src?: string;
    alt?: string;
    ar?: boolean;
    'ar-modes'?:string;
    'camera-controls'?:boolean;
    'auto-rotate'?:boolean;
    'shadow-intensity'?:string;
    exposure?:string;
    poster?: string;
    loading?: 'auto'|'lazy'|'eager';
    reveal?:'auto'|'interaction'|'manual';
};

type ModelViewerElement = DetailedHTMLProps<ModelViewerAttributes, HTMLElement>;
declare global {
    namespace JSX {
        interface IntrinsicElements{
            'model-viewer':ModelViewerElement;
        }
    }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerElement;
    }
  }
}

export {};