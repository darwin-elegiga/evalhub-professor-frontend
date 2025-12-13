import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">¡Registro Exitoso!</CardTitle>
            <CardDescription>Verifica tu correo electrónico para continuar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Te hemos enviado un correo electrónico de confirmación. Por favor, verifica tu bandeja de entrada y haz
              clic en el enlace para activar tu cuenta.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Ir al Inicio de Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
