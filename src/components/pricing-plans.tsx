"use client"

import React from 'react'
import { getModelArray } from "@/lib/llm_models"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { useState } from 'react'

interface Model {
  id: string
  name: string
  paid: boolean
}

interface PlanCardProps {
  title: string
  price: string
  features: string[]
  models: Model[]
  buttonText: string
  isStandard?: boolean
  isPro?: boolean
}

const PlanCard: React.FC<PlanCardProps> = ({ 
  title, 
  price, 
  features, 
  models, 
  buttonText, 
  isStandard,
  isPro 
}) => {
  const [isModelsOpen, setIsModelsOpen] = useState(false)

  const handleUpgrade = async () => {
    const response = await fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan: title })
    });

    if (response.ok) {
      const { url } = await response.json() as any;
      window.location.href = url;
    } else {
      console.error('Failed to create subscription');
    }
  }

  return (
    <div
      className={`p-6 rounded-xl ${
        isStandard ? 'bg-gradient-to-br from-primary to-primary/90 text-black' : 
        isPro ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white' : 
        'bg-secondary'
      } shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl`}
    >
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div className="mb-4">
        <p className="text-3xl font-bold">{price}</p>
      </div>
      <ul className="mb-4 flex-grow space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-2 text-green-400" size={16} />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      {!isPro && (
        <div className="mb-4">
          <button 
            onClick={() => setIsModelsOpen(!isModelsOpen)}
            className="w-full flex items-center justify-between font-semibold text-sm uppercase tracking-wide hover:opacity-80 transition-opacity"
          >
            <span>Included Models</span>
            <ChevronDown 
              size={18} 
              className={`transition-transform duration-200 ${isModelsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-200 ${
            isModelsOpen ? 'mt-2 max-h-96' : 'max-h-0'
          }`}>
            {models.map((model, index) => (
              <ul key={index} className="text-[9px] bg-background/10 rounded px-2 py-1">{model.name}</ul>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={handleUpgrade}
        className={`${
          isStandard ? 'bg-background text-primary' : 
          isPro ? 'bg-white text-violet-600' :
          'bg-primary text-background'
        } py-2 px-3 rounded-lg font-medium transition duration-300 hover:opacity-90 hover:scale-105 transform w-full`}
      >
        {buttonText}
      </button>
    </div>
  )
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<string>('monthly')
  const allModels = getModelArray()
  const paidModels = allModels.filter(model => model.paid)

  const pricingOptions = [
    {
      label: "Monthly",
      value: "monthly",
      monthlyPrice: 12,
    },
    {
      label: "Yearly",
      value: "yearly",
      monthlyPrice: 9,
    }
  ]

  const proPricingOptions = [
    {
      label: "Monthly",
      value: "monthly",
      monthlyPrice: 50,
    },
    {
      label: "Yearly",
      value: "yearly",
      monthlyPrice: 35,
    }
  ]

  const selectedOption = pricingOptions.find(option => option.value === billingCycle)!
  const selectedProOption = proPricingOptions.find(option => option.value === billingCycle)!

  const getStandardPlanPrice = () => `$${selectedOption.monthlyPrice}/month`
  const getProPlanPrice = () => `$${selectedProOption.monthlyPrice}/month`

  return (
    <div className="container mx-auto px-4 py-4 text-foreground mb-24">
      
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      
      <div className="flex justify-center items-center gap-2 mb-6 max-w-full">
        <div className="inline-flex p-1 bg-secondary rounded-lg">
          {pricingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setBillingCycle(option.value)}
              className={`px-2 py-1 rounded-md text-[10px] transition-all duration-200 ${
                billingCycle === option.value
                  ? 'bg-primary text-background'
                  : 'hover:bg-background/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <PlanCard
          title="Standard Plan"
          price={getStandardPlanPrice()}
          features={[
            "Access to all models (free + paid)",
            "Up to 64x more memory",
            "Up to 3x faster response time",
            "Higher quality messages",
            "Unlimited messages",
            "Profile Badge",
            "Creator Dashboard",
          ]}
          models={paidModels}
          buttonText="Upgrade Now"
          isStandard
        />
        <PlanCard
          title="Pro Plan"
          price={getProPlanPrice()}
          features={[
            "Everything in Standard Plan",
            "Highest quality messages",
            "Unlimited messages",
            "Profile Badge",
            "Creator Dashboard",
            "Priority support",
            "Access to GPT-4o",
            "GPT-o1",
            "GPT-o1-mini",
            "Claude 3.5 Sonnet",
            "Claude Opus",
            "Gemini 1.5 Pro",
          ]}
          models={paidModels}
          buttonText="Upgrade Now"
          isPro
        />
      </div>
    </div>
  )
}

export default Plans