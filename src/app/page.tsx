import PropiedadCard from "@/components/PropiedadCard";
import { getPropiedades } from "@/services/propiedad.service";

export default async function CatalogoPropiedad(){
  const propiedades = await getPropiedades();

  return(
    <main className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Propiedades disponibles</h1>
      {propiedades.length === 0 ?(
        <p className="text-gray-500">No hay propiedades disponibles por el momento</p>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
          {propiedades.map((propiedad)=>(
            <PropiedadCard key={propiedad.id} propiedad={propiedad}/>
          ))}
        </div>
      )}
    </main>
  )
}