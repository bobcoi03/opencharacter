import { Card } from "@/components/ui/card";
import { getModelArray, getMeteredModelArray, getFreeModelArray, getPaidModelArray } from "@/lib/llm_models";

export const runtime = "edge";

interface ModelPricing {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

interface OpenRouterResponse {
  data: ModelPricing[];
}

async function fetchModelPricing() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', { next: { revalidate: 3600 } });
    const data = await response.json() as OpenRouterResponse;
    return data.data;
  } catch (error) {
    console.error('Failed to fetch model pricing:', error);
    return [];
  }
}

// Client component for expandable description
import { ExpandableDescription } from "./expandable-description";

// Server component
export default async function ModelsPage() {
  const modelPricing = await fetchModelPricing();
  const allModels = getModelArray();
  const freeModels = getFreeModelArray();
  const paidModels = getPaidModelArray().filter(model => !model.metered);
  const meteredModels = getMeteredModelArray();

  const getModelPricing = (modelName: string) => {
    // Try exact match first
    let pricing = modelPricing.find((m: ModelPricing) => m.id === modelName);
    
    if (!pricing) {
      // Try matching by removing any prefix (e.g., "anthropic/" from "anthropic/claude-3-haiku")
      const shortModelName = modelName.split('/').pop() || modelName;
      pricing = modelPricing.find((m: ModelPricing) => {
        const apiModelShortName = m.name.split('/').pop() || m.name;
        return apiModelShortName === shortModelName;
      });
    }

    return pricing;
  };

  return (
    <div className="container py-8 space-y-10 max-w-3xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Models Directory</h1>
        <p className="text-muted-foreground text-lg">
          Browse all {allModels.length} available language models and their capabilities
        </p>
      </div>

      {/* Free Models Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Free Models
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
              {freeModels.length}
            </span>
          </h2>
        </div>
        <p className="text-muted-foreground">
          These models are available to all users without any subscription or pay-as-you-go charges.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {freeModels.map((model) => {
            const pricing = getModelPricing(model.name);
            return (
              <Card key={model.id} className="p-4 bg-stone-900 border-neutral-700 hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <h3 className="font-medium truncate">{model.name}</h3>
                </div>
                {pricing && (
                  <div className="text-xs space-y-1 mt-2">
                    {pricing.description && <ExpandableDescription description={pricing.description} />}
                    <div className="flex flex-wrap gap-x-4 text-neutral-500 mt-1">
                      <p>Context: {pricing?.context_length || pricing?.top_provider?.context_length || 'N/A'} tokens</p>
                      <p>Max output: {pricing?.top_provider?.max_completion_tokens || 'N/A'} tokens</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pro Models Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            Pro Models
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
              {paidModels.length}
            </span>
          </h2>
        </div>
        <p className="text-muted-foreground">
          These models are available to Pro subscribers with unlimited usage included in the subscription.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {paidModels.map((model) => {
            const pricing = getModelPricing(model.name);
            return (
              <Card key={model.id} className="p-4 bg-stone-900 border-neutral-700 hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                  <h3 className="font-medium truncate">{model.name}</h3>
                </div>
                {pricing && (
                  <div className="text-xs space-y-1 mt-2">
                    {pricing.description && <ExpandableDescription description={pricing.description} />}
                    <div className="flex flex-wrap gap-x-4 text-neutral-500 mt-1">
                      <p>Context: {pricing?.context_length || pricing?.top_provider?.context_length || 'N/A'} tokens</p>
                      <p>Max output: {pricing?.top_provider?.max_completion_tokens || 'N/A'} tokens</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pro Metered Models Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Pro Metered Models
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
              {meteredModels.length}
            </span>
          </h2>
        </div>
        <p className="text-muted-foreground">
          These premium models are available on a pay-as-you-go basis with per-token pricing.
        </p>
        <div className="grid grid-cols-1 gap-4">
          {meteredModels.map((model) => {
            const pricing = getModelPricing(model.name);
            return (
              <Card key={model.id} className="p-4 bg-stone-900 border-neutral-700 hover:border-neutral-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <h3 className="font-medium truncate">{model.name}</h3>
                </div>
                {pricing && (
                  <div className="text-xs space-y-1 mt-2">
                    <div className="flex gap-x-4 mb-1">
                      <p>Input: <span className="text-emerald-400">${pricing.pricing.prompt}</span> per token</p>
                      <p>Output: <span className="text-emerald-400">${pricing.pricing.completion}</span> per token</p>
                    </div>
                    {pricing.description && <ExpandableDescription description={pricing.description} />}
                    <div className="flex flex-wrap gap-x-4 text-neutral-500 mt-1">
                      <p>Context: {pricing?.context_length || pricing?.top_provider?.context_length || 'N/A'} tokens</p>
                      <p>Max output: {pricing?.top_provider?.max_completion_tokens || 'N/A'} tokens</p>
                      {pricing?.top_provider?.is_moderated !== undefined && (
                        <p>{pricing.top_provider.is_moderated ? '✓ Moderated' : '✗ Unmoderated'}</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
