"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, BarChart3, Zap, Settings, LogOut, User } from "lucide-react"
import { QuantumPortfolioOptimizer, type Asset, type OptimizationResult, sampleAssets } from "@/lib/quantum-optimizer"
import { DatabaseOperations } from "@/lib/database-operations"
import { createClient } from "@/lib/supabase/client"
import AssetManager from "@/components/asset-manager"
import PortfolioManager from "@/components/portfolio-manager"
import PortfolioCharts from "@/components/portfolio-charts"
import ImportExportManagerComponent from "@/components/import-export-manager"

export default function PortfolioOptimizer() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<Asset[]>([])
  const [currentPortfolioId, setCurrentPortfolioId] = useState<string | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [optimizer] = useState(() => new QuantumPortfolioOptimizer())
  const [db] = useState(() => new DatabaseOperations())
  const [constraints, setConstraints] = useState({
    minWeight: 0.05,
    maxWeight: 0.4,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)

      // Load user's portfolios or set sample data for new users
      try {
        const portfolios = await db.getPortfolios()
        if (portfolios.length === 0) {
          // New user - set sample assets
          setAssets(sampleAssets)
        } else {
          // Load most recent portfolio
          const latestPortfolio = portfolios[0]
          setCurrentPortfolioId(latestPortfolio.id)
          setAssets(latestPortfolio.assets || [])
          if (latestPortfolio.optimization_results && latestPortfolio.optimization_results.length > 0) {
            const latestResult = latestPortfolio.optimization_results[0]
            setOptimizationResult({
              optimalWeights: Object.values(latestResult.weights),
              expectedReturn: latestResult.expected_return,
              volatility: latestResult.volatility,
              sharpeRatio: latestResult.sharpe_ratio,
              iterations: 100, // Default value
              convergenceData: latestResult.convergence_data || [],
            })
          }
        }
      } catch (error) {
        console.error("Error loading portfolios:", error)
        setAssets(sampleAssets) // Fallback to sample data
      }

      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/auth/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router, db])

  const handleOptimize = async () => {
    if (!currentPortfolioId) {
      // Create a new portfolio first
      try {
        const portfolio = await db.savePortfolio({
          name: `Portfolio ${new Date().toLocaleDateString()}`,
          description: "Quantum optimized portfolio",
          tags: ["quantum", "optimized"],
        })
        setCurrentPortfolioId(portfolio.id)

        // Save assets to the new portfolio
        await db.saveAssets(
          portfolio.id,
          assets.map((asset) => ({
            symbol: asset.symbol,
            name: asset.name,
            expected_return: asset.expectedReturn,
            volatility: asset.volatility,
          })),
        )
      } catch (error) {
        console.error("Error creating portfolio:", error)
        return
      }
    }

    setIsOptimizing(true)
    try {
      const result = await optimizer.optimizePortfolio(assets, constraints)
      setOptimizationResult(result)

      // Save optimization result to database
      if (currentPortfolioId) {
        const weightsObject = assets.reduce(
          (acc, asset, index) => {
            acc[asset.symbol] = result.optimalWeights[index]
            return acc
          },
          {} as Record<string, number>,
        )

        await db.saveOptimizationResult({
          portfolio_id: currentPortfolioId,
          weights: weightsObject,
          expected_return: result.expectedReturn,
          volatility: result.volatility,
          sharpe_ratio: result.sharpeRatio,
          convergence_data: result.convergenceData,
          parameters: constraints,
        })
      }
    } catch (error) {
      console.error("Optimization failed:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleLoadPortfolio = async (loadedAssets: Asset[], weights?: number[]) => {
    setAssets(loadedAssets)

    // Save as new portfolio if assets changed significantly
    try {
      const portfolio = await db.savePortfolio({
        name: `Imported Portfolio ${new Date().toLocaleDateString()}`,
        description: "Imported portfolio configuration",
        tags: ["imported"],
      })
      setCurrentPortfolioId(portfolio.id)

      await db.saveAssets(
        portfolio.id,
        loadedAssets.map((asset) => ({
          symbol: asset.symbol,
          name: asset.name,
          expected_return: asset.expectedReturn,
          volatility: asset.volatility,
        })),
      )
    } catch (error) {
      console.error("Error saving imported portfolio:", error)
    }

    if (weights) {
      setOptimizationResult(null)
    }
  }

  const handleImportComplete = (data: {
    assets: Asset[]
    weights?: number[]
    optimizationResult?: OptimizationResult
    metadata?: any
  }) => {
    setAssets(data.assets)
    if (data.optimizationResult) {
      setOptimizationResult(data.optimizationResult)
    } else {
      setOptimizationResult(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-foreground">Quantum Portfolio</h1>
              <p className="text-lg text-muted-foreground">Optimization Platform</p>
            </div>
          </div>
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-lg font-medium text-foreground">Initializing Quantum Engine</p>
            <p className="text-sm text-muted-foreground">Loading your portfolio optimization dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Quantum Portfolio Optimizer</h1>
              <p className="text-lg text-muted-foreground mt-1">
                Advanced QAOA-powered portfolio optimization platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">Premium Account</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="border-border/50 bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 h-14 bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <TabsTrigger
              value="portfolio"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="optimization"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Optimization
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="import-export"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Import/Export
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Results
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Management Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioManager
                currentAssets={assets}
                currentWeights={optimizationResult?.optimalWeights}
                onLoadPortfolio={handleLoadPortfolio}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                  <CardDescription>Current portfolio composition and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-foreground">{assets.length}</p>
                        <p className="text-sm text-muted-foreground">Assets</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(assets.reduce((sum, asset) => sum + asset.price, 0))}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                      </div>
                    </div>

                    {optimizationResult && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Optimization Status</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-chart-3">
                              {formatPercentage(optimizationResult.expectedReturn)}
                            </p>
                            <p className="text-xs text-muted-foreground">Return</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-chart-4">
                              {formatPercentage(optimizationResult.volatility)}
                            </p>
                            <p className="text-xs text-muted-foreground">Risk</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-bold text-accent">{optimizationResult.sharpeRatio.toFixed(3)}</p>
                            <p className="text-xs text-muted-foreground">Sharpe</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Asset Management Tab */}
          <TabsContent value="assets" className="space-y-6">
            <AssetManager assets={assets} onAssetsChange={setAssets} />
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Optimization Parameters
                  </CardTitle>
                  <CardDescription>Configure constraints for the quantum optimization algorithm</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Minimum Weight per Asset</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={constraints.minWeight}
                      onChange={(e) =>
                        setConstraints((prev) => ({ ...prev, minWeight: Number.parseFloat(e.target.value) }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum allocation: {formatPercentage(constraints.minWeight)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Weight per Asset</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={constraints.maxWeight}
                      onChange={(e) =>
                        setConstraints((prev) => ({ ...prev, maxWeight: Number.parseFloat(e.target.value) }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum allocation: {formatPercentage(constraints.maxWeight)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quantum Engine
                  </CardTitle>
                  <CardDescription>Execute QAOA algorithm for optimal portfolio weights</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      The quantum algorithm maximizes Sharpe ratio by finding optimal asset weights that balance
                      expected returns against portfolio risk using variational optimization.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleOptimize}
                    disabled={isOptimizing || assets.length < 2}
                    className="w-full"
                    size="lg"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Optimizing Portfolio...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run Quantum Optimization
                      </>
                    )}
                  </Button>

                  {assets.length < 2 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Add at least 2 assets to enable optimization
                    </p>
                  )}

                  {isOptimizing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Quantum iterations</span>
                        <span>Processing...</span>
                      </div>
                      <Progress value={75} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <PortfolioCharts assets={assets} optimizationResult={optimizationResult} />
          </TabsContent>

          {/* Import/Export Tab */}
          <TabsContent value="import-export" className="space-y-6">
            <ImportExportManagerComponent
              assets={assets}
              optimizationResult={optimizationResult}
              onImportAssets={setAssets}
              onImportComplete={handleImportComplete}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {optimizationResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Results</CardTitle>
                    <CardDescription>
                      Quantum-optimized portfolio metrics after {optimizationResult.iterations} iterations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-chart-3">
                          {formatPercentage(optimizationResult.expectedReturn)}
                        </p>
                        <p className="text-sm text-muted-foreground">Expected Return</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-chart-4">
                          {formatPercentage(optimizationResult.volatility)}
                        </p>
                        <p className="text-sm text-muted-foreground">Volatility</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-accent">{optimizationResult.sharpeRatio.toFixed(3)}</p>
                        <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimal Asset Allocation</CardTitle>
                    <CardDescription>Quantum-computed portfolio weights</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assets.map((asset, index) => (
                        <div key={asset.symbol} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{asset.symbol}</Badge>
                            <span className="text-sm text-muted-foreground truncate">{asset.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatPercentage(optimizationResult.optimalWeights[index])}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No optimization results yet</p>
                  <p className="text-sm text-muted-foreground">Run the quantum optimization to see results</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
