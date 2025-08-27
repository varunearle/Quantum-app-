import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Page Not Found
          </CardTitle>
          <CardDescription>The quantum portfolio page you're looking for doesn't exist</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Return to Portfolio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
