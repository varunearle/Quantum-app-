"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { TrendingUp, Target, BarChart3, PieChartIcon } from "lucide-react"
import type { Asset, OptimizationResult } from "@/lib/quantum-optimizer"

interface PortfolioChartsProps {
  assets: Asset[]
  optimizationResult?: OptimizationResult | null
}

export default function PortfolioCharts({ assets, optimizationResult }: PortfolioChartsProps) {
  // Prepare data for portfolio allocation chart
  const allocationData = optimizationResult
    ? assets.map((asset, index) => ({
        name: asset.symbol,
        fullName: asset.name,
        weight: optimizationResult.optimalWeights[index],
        value: optimizationResult.optimalWeights[index] * 100,
        expectedReturn: asset.expectedReturn,
        volatility: asset.volatility,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
    : []

  // Prepare data for risk-return scatter plot
  const riskReturnData = assets.map((asset, index) => ({
    name: asset.symbol,
    fullName: asset.name,
    risk: asset.volatility * 100,
    return: asset.expectedReturn * 100,
    weight: optimizationResult ? optimizationResult.optimalWeights[index] * 100 : 0,
    fill: `hsl(var(--chart-${(index % 5) + 1}))`,
  }))

  // Prepare convergence data
  const convergenceData = optimizationResult
    ? optimizationResult.convergenceData.map((sharpe, index) => ({
        iteration: index + 1,
        sharpeRatio: sharpe,
        improvement: index > 0 ? sharpe - optimizationResult.convergenceData[index - 1] : 0,
      }))
    : []

  // Prepare efficient frontier simulation data
  const efficientFrontierData = Array.from({ length: 20 }, (_, i) => {
    const risk = 0.1 + i * 0.02 // Risk from 10% to 50%
    const maxReturn = 0.08 + risk * 0.4 // Simplified efficient frontier curve
    return {
      risk: risk * 100,
      return: maxReturn * 100,
      isOptimal: optimizationResult && Math.abs(risk - optimizationResult.volatility) < 0.02,
    }
  })

  // Chart configurations
  const allocationConfig: ChartConfig = {
    weight: {
      label: "Weight",
    },
    ...Object.fromEntries(
      assets.map((asset, index) => [
        asset.symbol,
        {
          label: asset.symbol,
          color: `hsl(var(--chart-${(index % 5) + 1}))`,
        },
      ]),
    ),
  }

  const riskReturnConfig: ChartConfig = {
    return: {
      label: "Expected Return (%)",
    },
    risk: {
      label: "Volatility (%)",
    },
  }

  const convergenceConfig: ChartConfig = {
    sharpeRatio: {
      label: "Sharpe Ratio",
      color: "hsl(var(--chart-1))",
    },
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className="space-y-6">
      {/* Portfolio Allocation Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Portfolio Allocation
            </CardTitle>
            <CardDescription>
              {optimizationResult ? "Quantum-optimized asset weights" : "Configure assets to see allocation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {optimizationResult ? (
              <ChartContainer config={allocationConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name) => [
                          `${Number(value).toFixed(1)}%`,
                          allocationData.find((d) => d.name === name)?.fullName || name,
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Run optimization to see allocation</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk-Return Profile
            </CardTitle>
            <CardDescription>Asset positioning by expected return and volatility</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={riskReturnConfig} className="h-[300px]">
              <ScatterChart data={riskReturnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="risk"
                  type="number"
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tickFormatter={formatPercentage}
                  label={{ value: "Volatility (%)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  dataKey="return"
                  type="number"
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tickFormatter={formatPercentage}
                  label={{ value: "Expected Return (%)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        if (name === "risk") return [`${Number(value).toFixed(1)}%`, "Volatility"]
                        if (name === "return") return [`${Number(value).toFixed(1)}%`, "Expected Return"]
                        return [value, name]
                      }}
                      labelFormatter={(_, payload) => {
                        const data = payload?.[0]?.payload
                        return data ? `${data.name} - ${data.fullName}` : ""
                      }}
                    />
                  }
                />
                <Scatter
                  dataKey="return"
                  fill="hsl(var(--chart-1))"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  r={6}
                />
              </ScatterChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Progress and Efficient Frontier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Optimization Convergence
            </CardTitle>
            <CardDescription>
              {optimizationResult
                ? `Sharpe ratio improvement over ${optimizationResult.iterations} iterations`
                : "Quantum algorithm convergence tracking"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {optimizationResult && convergenceData.length > 0 ? (
              <ChartContainer config={convergenceConfig} className="h-[300px]">
                <LineChart data={convergenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="iteration" label={{ value: "Iteration", position: "insideBottom", offset: -5 }} />
                  <YAxis
                    domain={["dataMin - 0.1", "dataMax + 0.1"]}
                    label={{ value: "Sharpe Ratio", angle: -90, position: "insideLeft" }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [Number(value).toFixed(4), "Sharpe Ratio"]}
                        labelFormatter={(label) => `Iteration ${label}`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="sharpeRatio"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Run optimization to see convergence</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Efficient Frontier
            </CardTitle>
            <CardDescription>Risk-return trade-off curve with optimal portfolio position</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={riskReturnConfig} className="h-[300px]">
              <AreaChart data={efficientFrontierData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="risk"
                  tickFormatter={formatPercentage}
                  label={{ value: "Portfolio Risk (%)", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  tickFormatter={formatPercentage}
                  label={{ value: "Expected Return (%)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        if (name === "return") return [`${Number(value).toFixed(1)}%`, "Expected Return"]
                        return [value, name]
                      }}
                      labelFormatter={(label) => `Risk: ${Number(label).toFixed(1)}%`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="return"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2) / 0.2)"
                  strokeWidth={2}
                />
                {optimizationResult && (
                  <Scatter
                    data={[
                      {
                        risk: optimizationResult.volatility * 100,
                        return: optimizationResult.expectedReturn * 100,
                      },
                    ]}
                    dataKey="return"
                    fill="hsl(var(--accent))"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    r={8}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Asset Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Asset Performance Metrics
          </CardTitle>
          <CardDescription>Comparison of expected returns, volatility, and optimal weights</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={allocationConfig} className="h-[400px]">
            <BarChart data={allocationData.length > 0 ? allocationData : riskReturnData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `${value.toFixed(1)}%`} />
              <YAxis dataKey="name" type="category" width={60} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === "expectedReturn") return [`${Number(value).toFixed(1)}%`, "Expected Return"]
                      if (name === "volatility") return [`${Number(value).toFixed(1)}%`, "Volatility"]
                      if (name === "value") return [`${Number(value).toFixed(1)}%`, "Optimal Weight"]
                      return [`${Number(value).toFixed(1)}%`, name]
                    }}
                  />
                }
              />
              <Bar dataKey={optimizationResult ? "value" : "return"} fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      {optimizationResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Return</p>
                  <p className="text-2xl font-bold text-chart-3">
                    {formatPercentage(optimizationResult.expectedReturn * 100)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-chart-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Risk</p>
                  <p className="text-2xl font-bold text-chart-4">
                    {formatPercentage(optimizationResult.volatility * 100)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-chart-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-accent">{optimizationResult.sharpeRatio.toFixed(3)}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Optimized
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
