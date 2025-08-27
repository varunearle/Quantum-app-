import { Loader2, Zap } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-accent animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading Quantum Portfolio</h2>
          <p className="text-muted-foreground">Initializing optimization engine...</p>
        </div>
      </div>
    </div>
  )
}
