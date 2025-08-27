import type { Asset, OptimizationResult } from "./quantum-optimizer"

export interface ExportData {
  portfolio: {
    name: string
    description?: string
    assets: Asset[]
    weights?: number[]
    optimizationResult?: OptimizationResult
    exportedAt: string
  }
}

export class ImportExportManager {
  // Export portfolio to JSON
  static exportToJSON(
    name: string,
    assets: Asset[],
    weights?: number[],
    optimizationResult?: OptimizationResult,
    description?: string,
  ): string {
    const exportData: ExportData = {
      portfolio: {
        name,
        description,
        assets,
        weights,
        optimizationResult,
        exportedAt: new Date().toISOString(),
      },
    }

    return JSON.stringify(exportData, null, 2)
  }

  // Export portfolio to CSV
  static exportToCSV(assets: Asset[], weights?: number[], optimizationResult?: OptimizationResult): string {
    const headers = ["Symbol", "Name", "Expected Return", "Volatility", "Price", "Optimal Weight", "Allocation Value"]

    const rows = assets.map((asset, index) => {
      const weight = weights?.[index] || 0
      const allocationValue = weight * asset.price
      return [
        asset.symbol,
        `"${asset.name}"`, // Wrap in quotes to handle commas
        asset.expectedReturn.toFixed(4),
        asset.volatility.toFixed(4),
        asset.price.toFixed(2),
        weight.toFixed(4),
        allocationValue.toFixed(2),
      ]
    })

    // Add portfolio summary if optimization result exists
    if (optimizationResult) {
      rows.push([])
      rows.push(["Portfolio Summary", "", "", "", "", "", ""])
      rows.push(["Expected Return", optimizationResult.expectedReturn.toFixed(4), "", "", "", "", ""])
      rows.push(["Volatility", optimizationResult.volatility.toFixed(4), "", "", "", "", ""])
      rows.push(["Sharpe Ratio", optimizationResult.sharpeRatio.toFixed(4), "", "", "", "", ""])
      rows.push(["Iterations", optimizationResult.iterations.toString(), "", "", "", "", ""])
    }

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  // Export optimization results to CSV
  static exportOptimizationResultsToCSV(optimizationResult: OptimizationResult): string {
    const headers = ["Iteration", "Sharpe Ratio", "Improvement"]
    const rows = optimizationResult.convergenceData.map((sharpe, index) => [
      (index + 1).toString(),
      sharpe.toFixed(6),
      index > 0 ? (sharpe - optimizationResult.convergenceData[index - 1]).toFixed(6) : "0",
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  // Import from JSON
  static async importFromJSON(file: File): Promise<{
    assets: Asset[]
    weights?: number[]
    optimizationResult?: OptimizationResult
    metadata?: { name: string; description?: string; exportedAt: string }
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data: ExportData = JSON.parse(content)

          if (!data.portfolio || !data.portfolio.assets) {
            throw new Error("Invalid portfolio data format")
          }

          // Validate asset structure
          const assets = data.portfolio.assets.map((asset) => {
            if (!asset.symbol || !asset.name || typeof asset.expectedReturn !== "number") {
              throw new Error(`Invalid asset data: ${JSON.stringify(asset)}`)
            }
            return {
              symbol: asset.symbol,
              name: asset.name,
              expectedReturn: Number(asset.expectedReturn),
              volatility: Number(asset.volatility || 0.2),
              price: Number(asset.price || 100),
            }
          })

          resolve({
            assets,
            weights: data.portfolio.weights,
            optimizationResult: data.portfolio.optimizationResult,
            metadata: {
              name: data.portfolio.name,
              description: data.portfolio.description,
              exportedAt: data.portfolio.exportedAt,
            },
          })
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  // Import from CSV
  static async importFromCSV(file: File): Promise<{ assets: Asset[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const lines = content.split("\n").filter((line) => line.trim())

          if (lines.length < 2) {
            throw new Error("CSV file must contain at least a header and one data row")
          }

          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
          const assets: Asset[] = []

          // Find column indices
          const symbolIndex = headers.findIndex((h) => h.includes("symbol"))
          const nameIndex = headers.findIndex((h) => h.includes("name"))
          const returnIndex = headers.findIndex((h) => h.includes("return"))
          const volatilityIndex = headers.findIndex((h) => h.includes("volatility") || h.includes("risk"))
          const priceIndex = headers.findIndex((h) => h.includes("price"))

          if (symbolIndex === -1) {
            throw new Error("CSV must contain a 'Symbol' column")
          }

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line || line.startsWith("Portfolio Summary")) break

            const values = this.parseCSVLine(line)
            if (values.length < headers.length) continue

            const symbol = values[symbolIndex]?.trim()
            if (!symbol) continue

            const asset: Asset = {
              symbol: symbol.toUpperCase(),
              name: nameIndex >= 0 ? values[nameIndex]?.replace(/"/g, "").trim() || symbol : symbol,
              expectedReturn: returnIndex >= 0 ? Number.parseFloat(values[returnIndex]) || 0.1 : 0.1,
              volatility: volatilityIndex >= 0 ? Number.parseFloat(values[volatilityIndex]) || 0.2 : 0.2,
              price: priceIndex >= 0 ? Number.parseFloat(values[priceIndex]) || 100 : 100,
            }

            // Validate asset data
            if (Number.isNaN(asset.expectedReturn) || Number.isNaN(asset.volatility) || Number.isNaN(asset.price)) {
              console.warn(`Skipping invalid asset data for ${symbol}`)
              continue
            }

            assets.push(asset)
          }

          if (assets.length === 0) {
            throw new Error("No valid assets found in CSV file")
          }

          resolve({ assets })
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`))
        }
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  // Helper to parse CSV line handling quoted values
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  // Download file helper
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Generate filename with timestamp
  static generateFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    return `${baseName}_${timestamp}.${extension}`
  }
}
