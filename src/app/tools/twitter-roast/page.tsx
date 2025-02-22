import { Card, CardContent } from "@/components/ui/card"
import { TwitterRoastForm } from "@/components/twitter-roast"

export const runtime = 'edge';

export default function TwitterRoastPage() {
  return (
    <div className="container max-w-2xl py-10 mx-auto bg-neutral-900">
      <Card className="bg-neutral-900 border-none">
        <CardContent>
          <TwitterRoastForm />
        </CardContent>
      </Card>
    </div>
  )
}
