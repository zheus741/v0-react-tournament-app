import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ModalityPageProps {
  params: {
    division: string
  }
}

export default function ModalityPage({ params }: ModalityPageProps) {
  const divisionMap: Record<string, { name: string; emoji: string; color: string }> = {
    primeira: { name: "1ª DIVISÃO", emoji: "🔺", color: "from-red-500/20 to-red-500/10" },
    segunda: { name: "2ª DIVISÃO", emoji: "🔷", color: "from-blue-500/20 to-blue-500/10" },
    "terceira-roxa": { name: "3ª ROXA", emoji: "🟣", color: "from-purple-500/20 to-purple-500/10" },
    "terceira-laranja": { name: "3ª LARANJA", emoji: "🟧", color: "from-orange-500/20 to-orange-500/10" },
  }

  const division = divisionMap[params.division]

  if (!division) {
    return notFound()
  }

  const modalities = [
    { id: "basquete", name: "Basquete", emoji: "🏀" },
    { id: "futebol", name: "Futebol", emoji: "⚽" },
    { id: "volei", name: "Vôlei", emoji: "🏐" },
    { id: "handebol", name: "Handebol", emoji: "🤾" },
    { id: "futsal", name: "Futsal", emoji: "⚽" },
    { id: "atletismo", name: "Atletismo", emoji: "🏃" },
  ]

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-5xl mx-auto text-center mb-12">
        <Link href="/" className="text-gray-300 hover:text-white mb-4 inline-block">
          ← Voltar para Divisões
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-4 flex items-center justify-center gap-4">
          {division.name} {division.emoji}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Selecione uma modalidade para visualizar o chaveamento
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {modalities.map((modality) => (
          <Card
            key={modality.id}
            className={`backdrop-blur-md bg-gradient-to-br ${division.color} border-white/10 hover:shadow-lg hover:border-white/20 transition-all duration-300`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{modality.name}</span>
                <span className="text-3xl">{modality.emoji}</span>
              </CardTitle>
              <CardDescription className="text-gray-300">Selecione a categoria</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link href={`/chaveamento/${params.division}/${modality.id}/masculino`}>
                <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/10">
                  Masculino
                </Button>
              </Link>
              <Link href={`/chaveamento/${params.division}/${modality.id}/feminino`}>
                <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/10">
                  Feminino
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
