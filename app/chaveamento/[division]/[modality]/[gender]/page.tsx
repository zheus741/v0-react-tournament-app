import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FlexibleBracket } from "@/components/flexible-bracket"
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

  // Fetch teams data
  const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*")

  if (teamsError) {
    console.error("Error fetching teams data:", teamsError)
  }

  // Inicializa posições vazias (caso a tabela não exista)
  let initialPositions: any[] = []

  try {
    // Tenta buscar posições existentes do chaveamento
    const { data: bracketPositions, error: bracketError } = await supabase
      .from("flexible_brackets")
      .select("*")
      .eq("division_id", division)
      .eq("modality_id", modality)
      .eq("gender", gender)

    if (!bracketError && bracketPositions) {
      // Transform data for the FlexibleBracket component
      initialPositions = bracketPositions.map((pos) => ({
        id: pos.id,
        round: pos.round,
        position: pos.position,
        teamId: pos.team_id,
        label: pos.label,
      }))
    }
  } catch (error) {
    console.log("Tabela flexible_brackets ainda não existe. Usando posições padrão.")
    // Continua com initialPositions vazio, o componente FlexibleBracket criará posições padrão
  }

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
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">CHAVEAMENTO CIA 10 ANOS</p>

        <div className="flex justify-center mb-6">
          <ExportButton elementId="bracket-container" filename={`chaveamento-${division}-${modality}-${gender}`} />
        </div>
      </div>

      <div
        id="bracket-container"
        className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20"
      >
        <FlexibleBracket
          divisionId={division}
          modalityId={modality}
          gender={gender}
          teams={teamsData || []}
          initialPositions={initialPositions}
        />
      </div>
    </main>
  )
}
