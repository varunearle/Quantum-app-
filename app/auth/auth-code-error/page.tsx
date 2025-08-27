import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>There was an issue confirming your email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                The confirmation link may have expired or been used already. Please try signing up again or contact
                support if the issue persists.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/auth/sign-up">Try Again</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
