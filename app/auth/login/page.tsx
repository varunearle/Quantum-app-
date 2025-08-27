"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Zap, TrendingUp, BarChart3, Shield, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col justify-center space-y-8 px-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Quantum Portfolio</h1>
                <p className="text-xl text-muted-foreground">Optimization Platform</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Harness the power of quantum computing to optimize your investment portfolio with unprecedented precision
              and efficiency.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-chart-1/10 border border-chart-1/20">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">QAOA Algorithm</h3>
                <p className="text-sm text-muted-foreground">
                  Quantum Approximate Optimization Algorithm for maximum Sharpe ratio
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-chart-2/10 border border-chart-2/20">
                <BarChart3 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground">Real-time portfolio visualization and risk assessment</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-chart-3/10 border border-chart-3/20">
                <Shield className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">Bank-grade encryption and secure data management</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-chart-1">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-2">15%</p>
                <p className="text-xs text-muted-foreground">Avg Return</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-chart-3">2.4x</p>
                <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-center lg:hidden mb-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold text-foreground">Welcome Back</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Sign in to access your quantum portfolio optimization dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Sign In to Dashboard
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">New to Quantum Portfolio?</span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Create Your Account
                  <TrendingUp className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" />
              Your data is protected with enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
