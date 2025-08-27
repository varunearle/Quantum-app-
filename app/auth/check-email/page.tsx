import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link to complete your registration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the link in your email to verify your account and start using quantum portfolio optimization.
              </p>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Check your spam folder if you don't see the email within a few minutes.
                </p>
                <Link href="/auth/login" className="text-sm underline underline-offset-4">
                  Back to login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
