"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Trophy } from "lucide-react"

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

  // Get team abbreviation (first 2 letters)
  const getTeamAbbr = (teamName: string) => {
    return teamName.substring(0, 2).toUpperCase()
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

  // Split matches into left and right sides
  const getLeftSideMatches = (round: number) => {
    return roundsMap[round].filter((match) => match.position % 2 === 1).sort((a, b) => a.position - b.position)
  }

  const getRightSideMatches = (round: number) => {
    return roundsMap[round].filter((match) => match.position % 2 === 0).sort((a, b) => a.position - b.position)
  }

  // Calculate total number of rounds
  const totalRounds = rounds.length

  return (
    <div className="relative">
      {/* Trophy in the middle */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 opacity-30">
        <Trophy className="w-24 h-24 text-yellow-400" />
      </div>

      <div className="flex justify-between">
        {/* Left side of bracket */}
        <div className="flex-1 flex flex-row">
          {rounds.slice(0, totalRounds).map((round, roundIndex) => (
            <div key={`left-${round}`} className="flex-1 flex flex-col">
              <div className="h-12 flex items-center justify-center mb-4">
                <h3 className="text-center text-white font-semibold bg-white/10 py-2 px-4 rounded w-full">
                  {getRoundName(round, totalRounds)}
                </h3>
              </div>
              <div className="flex flex-col gap-6">
                {getLeftSideMatches(round).map((match) => {
                  const teamA = getTeam(match.team_a_id)
                  const teamB = getTeam(match.team_b_id)
                  const hasWinner = !!match.winner_id

                  return (
                    <div key={match.id} className="relative">
                      <div className="bg-gray-800/60 backdrop-blur-sm border border-indigo-900/50 rounded-lg overflow-hidden">
                        <div
                          className={`p-3 border-b border-indigo-900/50 flex items-center gap-2 ${
                            hasWinner && match.winner_id === match.team_a_id ? "bg-indigo-900/30" : ""
                          }`}
                        >
                          {teamA ? (
                            <>
                              <div className="w-8 h-8 relative flex-shrink-0 bg-indigo-900/70 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                                {getTeamAbbr(teamA.name)}
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
                            hasWinner && match.winner_id === match.team_b_id ? "bg-indigo-900/30" : ""
                          }`}
                        >
                          {teamB ? (
                            <>
                              <div className="w-8 h-8 relative flex-shrink-0 bg-indigo-900/70 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                                {getTeamAbbr(teamB.name)}
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

                      {/* Connector lines */}
                      {round < totalRounds && (
                        <div className="absolute right-0 top-1/2 w-4 h-px bg-indigo-500/50"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right side of bracket */}
        <div className="flex-1 flex flex-row-reverse">
          {rounds.slice(0, totalRounds).map((round, roundIndex) => (
            <div key={`right-${round}`} className="flex-1 flex flex-col">
              <div className="h-12 flex items-center justify-center mb-4">
                <h3 className="text-center text-white font-semibold bg-white/10 py-2 px-4 rounded w-full">
                  {getRoundName(round, totalRounds)}
                </h3>
              </div>
              <div className="flex flex-col gap-6">
                {getRightSideMatches(round).map((match) => {
                  const teamA = getTeam(match.team_a_id)
                  const teamB = getTeam(match.team_b_id)
                  const hasWinner = !!match.winner_id

                  return (
                    <div key={match.id} className="relative">
                      <div className="bg-gray-800/60 backdrop-blur-sm border border-indigo-900/50 rounded-lg overflow-hidden">
                        <div
                          className={`p-3 border-b border-indigo-900/50 flex items-center gap-2 ${
                            hasWinner && match.winner_id === match.team_a_id ? "bg-indigo-900/30" : ""
                          }`}
                        >
                          {teamA ? (
                            <>
                              <div className="w-8 h-8 relative flex-shrink-0 bg-indigo-900/70 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                                {getTeamAbbr(teamA.name)}
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
                            hasWinner && match.winner_id === match.team_b_id ? "bg-indigo-900/30" : ""
                          }`}
                        >
                          {teamB ? (
                            <>
                              <div className="w-8 h-8 relative flex-shrink-0 bg-indigo-900/70 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold">
                                {getTeamAbbr(teamB.name)}
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

                      {/* Connector lines */}
                      {round < totalRounds && <div className="absolute left-0 top-1/2 w-4 h-px bg-indigo-500/50"></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
