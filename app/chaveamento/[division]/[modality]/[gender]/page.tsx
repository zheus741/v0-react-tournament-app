import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BracketDisplay } from "@/components/bracket-display"
import { ExportButton } from "@/components/export-button"

interface BracketPageProps {
  params: {
    division: string
    modality: string
    gender: string
  }
}

export default async function BracketPage({ params }: BracketPageProps) {
  const { division, modality, gender } = params

  if (!division || !modality || !gender || !["masculino", "feminino"].includes(gender)) {
    return notFound()
  }

  const divisionMap: Record<string, { name: string; emoji: string }> = {
    primeira: { name: "1ª DIVISÃO", emoji: "🔺" },
    segunda: { name: "2ª DIVISÃO", emoji: "🔷" },
    "terceira-roxa": { name: "3ª ROXA", emoji: "🟣" },
    "terceira-laranja": { name: "3ª LARANJA", emoji: "🟧" },
  }

  const modalityMap: Record<string, { name: string; emoji: string }> = {
    basquete: { name: "Basquete", emoji: "🏀" },
    futebol: { name: "Futebol", emoji: "⚽" },
    volei: { name: "Vôlei", emoji: "🏐" },
    handebol: { name: "Handebol", emoji: "🤾" },
    futsal: { name: "Futsal", emoji: "⚽" },
    atletismo: { name: "Atletismo", emoji: "🏃" },
  }

  const divisionInfo = divisionMap[division]
  const modalityInfo = modalityMap[modality]

  if (!divisionInfo || !modalityInfo) {
    return notFound()
  }

  const supabase = createClient()

  // Fetch bracket data from Supabase
  const { data: bracketData, error } = await supabase
    .from("brackets")
    .select("*")
    .eq("division", division)
    .eq("modality", modality)
    .eq("gender", gender)
    .order("round", { ascending: true })
    .order("position", { ascending: true })

  if (error) {
    console.error("Error fetching bracket data:", error)
  }

  // Fetch teams data
  const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*").eq("division", division)

  if (teamsError) {
    console.error("Error fetching teams data:", teamsError)
  }

  // If no data is found, we'll show a placeholder
  const hasData = bracketData && bracketData.length > 0

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] py-8">
      <div className="w-full max-w-7xl mx-auto text-center mb-8">
        <Link href={`/divisoes/${division}`} className="text-gray-300 hover:text-white mb-4 inline-block">
          ← Voltar para Modalidades
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          {divisionInfo.emoji} {divisionInfo.name} - {modalityInfo.emoji} {modalityInfo.name} (
          {gender === "masculino" ? "Masculino" : "Feminino"})
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">Chaveamento do torneio</p>

        <div className="flex justify-center mb-6">
          <ExportButton elementId="bracket-container" filename={`chaveamento-${division}-${modality}-${gender}`} />
        </div>
      </div>

      <div
        id="bracket-container"
        className="w-full max-w-7xl mx-auto bg-gray-900/60 backdrop-blur-md p-6 rounded-xl border border-white/10"
      >
        {hasData ? (
          <BracketDisplay bracketData={bracketData} teamsData={teamsData || []} />
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-300 mb-4">Chaveamento ainda não disponível</h3>
            <p className="text-gray-400">
              O chaveamento para esta modalidade ainda não foi gerado ou não há times suficientes.
            </p>
            <Link
              href="/admin"
              className="mt-6 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-all duration-300"
            >
              Ir para o Painel de Administração
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
