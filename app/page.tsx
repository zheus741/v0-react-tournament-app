import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const divisions = [
    { id: "primeira", name: "1ª DIVISÃO", emoji: "🔺", color: "from-red-500/20 to-red-500/10" },
    { id: "segunda", name: "2ª DIVISÃO", emoji: "🔷", color: "from-blue-500/20 to-blue-500/10" },
    { id: "terceira-roxa", name: "3ª ROXA", emoji: "🟣", color: "from-purple-500/20 to-purple-500/10" },
    { id: "terceira-laranja", name: "3ª LARANJA", emoji: "🟧", color: "from-orange-500/20 to-orange-500/10" },
  ]

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-4">
          CHAVEAMENTO CIA 10 ANOS
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Sistema de chaveamento para o torneio universitário comemorativo de 10 anos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {divisions.map((division) => (
          <Link href={`/divisoes/${division.id}`} key={division.id} className="block">
            <Card
              className={`backdrop-blur-md bg-gradient-to-br ${division.color} border-white/10 hover:shadow-lg hover:border-white/20 transition-all duration-300 h-full`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{division.name}</span>
                  <span className="text-3xl">{division.emoji}</span>
                </CardTitle>
                <CardDescription className="text-gray-300">Clique para ver as modalidades</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200">Visualize todas as modalidades e chaveamentos desta divisão</p>
              </CardContent>
              <CardFooter className="text-sm text-gray-400">Masculino e Feminino</CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/admin"
          className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white font-medium transition-all duration-300"
        >
          Painel de Administração
        </Link>
      </div>
    </main>
  )
}
