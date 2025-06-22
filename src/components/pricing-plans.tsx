"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

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
  isPro: boolean
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
  pricingOptions,
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
          const data = (await response.json()) as { hasActiveSubscription: boolean }
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
      signIn("google", { redirect: true })
      return
    }

    if (hasSubscription && isPro) {
      router.push("/subscription")
      return
    }

    setIsLoading(true)
    
    // Use Stripe API route
    try {
      const selectedOption = pricingOptions.find((option) => option.value === billingCycle)
      
      if (!selectedOption?.priceId) {
        console.error("No price ID found for billing cycle:", billingCycle)
        alert("Something went wrong. Please try again later.")
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          priceId: selectedOption.priceId
        }),
      })

      const data = await response.json() as { url?: string; error?: string }

      if (!response.ok) {
        console.error("Failed to create subscription:", data.error || "Unknown error")
        alert("Failed to create subscription. Please try again later.")
        setIsLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned")
        alert("Something went wrong. Please try again later.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error creating checkout session:", error)
      alert("An error occurred. Please try again later.")
      setIsLoading(false)
    }
  }

  // Don't show button for free tier if user is signed in
  if (!isPro && session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-[32px] border border-zinc-800 bg-black p-6 transition-all duration-300 hover:border-zinc-700 w-full max-w-sm"
      >
        <div className="flex flex-col h-full">
          <h3 className="text-xl font-semibold mb-1">{title}</h3>
          <div className="mb-4">
            <div className="flex items-baseline">
              <span className="text-5xl font-bold">{price}</span>
            </div>
          </div>

          <h2 className="text-sm text-zinc-400 mb-3">{isPro ? "Everything in Hobby, plus" : "Includes"}</h2>

          <ul className="space-y-2 mb-6 flex-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-xs text-zinc-300">
                <Check className="mr-2 h-3.5 w-3.5 text-white shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    )
  }

  const getButtonText = () => {
    if (isLoading) return <Loader2 className="animate-spin mx-auto h-4" />
    if (hasSubscription && isPro) return "Manage"
    return buttonText
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-[32px] border flex flex-col w-full max-w-sm ${
        isPro ? "bg-gradient-to-t from-pink-900 to-black" : "bg-black"
      } border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700`}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <div className="mb-4">
          <div className="flex items-baseline">
            <span className="text-5xl font-bold">{price}</span>
            {price !== "Free" && (
              <span className="text-zinc-400 ml-2 text-xs">/month</span>
            )}
          </div>
          {isPro && (
            <p className="text-xs text-green-400 mt-1 mb-3">3-day free trial included</p>
          )}
        </div>

        <h2 className="text-sm text-zinc-400 mb-3">{isPro ? "Everything in Hobby, plus" : "Includes"}</h2>

        <ul className="space-y-2 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-xs text-zinc-300">
              <Check className="mr-2 h-3.5 w-3.5 text-white shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          variant={isPro ? "default" : "secondary"}
          size="default"
          disabled={isLoading}
          onClick={handleUpgrade}
          className="w-full rounded-full bg-white text-black hover:bg-zinc-200 text-sm py-2"
        >
          {getButtonText()}
        </Button>
      </div>
    </motion.div>
  )
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<string>("monthly")

  // Updated with Stripe price IDs from environment variables
  console.log("monthly", process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID)
  console.log("yearly", process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID)
  const pricingOptions: PricingOption[] = [
    {
      label: "Monthly",
      value: "monthly",
      price: 12,
      priceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!,
    },
    {
      label: "Yearly",
      value: "yearly",
      price: 7,
      priceId: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!,
    },
  ]

  const selectedOption = pricingOptions.find((option) => option.value === billingCycle)!

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full border border-zinc-800 p-1 bg-black">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
              billingCycle === "monthly" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            MONTHLY
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-3 py-1.5 text-xs rounded-full transition-all flex items-center gap-2 ${
              billingCycle === "yearly" ? "bg-zinc-800 text-white" : "text-zinc-400"
            }`}
          >
            YEARLY <span className="text-[10px] text-green-500">(SAVE 33%)</span>
          </button>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6 mx-auto max-w-3xl place-items-center md:place-items-stretch">
        <PlanCard
          title="Hobby"
          price="Free"
          features={["Access to basic models", "300 messages per day", "Characters", "Personas", "ads"]}
          buttonText="GET STARTED"
          billingCycle={billingCycle}
          pricingOptions={pricingOptions}
          isPro={false}
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
          isPro={true}
          billingCycle={billingCycle}
          pricingOptions={pricingOptions}
        />
      </div>
    </div>
  )
}

export default Plans

