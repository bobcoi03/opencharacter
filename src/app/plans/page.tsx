import React from 'react'
import { getModelArray } from "@/lib/llm_models"
import { Check } from "lucide-react"
import Link from 'next/link'

export const runtime = 'edge'

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
  buttonAction: string
  isStandard?: boolean
}

const PlanCard: React.FC<PlanCardProps> = ({ title, price, features, models, buttonText, buttonAction, isStandard }) => (
  <div
    className={`p-8 rounded-xl ${
      isStandard ? 'bg-gradient-to-br from-primary to-primary/90 text-black' : 'bg-secondary'
    } shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl`}
  >
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-4xl font-bold mb-6">{price}</p>
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
          isStandard ? 'bg-background text-primary' : 'bg-primary text-background'
        } py-3 px-4 rounded-lg font-medium transition duration-300 hover:opacity-90 hover:scale-105 transform w-full`}
      >
        {buttonText}
      </button>
    </Link>
  </div>
)

const Plans: React.FC = () => {
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
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
          price="$12/month"
          features={[
            "Access to all models (free + paid)",
            "Up to 64x more memory",
            "Up to 3x faster response time",
            "Higher quality messages",
            "Unlimited messages",
            "Profile Badge",
            "Creator Dashboard"
          ]}
          models={paidModels}
          buttonText="Upgrade Now"
          buttonAction="https://discordapp.com/users/368400765754277889"
          isStandard
        />
      </div>
    </div>
  )
}

export default Plans