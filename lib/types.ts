export interface Portfolio {
  id: string
  user_id: string
  name: string
  description?: string
  tags: string[]
  created_at: string
  updated_at: string
  assets?: Asset[]
  optimization_results?: OptimizationResult[]
}

export interface Asset {
  id: string
  portfolio_id: string
  symbol: string
  name: string
  expected_return: number
  volatility: number
  created_at: string
}

export interface OptimizationResult {
  id: string
  portfolio_id: string
  weights: Record<string, number>
  expected_return: number
  volatility: number
  sharpe_ratio: number
  convergence_data?: any
  parameters: any
  created_at: string
}
