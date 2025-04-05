"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Check, Loader2, X } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

interface PricingOption {
  label: string
  value: string
  price: number
  priceId: string
}

interface PricingDialogProps {
  messagesLength: number
  onClose: () => void
}

const pricingOptions: PricingOption[] = [
  {
    label: "Monthly",
    value: "monthly",
    price: 15,
    priceId: "price_1QpzDAAT8u0C5FCyLTyBSZQg",
  },
  {
    label: "Yearly",
    value: "yearly",
    price: 10,
    priceId: "price_1QpzEKAT8u0C5FCyUP29l0SV",
  },
]

export function PricingDialog({ messagesLength, onClose }: PricingDialogProps) {
  const [open, setOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<string>("monthly")
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  // Show dialog when messagesLength reaches specific thresholds
  useEffect(() => {
    const thresholds = [12, 40, 120, 160, 200, 240, 280, 300]
    if (messagesLength > 0 && thresholds.includes(messagesLength)) {
      setOpen(true)
    }
  }, [messagesLength])

  const handleClose = () => {
    setOpen(false)
    onClose()
  }

  const selectedOption = pricingOptions.find((option) => option.value === billingCycle)!

  const handleUpgrade = async () => {
    if (!session) {
      signIn("google", { redirect: true })
      return
    }

    setIsLoading(true)
    const selectedPriceId = pricingOptions.find((option) => option.value === billingCycle)?.priceId

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: selectedPriceId }),
      })

      if (response.ok) {
        const { url } = await response.json() as { url: string }
        window.location.href = url
      } else {
        console.error("Failed to create subscription")
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const proFeatures = [
    "No ads",
    "Access to all models",
    "Unlimited premium model completions",
    "Creator Dashboard",
    "Priority support",
    "Profile badge",
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] bg-black border border-zinc-800 rounded-[24px] p-0 overflow-hidden">
        
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Billing toggle */}
          <div className="flex justify-center mb-6">
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

          {/* Pro plan card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[24px] border bg-gradient-to-t from-pink-900 to-black border-zinc-800 p-6 transition-all duration-300 hover:border-zinc-700"
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Pro</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">${selectedOption.price}</span>
                    <span className="text-zinc-400 ml-2 text-xs">
                      {billingCycle === "yearly" ? "/user/month" : "/month"}
                    </span>
                  </div>
                </div>
                <div className="bg-pink-600/20 text-pink-500 text-xs font-medium px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-zinc-300">
                    <Check className="mr-2 h-4 w-4 text-pink-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="default"
                size="lg"
                disabled={isLoading}
                onClick={handleUpgrade}
                className="w-full rounded-full bg-white text-black hover:bg-zinc-200 text-sm py-6"
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto h-4" /> : "UPGRADE NOW"}
              </Button>
            </div>
          </motion.div>

          {/* Skip button */}
          <div className="mt-4 text-center">
            <button 
              onClick={handleClose}
              className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
            >
              Continue with free plan
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}