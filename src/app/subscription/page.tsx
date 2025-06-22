import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { ManageSubscriptionButton } from "@/components/manage-subscription-button";
import { Separator } from "@/components/ui/separator";
import { SubscriptionBadge } from "@/components/subscription-badge";

export const runtime = "edge";

export default async function SubscriptionPage() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return null;
  }

  // Get subscription data if it exists
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });

  const isPro = subscription?.status === "active";

  return (
    <div className="flex-1 w-full p-2 mb-24">
      <div className="container relative mx-auto">
        <div className="flex flex-wrap py-6 space-y-8 w-full sm:max-w-2xl md:max-w-5xl mx-auto justify-center">
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold tracking-tight text-center">Subscription</h1>
            <p className="text-lg text-muted-foreground mt-2 text-center">
              You can manage your subscriptions, billings, and credits here.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Basic Information */}
            <Card className="p-6 space-y-6 bg-stone-900 border-neutral-700 md:w-1/2 self-start">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <div className="h-12 w-12">
                  <img 
                    src={user.image ?? ""} 
                    alt={user.name ?? ""} 
                    className="rounded-full h-full w-full object-cover" 
                  />
                </div>
              </div>

              <div className="space-y-4 w-full">
                <div className="w-full flex justify-between">
                  <label className="font-bold text-sm">Name</label>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
                <div className="w-full flex justify-between">
                  <label className="font-bold text-sm">Email</label>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </Card>

            {/* Usage Card */}
            <Card className="p-6 space-y-6 bg-stone-900 border-neutral-700 md:w-1/2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Plan</h2>
                    <SubscriptionBadge isPro={isPro} />
                </div>
              
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium mb-2">Usage</h3>
                  
                  {/* Premium Models Usage */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Premium models</span>
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>{isPro && "Unlimited"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPro && "You have unlimited monthly requests." }
                    </p>
                  </div>

                  <Separator />

                  {/* Subscription Details */}
                  {subscription && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status</span>
                        <span className="text-sm capitalize">{subscription?.status}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Billing Period</span>
                        <span className="text-sm">
                          {subscription.stripeCurrentPeriodStart && subscription.stripeCurrentPeriodEnd && (
                            `${format(new Date(subscription.stripeCurrentPeriodStart), 'MMM d, yyyy')} ->
                             ${format(new Date(subscription.stripeCurrentPeriodEnd), 'MMM d, yyyy')}`
                          )}
                        </span>
                      </div>

                    <ManageSubscriptionButton />
                    
                    <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Pay-as-you-go</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pay-as-you-go models are currently disabled. Will be available soon.
                      </p>
                    </div>

                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
                    
        </div>
      </div>
    </div>
  );
}
