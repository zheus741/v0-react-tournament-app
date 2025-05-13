import { AdminPanel } from "@/components/admin-panel"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  const supabase = createClient()

  // Fetch divisions
  const { data: divisions } = await supabase.from("divisions").select("*").order("id")

  // Fetch modalities
  const { data: modalities } = await supabase.from("modalities").select("*").order("id")

  // Fetch teams
  const { data: teams } = await supabase.from("teams").select("*").order("name")

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] py-8">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">Painel de Administração</h1>

        <AdminPanel
          initialDivisions={divisions || []}
          initialModalities={modalities || []}
          initialTeams={teams || []}
        />
      </div>
    </main>
  )
}
