import { createClient } from "@/lib/supabase/server"

export class ServerDatabaseOperations {
  private async getSupabase() {
    return await createClient()
  }

  async getPortfoliosForUser() {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from("portfolios")
      .select(`
        *,
        assets (*),
        optimization_results (*)
      `)
      .order("updated_at", { ascending: false })

    if (error) throw error
    return data
  }

  async getPortfolioById(id: string) {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from("portfolios")
      .select(`
        *,
        assets (*),
        optimization_results (*)
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }
}
