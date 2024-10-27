"use client"

import React from 'react'
import { getModelArray } from "@/lib/llm_models"
import { Check } from "lucide-react"
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
}) => (
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
      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide">Included Models:</h3>
      <ul className="grid grid-cols-2 gap-2">
        {models.map((model, index) => (
          <li key={index} className="text-[9px] bg-background/10 rounded px-2 py-1">{model.name}</li>
        ))}
      </ul>
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

const Plans: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false)
  const allModels = getModelArray()
  const freeModels = allModels.filter(model => !model.paid)
  const paidModels = allModels.filter(model => model.paid)

  return (
    <div className="container mx-auto px-4 py-16 text-foreground">
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded">
        <p className="font-bold text-center">Note:</p>
        <p className='text-center'>I haven{"'"}t implemented payments yet, so you{"'"}ll have to <Link href="https://discordapp.com/users/368400765754277889" target="_blank" className="text-blue-500 underline">DM me on Discord</Link></p>
      </div>
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
      
      <div className="flex justify-center items-center gap-4 mb-8">
        <span className={`${!isYearly ? 'text-primary font-bold' : ''}`}>Monthly</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-16 h-8 bg-secondary rounded-md p-1 relative"
        >
          <div className={`w-6 h-6 bg-primary rounded-md transition-transform duration-200 transform ${isYearly ? 'translate-x-8' : ''}`} />
        </button>
        <span className={`${isYearly ? 'text-primary font-bold' : ''}`}>Yearly (Save 17%)</span>
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
          price={isYearly ? "$120/year" : "$12/month"}
          subPrice={isYearly ? "Only $10/month, billed annually" : undefined}
          features={[
            "Access to all models (free + paid)",
            "Up to 64x more memory",
            "Up to 3x faster response time",
            "Higher quality messages",
            "Unlimited messages",
            "Profile Badge",
            "Creator Dashboard",
            isYearly ? "Save $24 annually" : undefined
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