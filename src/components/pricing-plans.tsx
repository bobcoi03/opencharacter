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
  isEnterprise?: boolean
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
  isEnterprise 
}) => {
  const [isModelsOpen, setIsModelsOpen] = useState(false)

  return (
    <div
      className={`p-8 rounded-xl ${
        isStandard ? 'bg-gradient-to-br from-primary to-primary/90 text-black' : 
        isEnterprise ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white' : 
        'bg-secondary'
      } shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl`}
    >
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <div className="mb-6">
        <p className="text-4xl font-bold">{price}</p>
        {subPrice && <p className="text-sm opacity-75 mt-1">{subPrice}</p>}
      </div>
      <ul className="mb-6 flex-grow space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-3 text-green-400" size={18} />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mb-6">
        <button 
          onClick={() => setIsModelsOpen(!isModelsOpen)}
          className="w-full flex items-center justify-between font-semibold text-sm uppercase tracking-wide hover:opacity-80 transition-opacity"
        >
          <span>Included Models</span>
          <ChevronDown 
            size={20} 
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
      <Link href={buttonAction} target="_blank">
        <button
          className={`${
            isStandard ? 'bg-background text-primary' : 
            isEnterprise ? 'bg-white text-violet-600' :
            'bg-primary text-background'
          } py-3 px-4 rounded-lg font-medium transition duration-300 hover:opacity-90 hover:scale-105 transform w-full`}
        >
          {buttonText}
        </button>
      </Link>
    </div>
  )
}

const Plans: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<string>('yearly') // Changed default to yearly
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

  const selectedOption = pricingOptions.find(option => option.value === billingCycle)!

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
    return `$${selectedOption.monthlyPrice}/month, billed ${billingCycle}ly${selectedOption.savings ? ` (Save ${selectedOption.savings}%)` : ''}`
  }

  return (
    <div className="container mx-auto px-4 py-16 text-foreground">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded">
        <p className="font-bold text-center">Note:</p>
        <p className='text-center'>I haven{"'"}t implemented payments yet, so you{"'"}ll have to <Link href="https://discordapp.com/users/368400765754277889" target="_blank" className="text-blue-500 underline">DM me on Discord</Link></p>
      </div>
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
      
      <div className="flex justify-center items-center gap-4 mb-8">
        <div className="inline-flex p-1 bg-secondary rounded-lg">
          {pricingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setBillingCycle(option.value)}
              className={`px-4 py-2 rounded-md text-sm transition-all duration-200 ${
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

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
            selectedOption.savings ? `Save ${selectedOption.savings}%` : undefined
          ].filter((feature): feature is string => feature !== undefined)}
          models={paidModels}
          buttonText="Upgrade Now"
          buttonAction="https://discordapp.com/users/368400765754277889"
          isStandard
        />
        <PlanCard
          title="Enterprise"
          price="Custom"
          subPrice="Tailored to your needs"
          features={[
            "Everything in Standard",
            "Dedicated support",
            "API access",
            "Custom integrations",
            "Advanced analytics",
            "Priority feature requests"
          ]}
          models={paidModels}
          buttonText="Contact Sales"
          buttonAction="mailto:minh@everythingcompany.co"
          isEnterprise
        />
      </div>
    </div>
  )
}

export default Plans