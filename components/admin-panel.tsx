"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, Plus, Trash2 } from "lucide-react"

interface Division {
  id: string
  name: string
  emoji: string
}

interface Modality {
  id: string
  name: string
  emoji: string
}

interface Team {
  id: string
  name: string
  division: string
  logo_url: string | null
}

interface AdminPanelProps {
  initialDivisions: Division[]
  initialModalities: Modality[]
  initialTeams: Team[]
}

export function AdminPanel({ initialDivisions, initialModalities, initialTeams }: AdminPanelProps) {
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [newTeam, setNewTeam] = useState({
    name: "",
    division: "",
    logo: null as File | null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedModality, setSelectedModality] = useState("")
  const [selectedGender, setSelectedGender] = useState("masculino")
  const [teamCount, setTeamCount] = useState(8)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewTeam({ ...newTeam, logo: e.target.files[0] })
    }
  }

  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.division) {
      alert("Por favor, preencha o nome do time e selecione uma divisão.")
      return
    }

    setIsUploading(true)

    try {
      // Generate a unique ID for the team
      const teamId = crypto.randomUUID()

      let logoUrl = null

      // Upload logo if exists
      if (newTeam.logo) {
        const fileExt = newTeam.logo.name.split(".").pop()
        const fileName = `${teamId}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("team-logos")
          .upload(fileName, newTeam.logo)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("team-logos").getPublicUrl(fileName)

        logoUrl = urlData.publicUrl
      }

      // Add team to database
      const { error } = await supabase.from("teams").insert({
        id: teamId,
        name: newTeam.name,
        division: newTeam.division,
        logo_url: logoUrl,
      })

      if (error) {
        throw error
      }

      // Add to local state
      const newTeamData = {
        id: teamId,
        name: newTeam.name,
        division: newTeam.division,
        logo_url: logoUrl,
      }

      setTeams([...teams, newTeamData])

      // Reset form
      setNewTeam({
        name: "",
        division: "",
        logo: null,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error adding team:", error)
      alert("Erro ao adicionar time. Por favor, tente novamente.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Tem certeza que deseja excluir este time?")) {
      return
    }

    try {
      // Delete from database
      const { error } = await supabase.from("teams").delete().eq("id", teamId)

      if (error) {
        throw error
      }

      // Remove from local state
      setTeams(teams.filter((team) => team.id !== teamId))
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("Erro ao excluir time. Por favor, tente novamente.")
    }
  }

  const generateBracket = async () => {
    if (!selectedDivision || !selectedModality || !selectedGender) {
      alert("Por favor, selecione divisão, modalidade e gênero.")
      return
    }

    if (teamCount < 2) {
      alert("É necessário pelo menos 2 times para gerar um chaveamento.")
      return
    }

    setIsGenerating(true)

    try {
      // Get teams for the selected division
      const filteredTeams = teams.filter((team) => team.division === selectedDivision)

      if (filteredTeams.length < 2) {
        alert("É necessário cadastrar pelo menos 2 times nesta divisão para gerar um chaveamento.")
        return
      }

      // Shuffle teams
      const shuffledTeams = [...filteredTeams].sort(() => Math.random() - 0.5)

      // Calculate number of rounds and matches
      const rounds = Math.ceil(Math.log2(teamCount))
      const totalMatches = Math.pow(2, rounds) - 1
      const firstRoundMatches = Math.pow(2, rounds - 1)
      const byes = Math.pow(2, rounds) - teamCount

      // Create matches array
      const matches = []

      // Generate bracket ID
      const bracketId = `${selectedDivision}-${selectedModality}-${selectedGender}`

      // First, delete any existing bracket
      await supabase
        .from("brackets")
        .delete()
        .eq("division", selectedDivision)
        .eq("modality", selectedModality)
        .eq("gender", selectedGender)

      // Create matches for all rounds
      for (let round = 1; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round)

        for (let position = 1; position <= matchesInRound; position++) {
          const matchId = `${bracketId}-r${round}-p${position}`

          // Determine next match
          let nextMatchId = null
          if (round < rounds) {
            const nextRound = round + 1
            const nextPosition = Math.ceil(position / 2)
            nextMatchId = `${bracketId}-r${nextRound}-p${nextPosition}`
          }

          // For first round, assign teams
          let teamAId = null
          let teamBId = null

          if (round === 1) {
            const teamIndex = (position - 1) * 2

            // Assign team A if available
            if (teamIndex < shuffledTeams.length) {
              teamAId = shuffledTeams[teamIndex].id
            }

            // Assign team B if available
            if (teamIndex + 1 < shuffledTeams.length) {
              teamBId = shuffledTeams[teamIndex + 1].id
            }
          }

          matches.push({
            id: matchId,
            division: selectedDivision,
            modality: selectedModality,
            gender: selectedGender,
            round,
            position,
            team_a_id: teamAId,
            team_b_id: teamBId,
            winner_id: null,
            next_match_id: nextMatchId,
          })
        }
      }

      // Insert all matches
      const { error } = await supabase.from("brackets").insert(matches)

      if (error) {
        throw error
      }

      alert("Chaveamento gerado com sucesso!")

      // Navigate to the bracket page
      router.push(`/chaveamento/${selectedDivision}/${selectedModality}/${selectedGender}`)
      router.refresh()
    } catch (error) {
      console.error("Error generating bracket:", error)
      alert("Erro ao gerar chaveamento. Por favor, tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger value="teams">Cadastro de Times</TabsTrigger>
        <TabsTrigger value="brackets">Geração de Chaves</TabsTrigger>
      </TabsList>

      <TabsContent value="teams">
        <Card className="backdrop-blur-md bg-gray-900/40 border-white/10">
          <CardHeader>
            <CardTitle>Cadastro de Times</CardTitle>
            <CardDescription>Adicione times para as divisões do torneio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Nome do Time</Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="Digite o nome do time"
                    className="bg-gray-800/50 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="team-division">Divisão</Label>
                  <Select
                    value={newTeam.division}
                    onValueChange={(value) => setNewTeam({ ...newTeam, division: value })}
                  >
                    <SelectTrigger id="team-division" className="bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Selecione a divisão" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialDivisions.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.emoji} {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team-logo">Logo do Time (opcional)</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-800/50 border-white/10"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Logo
                    </Button>
                    <span className="text-sm text-gray-400">
                      {newTeam.logo ? newTeam.logo.name : "Nenhum arquivo selecionado"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="team-logo"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddTeam}
                  disabled={isUploading || !newTeam.name || !newTeam.division}
                  className="w-full mt-4"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Time
                    </>
                  )}
                </Button>
              </div>

              <div>
                <Label className="block mb-2">Times Cadastrados</Label>
                <div className="bg-gray-800/50 border border-white/10 rounded-md h-[300px] overflow-y-auto p-2">
                  {teams.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Nenhum time cadastrado</p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map((team) => {
                        const division = initialDivisions.find((d) => d.id === team.division)

                        return (
                          <div key={team.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden relative">
                                {team.logo_url ? (
                                  <Image
                                    src={team.logo_url || "/placeholder.svg"}
                                    alt={team.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs">
                                    {team.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{team.name}</p>
                                <p className="text-xs text-gray-400">
                                  {division ? `${division.emoji} ${division.name}` : "Divisão desconhecida"}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeam(team.id)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="brackets">
        <Card className="backdrop-blur-md bg-gray-900/40 border-white/10">
          <CardHeader>
            <CardTitle>Geração de Chaves</CardTitle>
            <CardDescription>Crie chaveamentos para as modalidades do torneio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bracket-division">Divisão</Label>
                  <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                    <SelectTrigger id="bracket-division" className="bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Selecione a divisão" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialDivisions.map((division) => (
                        <SelectItem key={division.id} value={division.id}>
                          {division.emoji} {division.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bracket-modality">Modalidade</Label>
                  <Select value={selectedModality} onValueChange={setSelectedModality}>
                    <SelectTrigger id="bracket-modality" className="bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {initialModalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.emoji} {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bracket-gender">Gênero</Label>
                  <Select value={selectedGender} onValueChange={setSelectedGender}>
                    <SelectTrigger id="bracket-gender" className="bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="team-count">Número de Times</Label>
                  <Select value={teamCount.toString()} onValueChange={(value) => setTeamCount(Number.parseInt(value))}>
                    <SelectTrigger id="team-count" className="bg-gray-800/50 border-white/10">
                      <SelectValue placeholder="Selecione o número de times" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 times</SelectItem>
                      <SelectItem value="8">8 times</SelectItem>
                      <SelectItem value="16">16 times</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateBracket}
                  disabled={isGenerating || !selectedDivision || !selectedModality || !selectedGender}
                  className="w-full mt-4"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    "Gerar Chaveamento"
                  )}
                </Button>
              </div>

              <div className="bg-gray-800/50 border border-white/10 rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Informações</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• O chaveamento será gerado no formato de eliminação simples.</li>
                  <li>• Os times serão sorteados aleatoriamente.</li>
                  <li>
                    • Se houver menos times que o número selecionado, serão adicionados "byes" (passagens automáticas).
                  </li>
                  <li>• Qualquer chaveamento existente para a mesma divisão, modalidade e gênero será substituído.</li>
                  <li>• Após gerar o chaveamento, você será redirecionado para a página de visualização.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
