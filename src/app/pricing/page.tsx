import Plans from "@/components/pricing-plans"
import FeatureComparison from "@/components/feature-comparison"
import ModelComparison from "@/components/model-comparison"
import { Showcase } from "@/components/showcase"
import { models } from "@/lib/llm_models"

export const runtime = 'edge';

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Pricing</h1>
        <p className="text-lg text-center text-zinc-400 mb-4">Choose the plan that works for you</p>
        <Plans />
        <FeatureComparison />
        <Showcase
            className={""}
            title="Available Models"
            description={`OpenCharacter provides access to ${Object.keys(models).length} top-tier AI models, along with the flexibility to proxy any model through OpenAI API-compatible endpoints.`}
            videoUrl="https://random-stuff-everythingcompany.s3.us-west-1.amazonaws.com/model-showcase.mp4"
            videoClassName="h-[95%] absolute bottom-0 left-0 right-0 mx-auto rounded-t-xl"
        />
        <Showcase
            className={""}
            backgroundImage="/gradient.jpeg"
            description="OpenCharacter Pro includes a powerful Creator Dashboard, allowing you to manage your characters and track how other users interact with them."
            title="Creator Dashboard"
            videoClassName="w-[95%] md:w-[90%] absolute bottom-0 left-0 right-0 mx-auto rounded-t-xl"
            videoUrl="https://random-stuff-everythingcompany.s3.us-west-1.amazonaws.com/dashboard-showcase.mp4"
        />
        <ModelComparison />
      </div>
    </div>
  )
}

