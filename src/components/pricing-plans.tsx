"use client"

import React from 'react'
import { getModelArray } from "@/lib/llm_models"
import { Check, ChevronDown } from "lucide-react"
import Link from 'next/link'
import { useState } from 'react'

interface Model {
  id: string
  name: string
  paid: boolean
}

interface PlanCardProps {
  title: string
  price: string
  subPrice?: string
  features: string[]
  models: Model[]
  buttonText: string
  buttonAction: string
  isStandard?: boolean
  isPro?: boolean
}

interface PricingOption {
  label: string
  value: string
  monthlyPrice: number
  savings?: number
}

const PlanCard: React.FC<PlanCardProps> = ({ 
  title, 
  price, 
  subPrice, 
  features, 
  models, 
  buttonText, 
  buttonAction, 
  isStandard,
  isPro 
}) => {
  const [isModelsOpen, setIsModelsOpen] = useState(false)

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
        {subPrice && <p className="text-sm opacity-75 mt-1">{subPrice}</p>}
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
      <Link href={buttonAction} target="_blank">
        <button
          className={`${
            isStandard ? 'bg-background text-primary' : 
            isPro ? 'bg-white text-violet-600' :
            'bg-primary text-background'
          } py-2 px-3 rounded-lg font-medium transition duration-300 hover:opacity-90 hover:scale-105 transform w-full`}
        >
          {buttonText}
        </button>
      </Link>
    </div>
  )
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<string>('monthly')
  const allModels = getModelArray()
  const freeModels = allModels.filter(model => !model.paid)
  const paidModels = allModels.filter(model => model.paid)

  const pricingOptions: PricingOption[] = [
    {
      label: "Monthly",
      value: "monthly",
      monthlyPrice: 12,
    },
    {
      label: "3 Months",
      value: "quarterly",
      monthlyPrice: 11,
      savings: 8.3
    },
    {
      label: "6 Months",
      value: "biannual",
      monthlyPrice: 10,
      savings: 16.7
    },
    {
      label: "Yearly",
      value: "yearly",
      monthlyPrice: 9,
      savings: 25
    }
  ]

  const proPricingOptions: PricingOption[] = [
    {
      label: "Monthly",
      value: "monthly",
      monthlyPrice: 50,
    },
    {
      label: "3 Months",
      value: "quarterly",
      monthlyPrice: 45,
      savings: 10
    },
    {
      label: "6 Months",
      value: "biannual",
      monthlyPrice: 40,
      savings: 20
    },
    {
      label: "Yearly",
      value: "yearly",
      monthlyPrice: 35,
      savings: 30
    }
  ]

  const selectedOption = pricingOptions.find(option => option.value === billingCycle)!
  const selectedProOption = proPricingOptions.find(option => option.value === billingCycle)!

  const getStandardPlanPrice = () => {
    const monthlyPrice = selectedOption.monthlyPrice
    const months = {
      monthly: 1,
      quarterly: 3,
      biannual: 6,
      yearly: 12
    }[billingCycle]
    
    return `$${monthlyPrice * months!}/${billingCycle === 'monthly' ? 'month' : 'total'}`
  }

  const getStandardPlanSubPrice = () => {
    if (billingCycle === 'monthly') return undefined
    return `$${selectedOption.monthlyPrice}/month, billed ${billingCycle}${selectedOption.savings ? ` (Save ${selectedOption.savings}%)` : ''}`
  }

  const getProPlanPrice = () => {
    const monthlyPrice = selectedProOption.monthlyPrice
    const months = {
      monthly: 1,
      quarterly: 3,
      biannual: 6,
      yearly: 12
    }[billingCycle]
    
    return `$${monthlyPrice * months!}/${billingCycle === 'monthly' ? 'month' : 'total'}`
  }

  const getProPlanSubPrice = () => {
    if (billingCycle === 'monthly') return undefined
    return `$${selectedProOption.monthlyPrice}/month, billed ${billingCycle}${selectedProOption.savings ? ` (Save ${selectedProOption.savings}%)` : ''}`
  }

  return (
    <div className="container mx-auto px-4 py-4 text-foreground mb-24">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
        <p className="font-bold text-center">Note:</p>
        <p className='text-center'>I haven{"'"}t implemented payments yet, so you{"'"}ll have to <Link href="https://discordapp.com/users/368400765754277889" target="_blank" className="text-blue-500 underline">DM me on Discord</Link></p>
      </div>
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
              {option.savings && (
                <span className="ml-1 text-xs opacity-75">
                  (-{option.savings}%)
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <PlanCard
          title="Free Plan"
          price="$0/month"
          features={[
            "Access to all free models",
            "Standard memory allocation",
            "Regular response speed",
            "Unlimited messages",
            "Creator Dashboard"
          ]}
          models={freeModels}
          buttonText="Get Started"
          buttonAction="/signin"
        />
        <PlanCard
          title="Standard Plan"
          price={getStandardPlanPrice()}
          subPrice={getStandardPlanSubPrice()}
          features={[
            "Access to all models (free + paid)",
            "Up to 64x more memory",
            "Up to 3x faster response time",
            "Higher quality messages",
            "Unlimited messages",
            "Profile Badge",
            "Creator Dashboard",
          ].filter((feature): feature is string => feature !== undefined)}
          models={paidModels}
          buttonText="Upgrade Now"
          buttonAction="https://discordapp.com/users/368400765754277889"
          isStandard
        />
        <PlanCard
          title="Pro Plan"
          price={getProPlanPrice()}
          subPrice={getProPlanSubPrice()}
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
          ].filter((feature): feature is string => feature !== undefined)}
          models={paidModels}
          buttonText="Upgrade Now"
          buttonAction="https://discordapp.com/users/368400765754277889"
          isPro
        />
      </div>
    </div>
  )
}

export default Plans