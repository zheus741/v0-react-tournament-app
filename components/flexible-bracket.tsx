"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy } from "lucide-react"

interface Team {
  id: string
  name: string
  logo_url: string | null
}

interface BracketPosition {
  id: string
  round: number
  position: number
  teamId: string | null
  label: string
}

interface FlexibleBracketProps {
  divisionId: string
  modalityId: string
  gender: string
  teams: Team[]
  initialPositions?: BracketPosition[]
}

export function FlexibleBracket({
  divisionId,
  modalityId,
  gender,
  teams,
  initialPositions = [],
}: FlexibleBracketProps) {
  const [positions, setPositions] = useState<BracketPosition[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [tableExists, setTableExists] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const supabase = createClient()

  // Inicializa as posições do chaveamento se não houver posições iniciais
  useEffect(() => {
    if (initialPositions.length > 0) {
      setPositions(initialPositions)
    } else {
      // Cria posições padrão para um chaveamento de 16 times
      const defaultPositions: BracketPosition[] = [
        // Round of 16 - Lado esquerdo
        { id: `r16-1`, round: 1, position: 1, teamId: null, label: "9" },
        { id: `r16-2`, round: 1, position: 2, teamId: null, label: "16" },
        { id: `r16-3`, round: 1, position: 3, teamId: null, label: "13" },
        { id: `r16-4`, round: 1, position: 4, teamId: null, label: "12" },
        { id: `r16-5`, round: 1, position: 5, teamId: null, label: "8" },
        { id: `r16-6`, round: 1, position: 6, teamId: null, label: "5" },
        { id: `r16-7`, round: 1, position: 7, teamId: null, label: "4" },
        { id: `r16-8`, round: 1, position: 8, teamId: null, label: "1" },

        // Round of 16 - Lado direito
        { id: `r16-9`, round: 1, position: 9, teamId: null, label: "2" },
        { id: `r16-10`, round: 1, position: 10, teamId: null, label: "15" },
        { id: `r16-11`, round: 1, position: 11, teamId: null, label: "7" },
        { id: `r16-12`, round: 1, position: 12, teamId: null, label: "10" },
        { id: `r16-13`, round: 1, position: 13, teamId: null, label: "11" },
        { id: `r16-14`, round: 1, position: 14, teamId: null, label: "14" },
        { id: `r16-15`, round: 1, position: 15, teamId: null, label: "6" },
        { id: `r16-16`, round: 1, position: 16, teamId: null, label: "3" },

        // Quartas - Lado esquerdo
        { id: `qf-1`, round: 2, position: 1, teamId: null, label: "" },
        { id: `qf-2`, round: 2, position: 2, teamId: null, label: "" },
        { id: `qf-3`, round: 2, position: 3, teamId: null, label: "" },
        { id: `qf-4`, round: 2, position: 4, teamId: null, label: "" },

        // Quartas - Lado direito
        { id: `qf-5`, round: 2, position: 5, teamId: null, label: "" },
        { id: `qf-6`, round: 2, position: 6, teamId: null, label: "" },
        { id: `qf-7`, round: 2, position: 7, teamId: null, label: "" },
        { id: `qf-8`, round: 2, position: 8, teamId: null, label: "" },

        // Semifinais - Lado esquerdo
        { id: `sf-1`, round: 3, position: 1, teamId: null, label: "" },
        { id: `sf-2`, round: 3, position: 2, teamId: null, label: "" },

        // Semifinais - Lado direito
        { id: `sf-3`, round: 3, position: 3, teamId: null, label: "" },
        { id: `sf-4`, round: 3, position: 4, teamId: null, label: "" },

        // Final
        { id: `f-1`, round: 4, position: 1, teamId: null, label: "" },
        { id: `f-2`, round: 4, position: 2, teamId: null, label: "" },
      ]

      setPositions(defaultPositions)
    }
  }, [initialPositions])

  // Atualiza o time em uma posição específica
  const updateTeam = (positionId: string, teamId: string | null) => {
    setPositions(positions.map((pos) => (pos.id === positionId ? { ...pos, teamId } : pos)))
  }

  // Verifica se a tabela existe e cria se necessário
  const checkAndCreateTable = async () => {
    try {
      // Tenta fazer uma consulta para verificar se a tabela existe
      const { error } = await supabase.from("flexible_brackets").select("id").limit(1)

      if (error && error.code === "42P01") {
        // Tabela não existe, vamos criar
        setTableExists(false)

        // Exibe mensagem para o usuário
        alert(
          "A tabela de chaveamento flexível ainda não existe. Por favor, execute o SQL para criar a tabela primeiro.",
        )

        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao verificar tabela:", error)
      return false
    }
  }

  // Salva o chaveamento no banco de dados
  const saveBracket = async () => {
    setIsSaving(true)

    try {
      // Verifica se a tabela existe
      const tableReady = await checkAndCreateTable()

      if (!tableReady) {
        setIsSaving(false)
        return
      }

      // Primeiro, exclui qualquer chaveamento existente
      await supabase
        .from("flexible_brackets")
        .delete()
        .match({ division_id: divisionId, modality_id: modalityId, gender })

      // Depois, insere as novas posições
      const bracketData = positions.map((pos) => ({
        id: pos.id,
        division_id: divisionId,
        modality_id: modalityId,
        gender,
        round: pos.round,
        position: pos.position,
        team_id: pos.teamId,
        label: pos.label,
      }))

      const { error } = await supabase.from("flexible_brackets").insert(bracketData)

      if (error) throw error

      alert("Chaveamento salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar chaveamento:", error)
      alert("Erro ao salvar chaveamento. Por favor, tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Obtém o time por ID
  const getTeam = (teamId: string | null) => {
    if (!teamId) return null
    return teams.find((team) => team.id === teamId)
  }

  // Obtém as posições por rodada
  const getPositionsByRound = (round: number) => {
    return positions.filter((pos) => pos.round === round)
  }

  // Obtém as posições do lado esquerdo
  const getLeftPositions = (round: number) => {
    const roundPositions = getPositionsByRound(round)
    const midpoint = Math.ceil(roundPositions.length / 2)
    return roundPositions.slice(0, midpoint)
  }

  // Obtém as posições do lado direito
  const getRightPositions = (round: number) => {
    const roundPositions = getPositionsByRound(round)
    const midpoint = Math.ceil(roundPositions.length / 2)
    return roundPositions.slice(midpoint)
  }

  // Componente para renderizar uma posição do chaveamento
  const BracketSlot = ({ position }: { position: BracketPosition }) => {
    const team = getTeam(position.teamId)

    return (
      <div className="relative mb-4">
        <div className="flex items-center bg-white rounded-md overflow-hidden h-12">
          {showLabels && position.label && (
            <div className="absolute -left-4 -top-1 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center transform -rotate-12 shadow-lg opacity-80">
              <span className="text-white font-bold text-sm">{position.label}</span>
            </div>
          )}

          <Select
            value={position.teamId || "none"}
            onValueChange={(value) => updateTeam(position.id, value === "none" ? null : value)}
          >
            <SelectTrigger className="border-0 h-12 focus:ring-0 bg-transparent">
              <SelectValue placeholder="Selecionar time">
                {team ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-900/70 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                      {team.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-black">{team.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Selecionar time</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- Nenhum time --</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Componente para renderizar uma linha de conexão
  const ConnectorLine = ({ direction }: { direction: "right" | "left" }) => {
    const className =
      direction === "right"
        ? "absolute left-0 top-1/2 w-4 h-px bg-pink-500"
        : "absolute right-0 top-1/2 w-4 h-px bg-pink-500"

    return <div className={className}></div>
  }

  return (
    <div className="relative">
      {/* Logo CIA no centro */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
        <div className="text-6xl font-bold text-white mb-2">CIA</div>
        <div className="text-xl text-pink-500 mb-8">O CONTO DE RANACH</div>
        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
      </div>

      {/* Botões de controle */}
      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={saveBracket}
          disabled={isSaving}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
        >
          {isSaving ? "Salvando..." : "Salvar Chaveamento"}
        </Button>

        <Button
          onClick={() => setShowLabels(!showLabels)}
          variant="outline"
          className="border-pink-500 text-pink-500 hover:bg-pink-500/10"
        >
          {showLabels ? "Ocultar Números" : "Mostrar Números"}
        </Button>
      </div>

      {!tableExists && (
        <div className="bg-yellow-500/20 text-yellow-200 p-4 rounded-md mb-6 text-center">
          A tabela de chaveamento flexível ainda não existe. Execute o SQL para criar a tabela antes de salvar.
        </div>
      )}

      <div className="flex">
        {/* Lado esquerdo */}
        <div className="w-[30%] pr-4">
          {/* Round of 16 */}
          <div className="mb-8">
            <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Oitavas</h3>
            <div className="space-y-4">
              {getLeftPositions(1).map((position) => (
                <div key={position.id} className="relative">
                  <BracketSlot position={position} />
                  <ConnectorLine direction="right" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quartas esquerda */}
        <div className="w-[15%] pr-4">
          <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Quartas</h3>
          <div className="space-y-12">
            {getLeftPositions(2).map((position) => (
              <div key={position.id} className="relative">
                <BracketSlot position={position} />
                <ConnectorLine direction="right" />
              </div>
            ))}
          </div>
        </div>

        {/* Semifinais esquerda */}
        <div className="w-[10%] pr-4">
          <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Semifinais</h3>
          <div className="space-y-24 mt-12">
            {getLeftPositions(3).map((position) => (
              <div key={position.id} className="relative">
                <BracketSlot position={position} />
                <ConnectorLine direction="right" />
              </div>
            ))}
          </div>
        </div>

        {/* Final */}
        <div className="w-[10%]">
          <h3 className="text-center text-white font-semibold mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 py-2 rounded">
            Final
          </h3>
          <div className="space-y-24 mt-24">
            {getPositionsByRound(4).map((position) => (
              <BracketSlot key={position.id} position={position} />
            ))}
          </div>
        </div>

        {/* Semifinais direita */}
        <div className="w-[10%] pl-4">
          <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Semifinais</h3>
          <div className="space-y-24 mt-12">
            {getRightPositions(3).map((position) => (
              <div key={position.id} className="relative">
                <BracketSlot position={position} />
                <ConnectorLine direction="left" />
              </div>
            ))}
          </div>
        </div>

        {/* Quartas direita */}
        <div className="w-[15%] pl-4">
          <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Quartas</h3>
          <div className="space-y-12">
            {getRightPositions(2).map((position) => (
              <div key={position.id} className="relative">
                <BracketSlot position={position} />
                <ConnectorLine direction="left" />
              </div>
            ))}
          </div>
        </div>

        {/* Lado direito */}
        <div className="w-[30%] pl-4">
          {/* Round of 16 */}
          <div className="mb-8">
            <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">Oitavas</h3>
            <div className="space-y-4">
              {getRightPositions(1).map((position) => (
                <div key={position.id} className="relative">
                  <BracketSlot position={position} />
                  <ConnectorLine direction="left" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divisão e modalidade */}
      <div className="mt-12 text-center">
        <div className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg font-bold">1ª DIVISÃO</div>
        <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-6 py-2 rounded-lg">
          <span className="text-2xl">🏀</span>
          <span className="text-white font-bold">BASQUETE</span>
        </div>
      </div>
    </div>
  )
}
