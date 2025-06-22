import { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Subscription Cancelled",
  description: "Your subscription process was cancelled",
}

export default function SubscriptionCancelPage() {
  return (
    <div className="container flex flex-col items-center justify-center py-20 space-y-6 max-w-lg mx-auto">
      <Card className="w-full border-zinc-800 bg-gradient-to-t from-zinc-900 to-black">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Subscription Cancelled</CardTitle>
          <CardDescription>
            Your subscription process was not completed
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-sm text-zinc-400 mb-6">
            <p>The subscription process was cancelled. No charges have been made to your account.</p>
            <p className="mt-2">If you encountered any issues during checkout, please contact our support team.</p>
          </div>
          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full rounded-full">
              <Link href="/pricing">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full border-zinc-800 hover:bg-zinc-900">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 