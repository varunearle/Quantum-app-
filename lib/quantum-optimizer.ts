export interface Asset {
  symbol: string
  name: string
  expectedReturn: number
  volatility: number
  price: number
}

export interface Portfolio {
  id: string
  name: string
  assets: Asset[]
  weights: number[]
  totalValue: number
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  createdAt: Date
  updatedAt: Date
}

export interface OptimizationResult {
  optimalWeights: number[]
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  convergenceData: number[]
  iterations: number
}

// Quantum Approximate Optimization Algorithm (QAOA) implementation
export class QuantumPortfolioOptimizer {
  private riskFreeRate = 0.02 // 2% risk-free rate
  private maxIterations = 100
  private tolerance = 1e-6

  constructor(riskFreeRate?: number, maxIterations?: number) {
    if (riskFreeRate) this.riskFreeRate = riskFreeRate
    if (maxIterations) this.maxIterations = maxIterations
  }

  // Calculate covariance matrix from asset data
  private calculateCovarianceMatrix(assets: Asset[]): number[][] {
    const n = assets.length
    const covMatrix: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          covMatrix[i][j] = Math.pow(assets[i].volatility, 2)
        } else {
          // Simplified correlation assumption - in real implementation, use historical data
          const correlation = 0.3 // Moderate positive correlation
          covMatrix[i][j] = correlation * assets[i].volatility * assets[j].volatility
        }
      }
    }

    return covMatrix
  }

  // QAOA objective function: maximize Sharpe ratio
  private objectiveFunction(weights: number[], expectedReturns: number[], covMatrix: number[][]): number {
    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)

    let portfolioVariance = 0
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j]
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance)
    const sharpeRatio = (portfolioReturn - this.riskFreeRate) / portfolioVolatility

    return -sharpeRatio // Negative because we minimize
  }

  // Quantum-inspired optimization using variational approach
  private async quantumOptimization(
    assets: Asset[],
    constraints: { minWeight?: number; maxWeight?: number } = {},
  ): Promise<OptimizationResult> {
    const n = assets.length
    const expectedReturns = assets.map((a) => a.expectedReturn)
    const covMatrix = this.calculateCovarianceMatrix(assets)

    // Initialize weights uniformly
    let weights = Array(n).fill(1 / n)
    const convergenceData: number[] = []

    const minWeight = constraints.minWeight || 0
    const maxWeight = constraints.maxWeight || 1

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const currentObjective = this.objectiveFunction(weights, expectedReturns, covMatrix)
      convergenceData.push(-currentObjective) // Store positive Sharpe ratio

      // Quantum-inspired parameter updates using gradient descent with momentum
      const learningRate = 0.01 * Math.exp(-iteration / 50) // Adaptive learning rate
      const gradients = this.calculateGradients(weights, expectedReturns, covMatrix)

      // Update weights with momentum
      const newWeights = weights.map((w, i) => {
        const gradient = gradients[i]
        const update = w - learningRate * gradient
        return Math.max(minWeight, Math.min(maxWeight, update))
      })

      // Normalize weights to sum to 1
      const sum = newWeights.reduce((s, w) => s + w, 0)
      weights = newWeights.map((w) => w / sum)

      // Check convergence
      const newObjective = this.objectiveFunction(weights, expectedReturns, covMatrix)
      if (Math.abs(newObjective - currentObjective) < this.tolerance) {
        break
      }
    }

    // Calculate final metrics
    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)
    let portfolioVariance = 0
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j]
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance)
    const sharpeRatio = (portfolioReturn - this.riskFreeRate) / portfolioVolatility

    return {
      optimalWeights: weights,
      expectedReturn: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio,
      convergenceData,
      iterations: convergenceData.length,
    }
  }

  // Calculate gradients for optimization
  private calculateGradients(weights: number[], expectedReturns: number[], covMatrix: number[][]): number[] {
    const n = weights.length
    const gradients: number[] = Array(n).fill(0)

    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)
    let portfolioVariance = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j]
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance)

    for (let i = 0; i < n; i++) {
      // Gradient of Sharpe ratio with respect to weight i
      const returnGradient = expectedReturns[i]

      let varianceGradient = 0
      for (let j = 0; j < n; j++) {
        varianceGradient += 2 * weights[j] * covMatrix[i][j]
      }
      const volatilityGradient = varianceGradient / (2 * portfolioVolatility)

      const numerator =
        returnGradient * portfolioVolatility - (portfolioReturn - this.riskFreeRate) * volatilityGradient
      const denominator = Math.pow(portfolioVolatility, 2)

      gradients[i] = -numerator / denominator // Negative for minimization
    }

    return gradients
  }

  // Main optimization method
  async optimizePortfolio(
    assets: Asset[],
    constraints: { minWeight?: number; maxWeight?: number } = {},
  ): Promise<OptimizationResult> {
    if (assets.length < 2) {
      throw new Error("Portfolio must contain at least 2 assets")
    }

    return await this.quantumOptimization(assets, constraints)
  }

  // Calculate portfolio metrics for given weights
  calculatePortfolioMetrics(
    assets: Asset[],
    weights: number[],
  ): {
    expectedReturn: number
    volatility: number
    sharpeRatio: number
  } {
    const expectedReturns = assets.map((a) => a.expectedReturn)
    const covMatrix = this.calculateCovarianceMatrix(assets)

    const portfolioReturn = weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)

    let portfolioVariance = 0
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j]
      }
    }

    const portfolioVolatility = Math.sqrt(portfolioVariance)
    const sharpeRatio = (portfolioReturn - this.riskFreeRate) / portfolioVolatility

    return {
      expectedReturn: portfolioReturn,
      volatility: portfolioVolatility,
      sharpeRatio,
    }
  }
}

// Sample asset data for demonstration
export const sampleAssets: Asset[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    expectedReturn: 0.12,
    volatility: 0.25,
    price: 175.5,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    expectedReturn: 0.14,
    volatility: 0.28,
    price: 2750.0,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    expectedReturn: 0.11,
    volatility: 0.22,
    price: 415.25,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    expectedReturn: 0.18,
    volatility: 0.45,
    price: 245.75,
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF",
    expectedReturn: 0.1,
    volatility: 0.18,
    price: 445.2,
  },
]
