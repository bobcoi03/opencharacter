"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface BuyCreditsDialogProps {
  className?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentIntentId: string;
  status: string;
  message?: string;
}

interface CreditsResponse {
  success: boolean;
  balance: number;
}

export default function BuyCreditsDialog({ className }: BuyCreditsDialogProps) {
  const [amount, setAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const response = await fetch("/api/user/credits");
      const data = await response.json() as CreditsResponse;
      
      if (response.ok && data.success) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    // Fetch balance on component mount
    fetchBalance();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setAmount(0);
    } else {
      setAmount(Math.min(1000, Math.max(0, value)));
    }
  };

  const handlePurchase = async () => {
    if (amount < 5 || amount > 1000) {
      setError("Amount must be between $5 and $1000");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json() as PaymentResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to process payment");
      }

      setIsSuccess(true);
      toast({
        title: "Payment successful!",
        description: `You've successfully purchased $${amount} in credits.`,
      });

      // Update balance
      fetchBalance();

      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setAmount(10);
      }, 3000);
    } catch (error) {
      console.error("Payment error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when dialog closes
      setIsSuccess(false);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Card className={`p-6 space-y-4 bg-stone-900 border-neutral-700 cursor-pointer hover:bg-stone-800 transition-colors ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <CreditCard className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Buy Credits</h3>
                <p className="text-xs text-muted-foreground">Purchase credits to use metered models</p>
              </div>
            </div>
            {isLoadingBalance ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : balance !== null ? (
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold">${balance.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">Balance</span>
              </div>
            ) : null}
          </div>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-stone-900 text-white border-neutral-700">
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Add credits to your account for pay-as-you-go premium model usage.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-500/20 p-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-medium text-center">Payment Successful!</h3>
            <p className="text-center text-muted-foreground">
              Your account has been credited with ${amount}.
            </p>
          </div>
        ) : (
          <>
            {balance !== null && (
              <div className="bg-stone-800 p-3 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Balance</span>
                  <span className="text-lg font-bold">${balance.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min={5}
                    max={100000}
                    step={1}
                    value={amount}
                    onChange={handleAmountChange}
                    className="pl-9 bg-stone-800 border-neutral-700"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter an amount between $5 and $100000
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                onClick={handlePurchase} 
                disabled={isLoading || amount < 5 || amount > 1000}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Buy $${amount} Credits`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 