import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export const runtime = "edge"

export default function SubmitSuccess() {
  return (
    <div className="flex justify-center p-6 md:p-8 mb-12">
      <div className="text-center space-y-6 max-w-lg">
        <div className="flex justify-center">
          <Heart className="h-16 w-16 text-pink-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Thank you for posting about our website!
        </h1>
        
        <p className="text-lg text-gray-400">
          We{"'"}ll review your submission and get back to you soon!<br />
          Usually within 3 days or less.
        </p>

        <div className="pt-6">
          <Link href="/">
            <Button className="bg-white text-black hover:bg-gray-100">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}