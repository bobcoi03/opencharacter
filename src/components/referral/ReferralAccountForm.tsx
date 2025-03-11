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
import { getUserReferralData, updateReferralSettings } from "@/app/actions/referral";

export function ReferralAccountForm() {
  const { toast } = useToast();
  const router = useRouter();
  
  // State for form inputs
  const [referralLink, setReferralLink] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for referrals - would be fetched from API in production
  const mockReferralStats = {
    totalReferred: 12,
    proSubscribers: 5,
    totalEarnings: 89.95,
    pendingPayment: 29.95,
    lastPaymentDate: "2023-10-15",
    lastPaymentAmount: 60.00,
  };
  
  // Mock referral history - would be fetched from API in production
  const mockReferralHistory = [
    { id: "1", user: "user****@gmail.com", date: "2023-09-05", status: "pro", earnings: 19.99 },
    { id: "2", user: "john****@outlook.com", date: "2023-09-12", status: "pro", earnings: 19.99 },
    { id: "3", user: "sarah****@yahoo.com", date: "2023-09-18", status: "free", earnings: 0 },
    { id: "4", user: "mike****@gmail.com", date: "2023-09-25", status: "free", earnings: 0 },
    { id: "5", user: "alex****@hotmail.com", date: "2023-10-02", status: "pro", earnings: 9.99 },
    { id: "6", user: "emma****@gmail.com", date: "2023-10-10", status: "free", earnings: 0 },
    { id: "7", user: "david****@outlook.com", date: "2023-10-15", status: "free", earnings: 0 },
    { id: "8", user: "lisa****@gmail.com", date: "2023-10-18", status: "free", earnings: 0 },
    { id: "9", user: "tom****@outlook.com", date: "2023-10-20", status: "free", earnings: 0 },
  ];
  
  // Mock payment history - would be fetched from API in production
  const mockPaymentHistory = [
    { id: "1", date: "2023-10-15", amount: 60.00, status: "paid" },
    { id: "2", date: "2023-09-15", amount: 40.00, status: "paid" },
    { id: "3", date: "2023-08-15", amount: 20.00, status: "paid" },
  ];
  
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
            
            // Extract the code part from the full link
            const codeMatch = result.data.referralLink.match(/ref=(.+)$/);
            if (codeMatch && codeMatch[1]) {
              setReferralCode(codeMatch[1]);
            }
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
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate PayPal email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paypalEmail)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid PayPal email address.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
      
      // Update settings via server action
      const result = await updateReferralSettings({ paypalEmail });
      
      if (result.success) {
        if (result.referralLink) {
          setReferralLink(result.referralLink);
          
          // Extract the code part from the full link
          const codeMatch = result.referralLink.match(/ref=(.+)$/);
          if (codeMatch && codeMatch[1]) {
            setReferralCode(codeMatch[1]);
          }
        }
        
        toast({
          title: "Settings saved",
          description: "Your referral settings have been updated successfully.",
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
      setError("Failed to save settings");
      console.error("Error saving settings:", err);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
                    
                    {/* Referral Link */}
                    <div className="space-y-2">
                      <Label htmlFor="referral-link">Your Referral Link</Label>
                      <div className="flex space-x-2">
                        <div className="flex-1 flex items-center rounded-md border border-input bg-stone-950 px-3 py-2 text-sm ring-offset-background">
                          <span className="text-muted-foreground">https://opencharacter.org/ref=</span>
                          <span className="flex-1 pl-1">{referralCode}</span>
                        </div>
                        <Button variant="outline" size="icon" onClick={copyReferralLink}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Share this link with friends to earn commission when they subscribe.
                      </p>
                    </div>
                    
                    {/* PayPal Email */}
                    <div className="space-y-2">
                      <Label htmlFor="paypal-email">PayPal Email</Label>
                      <Input 
                        id="paypal-email"
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="bg-stone-950"
                      />
                      <p className="text-sm text-muted-foreground">
                        We{"'"}ll send your commission payments to this PayPal account.
                      </p>
                    </div>
                    
                    {/* Save Button */}
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Referred</span>
                    </div>
                    <span className="font-medium">{mockReferralStats.totalReferred}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">PRO</Badge>
                      <span className="text-sm">Pro Subscribers</span>
                    </div>
                    <span className="font-medium">{mockReferralStats.proSubscribers}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Earnings</span>
                    </div>
                    <span className="font-medium">${mockReferralStats.totalEarnings.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Pending Payment</span>
                    </div>
                    <span className="font-medium">${mockReferralStats.pendingPayment.toFixed(2)}</span>
                  </div>
                  
                  <Alert className="bg-blue-900/20 border-blue-800">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-sm font-medium text-blue-400">Next payment</AlertTitle>
                    <AlertDescription className="text-xs text-blue-300">
                      Payments are processed on the 1st of each month for balances over $20.
                    </AlertDescription>
                  </Alert>
                </div>
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
                            <th className="h-12 px-4 text-left font-medium">User</th>
                            <th className="h-12 px-4 text-left font-medium">Date</th>
                            <th className="h-12 px-4 text-left font-medium">Status</th>
                            <th className="h-12 px-4 text-right font-medium">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockReferralHistory.map((referral) => (
                            <tr key={referral.id} className="border-b border-neutral-800">
                              <td className="p-4 align-middle">{referral.user}</td>
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
                          ))}
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
                          {mockPaymentHistory.map((payment) => (
                            <tr key={payment.id} className="border-b border-neutral-800">
                              <td className="p-4 align-middle">{payment.date}</td>
                              <td className="p-4 align-middle">
                                <Badge 
                                  variant="outline" 
                                  className="bg-green-900/20 text-green-400 border-green-800"
                                >
                                  Paid
                                </Badge>
                              </td>
                              <td className="p-4 align-middle text-right">
                                ${payment.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
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