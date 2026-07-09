import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Página no encontrada",
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Image
          src="/isotipo.png"
          alt="Universidad de Oriente"
          width={64}
          height={64}
          className="mx-auto mb-8"
        />

        <p className="text-sm font-semibold tracking-[0.2em] text-blue-600">
          ERROR 404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">
          Página no encontrada
        </h1>
        <p className="mt-3 leading-relaxed text-gray-500">
          La dirección a la que intentas acceder no existe o ya no está
          disponible.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
          <LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <p className="text-sm text-blue-900">
            Si llegaste hasta aquí desde un enlace del sistema, contacta con el{" "}
            <span className="font-semibold">administrador</span> para que revise
            el problema.
          </p>
        </div>

        <Button
          asChild
          className="mt-8 h-12 w-full rounded-xl bg-blue-600 text-base hover:bg-blue-700"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  )
}
