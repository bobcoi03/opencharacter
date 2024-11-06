"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Twitter, Instagram, Youtube, Loader2 } from 'lucide-react';
import { submitContent } from '@/app/actions/social_submissions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OpenCharacterFreeAccessToPremiumPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      const response = await submitContent(formData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Wait for 1 second before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/submit-success');
    } catch (error) {
      console.error('Error submitting:', error);
      // You might want to add toast notification here
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-white p-6 md:p-8 max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Get Free Premium Access
        </h1>
        <p className="text-gray-400 text-lg">
          Share OpenCharacter on social media and unlock premium features for FREE!
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto mb-16 space-y-16">
        {/* Rewards Section */}
        <div className="space-y-6 text-center">
          <h2 className="text-2xl font-semibold">What You{"'"}ll Get</h2>
          <div className="space-y-4 text-lg">
            <p>😊 <span className="text-white font-medium">Basic Post</span> → <span className="text-gray-400">1 day of free premium access</span></p>
            <p>🎉 <span className="text-white font-medium">Quality Post</span> → <span className="text-gray-400">1 week of free premium access</span></p>
            <p>⭐ <span className="text-white font-medium">High Engagement Post</span> → <span className="text-gray-400">1 month of free premium access</span></p>
            <p>🚀 <span className="text-white font-medium">Viral Post</span> → <span className="text-gray-400">1 FULL YEAR of free premium access</span></p>
          </div>
        </div>

        {/* Platforms */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-semibold">Share On Any Platform</h2>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400 text-lg">
            <div className="flex items-center gap-2">
              <Twitter className="h-6 w-6" /> Twitter
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-6 w-6" /> Instagram
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-6 w-6" /> YouTube
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              TikTok
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <Card className="bg-white/5 backdrop-blur">
          <CardHeader className="text-center">
            <h2 className="text-2xl font-semibold">Submit Your Content</h2>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialLinks">Social Media Post Links</Label>
                <Textarea
                  id="socialLinks"
                  name="socialLinks"
                  placeholder="Paste your social media post links here (one per line)"
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-0 min-h-[100px] focus-visible:ring-1 focus-visible:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Message (Optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your content..."
                  disabled={isLoading}
                  className="bg-white/5 border-0 focus-visible:ring-1 focus-visible:ring-white"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </div>
                ) : 'Submit for Review'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="max-w-2xl mx-auto text-center mt-12 text-gray-400 mb-24">
          <p className="text-md">
            We{"'"}re always on the lookout for up and coming creators/influencers to partner with us.<br className="hidden md:block" />
            Please send examples of exceptional work to{' '}
            <a 
              href="mailto:minh@everythingcompany.co" 
              className="text-white hover:text-gray-200 transition-colors"
            >
              minh@everythingcompany.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OpenCharacterFreeAccessToPremiumPage;