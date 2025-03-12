"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, DollarSign, ExternalLink, Info, Mail, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getUserReferralData, updateReferralSettings, getUserReferralStats } from "@/app/actions/referral";

// Define types for referral data
interface ReferralStats {
  totalReferred: number;
  proSubscribers: number;
  totalEarnings: number;
  pendingPayment: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
}

interface ReferralHistoryItem {
  id: string;
  user?: string;
  date: string;
  status: 'free' | 'pro';
  earnings: number;
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: string;
}

export function ReferralAccountForm() {
  const { toast } = useToast();
  const router = useRouter();
  
  // State for form inputs
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [originalReferralCode, setOriginalReferralCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReferralCodeEdited, setIsReferralCodeEdited] = useState(false);
  
  // State for referral data
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistoryItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  
  // Load user referral data
  useEffect(() => {
    const loadReferralData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await getUserReferralData();
        
        if (result.success && result.data) {
          if (result.data.referralLink) {
            setReferralLink(result.data.referralLink);
          }
          
          if (result.data.referralCode) {
            setReferralCode(result.data.referralCode);
            setOriginalReferralCode(result.data.referralCode);
          }
          
          if (result.data.paypalEmail) {
            setPaypalEmail(result.data.paypalEmail);
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to load referral data");
        console.error("Error loading referral data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReferralData();
  }, []);
  
  // Load referral statistics and history
  useEffect(() => {
    const loadReferralStats = async () => {
      setIsStatsLoading(true);
      setStatsError(null);
      
      try {
        const result = await getUserReferralStats();
        
        if (result.success) {
          if (result.stats) {
            setReferralStats(result.stats);
          }
          
          if (result.referralHistory) {
            setReferralHistory(result.referralHistory);
          }
          
          if (result.paymentHistory) {
            setPaymentHistory(result.paymentHistory);
          }
        } else {
          setStatsError(result.message);
        }
      } catch (err) {
        setStatsError("Failed to load referral statistics");
        console.error("Error loading referral statistics:", err);
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    loadReferralStats();
  }, []);
  
  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-alphanumeric characters and convert to lowercase
    const newCode = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    setReferralCode(newCode);
    setIsReferralCodeEdited(newCode !== originalReferralCode);
  };
  
  const handleSaveReferralCode = async () => {
    setIsSavingCode(true);
    setError(null);
    
    try {
      // Validate referral code
      if (!referralCode || referralCode.length < 3) {
        toast({
          title: "Invalid referral code",
          description: "Referral code must be at least 3 characters long.",
          variant: "destructive",
        });
        setIsSavingCode(false);
        return;
      }
      
      // Update settings via server action
      const result = await updateReferralSettings({ 
        referralCode: referralCode
      });
      
      if (result.success) {
        if (result.referralLink) {
          setReferralLink(result.referralLink);
          
          // Extract the code part from the full link
          const codeMatch = result.referralLink.match(/\?ref=(.+)$/);
          if (codeMatch && codeMatch[1]) {
            setReferralCode(codeMatch[1]);
            setOriginalReferralCode(codeMatch[1]);
            setIsReferralCodeEdited(false);
          }
        }
        
        toast({
          title: "Referral code saved",
          description: "Your referral code has been updated successfully.",
        });
        
        // Refresh the page to update any data
        router.refresh();
      } else {
        setError(result.message);
        toast({
          title: "Error",
          description: result.message.includes("already in use") 
            ? "This referral code is already taken. Please choose a different one." 
            : result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to save referral code");
      console.error("Error saving referral code:", err);
      toast({
        title: "Error",
        description: "Failed to save referral code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCode(false);
    }
  };
  
  const handleSavePaypalEmail = async () => {
    setIsSavingEmail(true);
    setError(null);
    
    try {
      // Validate PayPal email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (paypalEmail && !emailRegex.test(paypalEmail)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid PayPal email address.",
          variant: "destructive",
        });
        setIsSavingEmail(false);
        return;
      }
      
      // Update settings via server action
      const result = await updateReferralSettings({ 
        paypalEmail
      });
      
      if (result.success) {
        toast({
          title: "PayPal email saved",
          description: "Your PayPal email has been updated successfully.",
        });
        
        // Refresh the page to update any data
        router.refresh();
      } else {
        setError(result.message);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("Failed to save PayPal email");
      console.error("Error saving PayPal email:", err);
      toast({
        title: "Error",
        description: "Failed to save PayPal email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };
  
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    
    toast({
      title: "Copied to clipboard",
      description: "Your referral link has been copied to clipboard.",
    });
  };

  return (
    <div className="flex-1 w-full p-4 mb-24">
      <div className="container relative mx-auto">
        <div className="flex flex-col py-6 space-y-8 w-full sm:max-w-2xl md:max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center w-full">
            <h1 className="text-4xl font-bold tracking-tight text-center">Referral Account</h1>
            <p className="text-lg text-muted-foreground mt-2 text-center">
              Manage your referral settings and track your earnings
            </p>
          </div>
          
          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Settings */}
            <Card className="md:col-span-2 bg-stone-900 border-neutral-700">
              <CardHeader>
                <CardTitle>Referral Settings</CardTitle>
                <CardDescription>
                  Customize your referral link and payment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-10 bg-stone-800 animate-pulse rounded-md"></div>
                    <div className="h-10 bg-stone-800 animate-pulse rounded-md"></div>
                  </div>
                ) : (
                  <>
                    {/* Error message if any */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Explanatory text */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        Both settings below are optional. You can set up a custom referral code to make your link more memorable, 
                        and add a PayPal email to receive commission payments.
                      </p>
                    </div>
                    
                    {/* Referral Link */}
                    <div className="space-y-2 p-4 border border-neutral-800 rounded-lg">
                      <Label htmlFor="referral-code" className="text-base font-medium">Your Referral Code</Label>
                      
                      {/* Mobile-friendly layout */}
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                        {/* URL prefix and input in a responsive container */}
                        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center rounded-md border border-input bg-stone-950 px-3 py-2 text-sm ring-offset-background">
                          <span className="text-muted-foreground mb-2 sm:mb-0 whitespace-nowrap">https://opencharacter.org/?ref=</span>
                          <Input
                            id="referral-code"
                            value={referralCode}
                            onChange={handleReferralCodeChange}
                            className="w-full sm:w-auto sm:flex-1 border-0 bg-transparent p-0 sm:pl-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="lowercase-only"
                          />
                        </div>
                        <Button variant="outline" size="icon" onClick={copyReferralLink} className="self-start">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this link with friends to earn commission when they subscribe.
                        Codes must be at least 3 characters and will be converted to lowercase.
                      </p>
                      
                      {/* Save Referral Code Button */}
                      <Button 
                        className="w-full mt-2" 
                        onClick={handleSaveReferralCode}
                        disabled={isSavingCode || !isReferralCodeEdited}
                      >
                        {isSavingCode ? "Saving..." : "Save Referral Code"}
                      </Button>
                    </div>
                    
                    {/* PayPal Email */}
                    <div className="space-y-2 p-4 border border-neutral-800 rounded-lg">
                      <Label htmlFor="paypal-email" className="text-base font-medium">PayPal Email</Label>
                      <Input 
                        id="paypal-email"
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your.email@example.com (optional)"
                        className="bg-stone-950"
                      />
                      <p className="text-sm text-muted-foreground">
                        Required for receiving commission payments. Leave empty if you don{"'"}t want payments.
                        For alternative payment options, contact info@opencharacter.org.
                      </p>
                      
                      {/* Save PayPal Email Button */}
                      <Button 
                        className="w-full mt-2" 
                        onClick={handleSavePaypalEmail}
                        disabled={isSavingEmail}
                      >
                        {isSavingEmail ? "Saving..." : "Save PayPal Email"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Right column - Stats */}
            <Card className="bg-stone-900 border-neutral-700">
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                  Your referral performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isStatsLoading ? (
                  <div className="space-y-4">
                    <div className="h-6 bg-stone-800 animate-pulse rounded-md"></div>
                    <div className="h-6 bg-stone-800 animate-pulse rounded-md"></div>
                    <div className="h-6 bg-stone-800 animate-pulse rounded-md"></div>
                    <div className="h-6 bg-stone-800 animate-pulse rounded-md"></div>
                  </div>
                ) : statsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{statsError}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Referred</span>
                      </div>
                      <span className="font-medium">{referralStats?.totalReferred || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">PRO</Badge>
                        <span className="text-sm">Pro Subscribers</span>
                      </div>
                      <span className="font-medium">{referralStats?.proSubscribers || 0}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Total Earnings</span>
                      </div>
                      <span className="font-medium">${(referralStats?.totalEarnings || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Pending Payment</span>
                      </div>
                      <span className="font-medium">${(referralStats?.pendingPayment || 0).toFixed(2)}</span>
                    </div>
                    
                    <Alert className="bg-blue-900/20 border-blue-800">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertTitle className="text-sm font-medium text-blue-400">Next payment</AlertTitle>
                      <AlertDescription className="text-xs text-blue-300">
                        Payments are processed on the 1st of each month for balances over $20.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for History */}
          <Tabs defaultValue="referrals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="referrals">Referral History</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="referrals" className="mt-4">
              <Card className="bg-stone-900 border-neutral-700">
                <CardHeader>
                  <CardTitle>Referral History</CardTitle>
                  <CardDescription>
                    Users who signed up using your referral link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-neutral-800">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b border-neutral-800 bg-stone-950">
                            <th className="h-12 px-4 text-left font-medium">Referral</th>
                            <th className="h-12 px-4 text-left font-medium">Date</th>
                            <th className="h-12 px-4 text-left font-medium">Status</th>
                            <th className="h-12 px-4 text-right font-medium">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isStatsLoading ? (
                            Array(3).fill(0).map((_, index) => (
                              <tr key={index} className="border-b border-neutral-800">
                                <td className="p-4 align-middle">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-24"></div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-20"></div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-24"></div>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-16 ml-auto"></div>
                                </td>
                              </tr>
                            ))
                          ) : referralHistory.length === 0 ? (
                            <tr className="border-b border-neutral-800">
                              <td colSpan={4} className="p-4 text-center text-muted-foreground">
                                No referrals yet. Share your link to start earning!
                              </td>
                            </tr>
                          ) : (
                            referralHistory.map((referral, index) => (
                              <tr key={referral.id} className="border-b border-neutral-800">
                                <td className="p-4 align-middle">User #{index + 1}</td>
                                <td className="p-4 align-middle">{referral.date}</td>
                                <td className="p-4 align-middle">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      referral.status === "pro" 
                                        ? "bg-green-900/20 text-green-400 border-green-800" 
                                        : "bg-blue-900/20 text-blue-400 border-blue-800"
                                    }
                                  >
                                    {referral.status === "pro" ? "Pro Subscriber" : "Free User"}
                                  </Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  ${referral.earnings.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-4">
              <Card className="bg-stone-900 border-neutral-700">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    Record of commission payments to your PayPal account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-neutral-800">
                    <div className="relative w-full overflow-auto">
                      <table className="w-full caption-bottom text-sm">
                        <thead>
                          <tr className="border-b border-neutral-800 bg-stone-950">
                            <th className="h-12 px-4 text-left font-medium">Date</th>
                            <th className="h-12 px-4 text-left font-medium">Status</th>
                            <th className="h-12 px-4 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isStatsLoading ? (
                            Array(3).fill(0).map((_, index) => (
                              <tr key={index} className="border-b border-neutral-800">
                                <td className="p-4 align-middle">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-20"></div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-16"></div>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  <div className="h-4 bg-stone-800 animate-pulse rounded-md w-16 ml-auto"></div>
                                </td>
                              </tr>
                            ))
                          ) : paymentHistory.length === 0 ? (
                            <tr className="border-b border-neutral-800">
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                No payments yet. Payments are processed monthly for balances over $20.
                              </td>
                            </tr>
                          ) : (
                            paymentHistory.map((payment) => (
                              <tr key={payment.id} className="border-b border-neutral-800">
                                <td className="p-4 align-middle">{payment.date}</td>
                                <td className="p-4 align-middle">
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      payment.status === "paid"
                                        ? "bg-green-900/20 text-green-400 border-green-800"
                                        : payment.status === "pending"
                                          ? "bg-yellow-900/20 text-yellow-400 border-yellow-800"
                                          : "bg-red-900/20 text-red-400 border-red-800"
                                    }
                                  >
                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                  </Badge>
                                </td>
                                <td className="p-4 align-middle text-right">
                                  ${payment.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Support Section */}
          <Card className="bg-stone-900 border-neutral-700">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Contact our support team for assistance with your referral account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a 
                  href="mailto:info@opencharacter.org" 
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  info@opencharacter.org
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Our team typically responds within 24 hours on business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 