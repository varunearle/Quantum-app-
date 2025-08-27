import type { Asset } from "./quantum-optimizer"

export interface SavedPortfolio {
  id: string
  name: string
  description?: string
  assets: Asset[]
  weights?: number[]
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

export class PortfolioStorage {
  private static STORAGE_KEY = "quantum_portfolios"

  static savePortfolio(portfolio: SavedPortfolio): void {
    const portfolios = this.getAllPortfolios()
    const existingIndex = portfolios.findIndex((p) => p.id === portfolio.id)

    if (existingIndex >= 0) {
      portfolios[existingIndex] = { ...portfolio, updatedAt: new Date() }
    } else {
      portfolios.push(portfolio)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(portfolios))
  }

  static getAllPortfolios(): SavedPortfolio[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []

    try {
      const portfolios = JSON.parse(stored)
      return portfolios.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }))
    } catch {
      return []
    }
  }

  static getPortfolio(id: string): SavedPortfolio | null {
    const portfolios = this.getAllPortfolios()
    return portfolios.find((p) => p.id === id) || null
  }

  static deletePortfolio(id: string): void {
    const portfolios = this.getAllPortfolios()
    const filtered = portfolios.filter((p) => p.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  static generateId(): string {
    return `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
