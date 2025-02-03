import Plans from "@/components/pricing-plans"

export default async function PlansPage() {
  return (
    <div className="text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-4">Pricing</h1>
        <p className="text-sm text-center text-zinc-400 mb-8">Choose the plan that works for you</p>
        <Plans />
      </div>
    </div>
  )
}