"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Team {
  id: string
  name: string
  logo_url: string
}

interface BracketMatch {
  id: string
  division: string
  modality: string
  gender: string
  round: number
  position: number
  team_a_id: string | null
  team_b_id: string | null
  winner_id: string | null
  next_match_id: string | null
}

interface BracketDisplayProps {
  bracketData: BracketMatch[]
  teamsData: Team[]
}

export function BracketDisplay({ bracketData, teamsData }: BracketDisplayProps) {
  const [matches, setMatches] = useState<BracketMatch[]>(bracketData)
  const [isUpdating, setIsUpdating] = useState(false)

  const supabase = createClient()

  // Group matches by round
  const roundsMap: Record<number, BracketMatch[]> = {}
  matches.forEach((match) => {
    if (!roundsMap[match.round]) {
      roundsMap[match.round] = []
    }
    roundsMap[match.round].push(match)
  })

  // Sort rounds
  const rounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b)

  // Get team by ID
  const getTeam = (teamId: string | null) => {
    if (!teamId) return null
    return teamsData.find((team) => team.id === teamId) || null
  }

  // Get round name
  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Final"
    if (round === totalRounds - 1) return "Semifinal"
    if (round === totalRounds - 2) return "Quartas"
    return "Oitavas"
  }

  // Handle winner selection
  const handleSelectWinner = async (match: BracketMatch, winnerId: string) => {
    if (isUpdating || match.winner_id === winnerId) return

    setIsUpdating(true)

    try {
      // Update current match
      const { error } = await supabase.from("brackets").update({ winner_id: winnerId }).eq("id", match.id)

      if (error) throw error

      // Find next match if exists
      if (match.next_match_id) {
        const nextMatch = matches.find((m) => m.id === match.next_match_id)

        if (nextMatch) {
          // Determine if this team goes to team_a or team_b in the next match
          const isTeamA = nextMatch.position % 2 === 1

          const updateData = isTeamA ? { team_a_id: winnerId } : { team_b_id: winnerId }

          const { error: nextError } = await supabase.from("brackets").update(updateData).eq("id", match.next_match_id)

          if (nextError) throw nextError
        }
      }

      // Refresh data
      const { data: updatedData } = await supabase
        .from("brackets")
        .select("*")
        .eq("division", match.division)
        .eq("modality", match.modality)
        .eq("gender", match.gender)
        .order("round", { ascending: true })
        .order("position", { ascending: true })

      if (updatedData) {
        setMatches(updatedData)
      }
    } catch (error) {
      console.error("Error updating bracket:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-nowrap overflow-x-auto pb-6">
      {rounds.map((round) => {
        const roundMatches = roundsMap[round]
        return (
          <div key={round} className="flex-shrink-0 w-64 mx-2">
            <h3 className="text-center text-white font-semibold mb-4 bg-white/10 py-2 rounded">
              {getRoundName(round, rounds.length)}
            </h3>
            <div className="flex flex-col gap-6">
              {roundMatches.map((match) => {
                const teamA = getTeam(match.team_a_id)
                const teamB = getTeam(match.team_b_id)
                const hasWinner = !!match.winner_id

                return (
                  <div
                    key={match.id}
                    className="bg-gray-800/60 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden"
                  >
                    <div
                      className={`p-3 border-b border-white/10 flex items-center gap-2 ${
                        hasWinner && match.winner_id === match.team_a_id ? "bg-green-900/20" : ""
                      }`}
                    >
                      {teamA ? (
                        <>
                          <div className="w-8 h-8 relative flex-shrink-0 bg-gray-700 rounded-full overflow-hidden">
                            {teamA.logo_url ? (
                              <Image
                                src={teamA.logo_url || "/placeholder.svg"}
                                alt={teamA.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">
                                {teamA.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm truncate flex-1">{teamA.name}</span>
                          {!hasWinner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleSelectWinner(match, teamA.id)}
                              disabled={isUpdating}
                            >
                              Vencedor
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aguardando...</span>
                      )}
                    </div>

                    <div
                      className={`p-3 flex items-center gap-2 ${
                        hasWinner && match.winner_id === match.team_b_id ? "bg-green-900/20" : ""
                      }`}
                    >
                      {teamB ? (
                        <>
                          <div className="w-8 h-8 relative flex-shrink-0 bg-gray-700 rounded-full overflow-hidden">
                            {teamB.logo_url ? (
                              <Image
                                src={teamB.logo_url || "/placeholder.svg"}
                                alt={teamB.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">
                                {teamB.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm truncate flex-1">{teamB.name}</span>
                          {!hasWinner && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => handleSelectWinner(match, teamB.id)}
                              disabled={isUpdating}
                            >
                              Vencedor
                            </Button>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Aguardando...</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
