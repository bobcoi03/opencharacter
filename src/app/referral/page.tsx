import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, DollarSign, Gift, Users } from "lucide-react";

export const runtime = "edge";

export default function ReferralPage() {
  // Steps for the referral program
  const steps = [
    {
      icon: <Users className="h-10 w-10 text-blue-500" />,
      title: "Invite Friends",
      description: "Share your unique referral link with friends and followers."
    },
    {
      icon: <Gift className="h-10 w-10 text-purple-500" />,
      title: "They Sign Up",
      description: "When they create an account using your link, they&apos;re tracked as your referral."
    },
    {
      icon: <DollarSign className="h-10 w-10 text-green-500" />,
      title: "Earn Commission",
      description: "Earn 20% commission when they upgrade to a Pro plan within 30 days."
    }
  ];

  return (
    <div className="flex-1 w-full p-4 mb-24">
      <div className="container relative mx-auto">
        <div className="flex flex-col py-6 space-y-8 w-full sm:max-w-2xl md:max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold tracking-tight text-center">Referral Program</h1>
            <p className="text-lg text-muted-foreground mt-2 text-center">
              Share OpenCharacter and earn 20% lifetime commission on every Pro subscription.
            </p>
          </div>

          {/* How It Works */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <Card key={index} className="p-6 space-y-4 bg-stone-900 border-neutral-700 flex flex-col items-center text-center">
                  <div className="rounded-full bg-stone-800 p-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Commission Details */}
          <Card className="p-6 space-y-6 bg-stone-900 border-neutral-700">
            <h2 className="text-xl font-semibold">Commission Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">20% Lifetime Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn 20% of all revenue from referred users for as long as they remain subscribed.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">30-Day Attribution Window</h3>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll earn commission if your referral upgrades to Pro within 30 days of signing up.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Monthly Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Commissions are calculated monthly and paid via PayPal if your balance exceeds $20.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <Card className="p-6 space-y-6 bg-stone-900 border-neutral-700">
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">How do I track my referrals?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You can view all your referrals and earnings in your &quot;Referrals&quot; tab when you click on your profile.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium">When do I get paid?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Payments are processed on the 1st of each month for the previous month&apos;s earnings, provided your balance exceeds $20.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium">How do I set up my payment details?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Go to your profile settings and add your PayPal email address to receive payments.
                </p>
              </div>
            </div>
          </Card>

          {/* Terms and Conditions */}
          <div className="text-sm text-muted-foreground text-center">
            <p>
              By participating in the OpenCharacter Referral Program, you agree to our{" "}
              <a href="/terms-of-service" className="text-blue-400 hover:underline">Terms of Service</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
