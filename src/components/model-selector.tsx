import { Check, Cpu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getModelArray } from "@/lib/llm_models";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

interface StripeResponse {
  url: string;
}

interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  subscription: any | null;
}

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (session?.user) {
        console.log("[ModelSelector] Checking subscription for user:", session.user.id);
        try {
          const response = await fetch("/api/subscriptions/check");
          console.log("[ModelSelector] API response status:", response.status);
          const data = await response.json() as SubscriptionCheckResponse;
          console.log("[ModelSelector] API response data:", JSON.stringify(data, null, 2));
          console.log("[ModelSelector] Setting isSubscribed to:", data.hasActiveSubscription);
          setIsSubscribed(data.hasActiveSubscription);
        } catch (error) {
          console.error("[ModelSelector] Error checking subscription:", error);
        }
      } else {
        console.log("[ModelSelector] No user session available");
      }
    }

    checkSubscription();
  }, [session?.user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-neutral-600 rounded-full p-1 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
        >
          <Cpu className="w-3 h-3 text-gray-300" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-neutral-800 rounded-lg shadow-lg">
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {getModelArray().map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => {
                console.log("[ModelSelector] Clicked model:", model.id, "isPaid:", model.paid, "isSubscribed:", isSubscribed);
                if (model.paid && !isSubscribed) {
                  console.log("[ModelSelector] Blocking access to paid model - user not subscribed");
                  toast({
                    title: "Pro Model",
                    description: "This model is only available to Pro users",
                    variant: "destructive",
                  });
                  return;
                }
                console.log("[ModelSelector] Allowing model selection");
                onModelSelect(model.id);
              }}
              className={`flex items-center justify-between rounded-md p-2 text-xs hover:bg-neutral-700 transition-colors`}
            >
              <span className="flex items-center gap-1.5">
                {model.name}
                {model.paid && (
                  <span className="text-[10px] text-yellow-400/80 font-medium">
                    pro
                  </span>
                )}
                {model.metered && (
                  <span className="text-[10px] text-green-400/80 font-medium">
                    metered
                  </span>
                )}
              </span>
              {selectedModel === model.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </div>

        <Separator />

        <div className="border-t border-neutral-700">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-300 ml-4 mt-4 mb-2 font-bold">
              Selected: {selectedModel}
            </p>
            {!isSubscribed && (
              <Link
                href="/plans"
                className="w-full border-black border p-4 bg-black rounded-lg text-white text-[9px] flex items-center justify-center"
              >
                Upgrade for all models, faster response times, more memory
              </Link>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 