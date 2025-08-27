import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"
import type { Portfolio, Asset, OptimizationResult } from "./types"

// Client-side operations
export class DatabaseOperations {
  private supabase = createClient()

  async savePortfolio(portfolio: Omit<Portfolio, "id" | "user_id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase.from("portfolios").insert(portfolio).select().single()

    if (error) throw error
    return data
  }

  async updatePortfolio(id: string, updates: Partial<Portfolio>) {
    const { data, error } = await this.supabase
      .from("portfolios")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deletePortfolio(id: string) {
    const { error } = await this.supabase.from("portfolios").delete().eq("id", id)

    if (error) throw error
  }

  async getPortfolios() {
    const { data, error } = await this.supabase
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

  async saveAssets(portfolioId: string, assets: Omit<Asset, "id" | "portfolio_id" | "created_at">[]) {
    // First delete existing assets
    await this.supabase.from("assets").delete().eq("portfolio_id", portfolioId)

    // Then insert new assets
    const assetsWithPortfolioId = assets.map((asset) => ({
      ...asset,
      portfolio_id: portfolioId,
    }))

    const { data, error } = await this.supabase.from("assets").insert(assetsWithPortfolioId).select()

    if (error) throw error
    return data
  }

  async saveOptimizationResult(result: Omit<OptimizationResult, "id" | "created_at">) {
    const { data, error } = await this.supabase.from("optimization_results").insert(result).select().single()

    if (error) throw error
    return data
  }

  async getOptimizationResults(portfolioId: string) {
    const { data, error } = await this.supabase
      .from("optimization_results")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }
}

// Server-side operations
export class ServerDatabaseOperations {
  private async getSupabase() {
    return await createServerClient()
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
