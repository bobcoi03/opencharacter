"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InfoCircledIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getMeteredModelArray } from "@/lib/llm_models";
import ReactMarkdown from "react-markdown";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPayAsYouGo, updatePayAsYouGo } from "@/app/actions/user";
import { useToast } from "@/hooks/use-toast";

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

export default function PayAsYouGoToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [modelPricing, setModelPricing] = useState<ModelPricing[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const meteredModels = getMeteredModelArray();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayAsYouGoStatus = async () => {
      try {
        setIsLoading(true);
        const result = await getPayAsYouGo();
        if (result.success) {
          setIsEnabled(result.pay_as_you_go);
        }
      } catch (error) {
        console.error('Failed to fetch pay-as-you-go status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayAsYouGoStatus();
  }, []);

  useEffect(() => {
    const fetchModelPricing = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json() as OpenRouterResponse;
        console.log("OpenRouter API response:", data.data);
        setModelPricing(data.data);
      } catch (error) {
        console.error('Failed to fetch model pricing:', error);
      }
    };

    fetchModelPricing();
  }, []);

  const handleToggleChange = async (checked: boolean) => {
    setIsEnabled(checked);
    try {
      const result = await updatePayAsYouGo(checked);
      if (result.success) {
        toast({
          title: checked ? 'Pay-as-you-go enabled' : 'Pay-as-you-go disabled',
          description: 'Your pay-as-you-go setting has been updated',
        });
      } else {
        // Revert UI state if update failed
        setIsEnabled(!checked);
        toast({
          title: 'Failed to update pay-as-you-go setting',
          description: 'Please try again later',
        });
      }
    } catch (error) {
      console.error('Error updating pay-as-you-go:', error);
      // Revert UI state if update failed
      setIsEnabled(!checked);
    }
  };

  const getModelPricing = (modelName: string) => {
    // Try exact match first
    let pricing = modelPricing.find(m => m.id === modelName);
    
    if (!pricing) {
      // Try matching by removing any prefix (e.g., "anthropic/" from "anthropic/claude-3-haiku")
      const shortModelName = modelName.split('/').pop() || modelName;
      pricing = modelPricing.find(m => {
        const apiModelShortName = m.name.split('/').pop() || m.name;
        return apiModelShortName === shortModelName;
      });
    }

    if (!pricing) {
      console.log(`No pricing found for model: ${modelName}`);
      console.log('Available models:', modelPricing.map(m => m.name));
    }

    return pricing;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-stone-900 border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="pay-as-you-go" className="font-medium">
              Pay-as-you-go
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Enable pay-as-you-go to use premium models without a subscription.
                    You will be charged per request.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="pay-as-you-go"
            checked={isEnabled}
            onCheckedChange={handleToggleChange}
            disabled={isLoading}
            aria-label="Toggle pay-as-you-go"
          />
        </div>
        
        {isEnabled && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Pay-as-you-go is enabled. You will be charged for each request to metered models.
            </p>
          </div>
        )}
      </Card>

        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="border border-neutral-700 rounded-md overflow-hidden bg-stone-900"
        >
            <CollapsibleTrigger asChild>
            <Button 
                variant="ghost" 
                className="flex w-full justify-between items-center p-3 text-sm hover:bg-neutral-800 rounded-none"
            >
                <span className="font-medium">Pay-as-you-go models</span>
                <ChevronDownIcon 
                className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen && "transform rotate-180"
                )} 
                />
            </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="px-4 pb-4 pt-1 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                <style jsx global>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: #262626;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background-color: #525252;
                    border-radius: 3px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background-color: #666666;
                }
                `}</style>
                {meteredModels.map((model) => {
                const pricing = getModelPricing(model.name);
                return (
                    <div key={model.id} className="text-sm text-muted-foreground border-t border-neutral-800 pt-3 first:border-0 first:pt-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-medium">{model.name}</span>
                    </div>
                    {pricing ? (
                        <div className="ml-4 mt-1 text-xs space-y-0.5">
                        <div className="flex gap-x-4">
                            <p>Input: <span className="text-emerald-400">${pricing.pricing.prompt * 2}</span> per token</p>
                            <p>Output: <span className="text-emerald-400">${pricing.pricing.completion * 2}</span> per token</p>
                        </div>
                        <div className="text-neutral-400 prose prose-sm prose-neutral dark:prose-invert max-w-none text-xs">
                            <ReactMarkdown>{pricing.description}</ReactMarkdown>
                        </div>
                        <div className="flex flex-wrap gap-x-4 text-neutral-500 mt-1">
                            <p>Context: {pricing.context_length || pricing.top_provider?.context_length || 'N/A'} tokens</p>
                            <p>Max output: {pricing.top_provider?.max_completion_tokens || 'N/A'} tokens</p>
                            {pricing.top_provider?.is_moderated !== undefined && (
                            <p>{pricing.top_provider.is_moderated ? '✓ Moderated' : '✗ Unmoderated'}</p>
                            )}
                        </div>
                        </div>
                    ) : (
                        <div className="ml-4 mt-1 text-xs text-yellow-500">
                        Pricing information unavailable
                        </div>
                    )}
                    </div>
                );
                })}
            </div>
            </CollapsibleContent>
        </Collapsible>

    </div>
  );
}