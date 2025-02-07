"use client"

import { useState } from "react"
import { ColourfulText } from "./colourful-text"
import { Separator } from "./ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface StripeResponse {
  url: string;
}

export default function PlanHero() {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: plan === "monthly" ? "Pro+ Monthly" : "Pro+ Yearly" })
      });

      if (response.ok) {
        const { url } = await response.json() as StripeResponse;
        window.location.href = url;
      } else {
        console.error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-black w-full h-[60vh] md:h-[70vh] flex flex-col md:flex-row items-center justify-center md:px-24 p-6">
      <div className="flex flex-col justify-center md:h-full mx-auto w-full gap-8 md:max-w-4xl">
        <div className="text-white font-bold text-center">
          <div className="text-center text-3xl sm:text-5xl md:text-6xl">
            <ColourfulText text="OpenCharacter " />
            <ColourfulText text="Pro" />
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-white text-sm md:text-lg text-center font-semibold">
            Elevate your experience with OpenCharacter Pro. Ads-free, Premium AI models, faster response times and more memory.
          </p>
        </div>

        <div className="w-full flex flex-col gap-6 md:flex-row mt-4">
          <Button 
            onClick={() => handleUpgrade("monthly")}
            disabled={isLoading}
            className="md:w-1/2 bg-transparent font-light hover:bg-zinc-800 text-white rounded-3xl border border-zinc-800 object-contain p-6 w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <p className="text-white text-lg font-light">
                $12/Month
              </p>
            )}
            
          </Button>
          <Button 
            onClick={() => handleUpgrade("yearly")}
            disabled={isLoading}
            className="md:w-1/2 bg-blue-700 font-light hover:bg-blue-800 text-white rounded-3xl border border-zinc-800 object-contain p-6 w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <p className="text-white text-lg font-light">
                $108/Year (save 25%)         
              </p>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}