"use client"

import type React from "react"
import { Check, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Separator } from "./ui/separator"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

interface PricingOption {
  label: string
  value: string
  price: number
  priceId: string
}

interface PlanCardProps {
  title: string
  price: string
  features: string[]
  buttonText: string
  isPro?: boolean
  billingCycle: string
  pricingOptions: PricingOption[]
}

const PlanCard: React.FC<PlanCardProps> = ({ 
  title, 
  price, 
  features, 
  buttonText, 
  isPro,
  billingCycle,
  pricingOptions 
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const [hasSubscription, setHasSubscription] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkSubscription() {
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/subscriptions/check")
          const data = await response.json() as { hasActiveSubscription: boolean }
          setHasSubscription(data.hasActiveSubscription)
        } catch (error) {
          console.error("Failed to check subscription status", error)
        }
      }
    }
    checkSubscription()
  }, [session?.user?.id])

  const handleUpgrade = async () => {
    if (!session) {
      signIn('google', { redirect: true })
      return
    }

    if (hasSubscription && isPro) {
      router.push('/subscription')
      return
    }

    setIsLoading(true)
    const selectedPriceId = pricingOptions.find(option => option.value === billingCycle)?.priceId

    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priceId: selectedPriceId }),
    })

    if (response.ok) {
      const { url } = (await response.json()) as any
      window.location.href = url
    } else {
      console.error("Failed to create subscription")
    }
    setIsLoading(false)
  }

  // Don't show button for free tier if user is signed in
  if (!isPro && session) {
    return (
      <div
        className={`
        relative rounded-2xl border flex flex-col w-full max-w-xs border-zinc-800
        p-1 transition-all duration-300 hover:border-zinc-700
      `}
      >
        <div className="w-full h-full border rounded-2xl p-6 bg-neutral-950 flex-1">
          <div className="relative flex flex-col flex-1 h-full">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{price}</span>
                {price !== "Free" && <span className="text-zinc-400 ml-2">/month</span>}
              </div>
            </div>

            <Separator />

            <h2 className="text-sm font-medium mt-4">{isPro ? "Everything in Hobby, plus" : "Includes"}</h2>

            <ul className="space-y-1 mb-8 flex-1 mt-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="mr-3 h-3 w-3 text-green-500 shrink-0" />
                  <span className="text-zinc-300 text-xs">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const getButtonText = () => {
    if (isLoading) return <Loader2 className="animate-spin mx-auto h-4" />
    if (hasSubscription && isPro) return "Manage"
    return buttonText
  }

  return (
    <div
      className={`
      relative rounded-2xl border flex flex-col w-full max-w-xs border-zinc-800
      p-1 transition-all duration-300 hover:border-zinc-700
    `}
    >
      <div className="w-full h-full border rounded-2xl p-6 bg-neutral-950 flex-1">
        <div className="relative flex flex-col flex-1 h-full">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <div className="mb-6">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{price}</span>
              {price !== "Free" && <span className="text-zinc-400 ml-2">/month</span>}
            </div>
          </div>

          <Separator />

          <h2 className="text-sm font-medium mt-4">{isPro ? "Everything in Hobby, plus" : "Includes"}</h2>

          <ul className="space-y-1 mb-8 flex-1 mt-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <Check className="mr-3 h-3 w-3 text-green-500 shrink-0" />
                <span className="text-zinc-300 text-xs">{feature}</span>
              </li>
            ))}
          </ul>
          <button
            disabled={isLoading}
            onClick={handleUpgrade}
            className={`
              w-1/2 rounded-lg py-2.5 font-medium transition-all duration-300 text-sm bg-white text-black hover:bg-zinc-200
              }
            `}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  )
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<string>("monthly")

  const pricingOptions: PricingOption[] = [
    {
      label: "Monthly",
      value: "monthly",
      price: 15,
      priceId: "price_1QoQTYPMkm1vUm1bjCLX00Gh"
    },
    {
      label: "Yearly",
      value: "yearly",
      price: 10,
      priceId: "price_1QoQxBPMkm1vUm1b4wZso31k"
    },
  ]

  const selectedOption = pricingOptions.find((option) => option.value === billingCycle)!

  return (
    <div>
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1 bg-zinc-800/50 rounded-lg">
          {pricingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setBillingCycle(option.value)}
              className={`
                px-4 py-1 rounded-md text-xs font-medium transition-all duration-200
                ${billingCycle === option.value ? "bg-zinc-900 text-white shadow" : "text-zinc-400 hover:text-white"}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-col md:flex-row flex gap-2 mx-auto justify-center items-center md:items-stretch">
        <PlanCard
          title="Hobby"
          price="Free"
          features={[
            "Access to basic models",
            "Unlimited completions",
            "Characters",
            "Personas",
          ]}
          buttonText="GET STARTED"
          billingCycle={billingCycle}
          pricingOptions={pricingOptions}
        />
        <PlanCard
          title="Pro"
          price={`$${selectedOption.price}`}
          features={[
            "No ads",
            "Access to all models",
            "Unlimited premium model completions",
            "Creator Dashboard",
            "Priority support",
            "Profile badge",
          ]}
          buttonText="GET STARTED"
          isPro
          billingCycle={billingCycle}
          pricingOptions={pricingOptions}
        />
      </div>
    </div>
  )
}

export default Plans

