import Plans from "@/components/pricing-plans"
import FeatureComparison from "@/components/feature-comparison"

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Pricing</h1>
        <p className="text-lg text-center text-zinc-400 mb-4">Choose the plan that works for you</p>
        <Plans />
        <FeatureComparison />
      </div>
    </div>
  )
}

