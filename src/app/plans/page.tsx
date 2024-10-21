import React from 'react'
import { getModelArray } from "@/lib/llm_models"
import { Check } from "lucide-react"

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
  isPremium?: boolean
}

const PlanCard: React.FC<PlanCardProps> = ({ title, price, features, models, buttonText, isPremium }) => (
  <div
    className={`p-8 rounded-xl ${
      isPremium ? 'bg-gradient-to-br from-primary to-primary/80' : 'bg-secondary'
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
          <li key={index} className="text-xs bg-background/10 rounded px-2 py-1">{model.name}</li>
        ))}
      </ul>
    </div>
    <button
      className={`${
        isPremium ? 'bg-background text-primary' : 'bg-primary text-background'
      } py-3 px-4 rounded-lg font-medium transition duration-300 hover:opacity-90 hover:scale-105 transform`}
    >
      {buttonText}
    </button>
  </div>
)

const Plans: React.FC = () => {
  const allModels = getModelArray()
  const freeModels = allModels.filter(model => !model.paid)
  const paidModels = allModels.filter(model => model.paid)

  return (
    <div className="container mx-auto px-4 py-16 text-foreground">
      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PlanCard
          title="Free Plan"
          price="$0/month"
          features={[
            "Access to all free models",
            "Standard memory allocation",
            "Regular response speed",
            "Unlimited messages"
          ]}
          models={freeModels}
          buttonText="Get Started"
        />
        <PlanCard
          title="Premium Plan"
          price="$12/month"
          features={[
            "Access to all models (free + paid)",
            "Up to 64x more memory",
            "Up to 3x faster response time",
            "Higher quality messages",
            "Unlimited messages",
          ]}
          models={paidModels}
          buttonText="Upgrade Now"
          isPremium
        />
      </div>
    </div>
  )
}

export default Plans