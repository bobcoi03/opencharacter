import Link from "next/link";
import { Button } from "./ui/button";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { subscriptions } from "@/server/db/schema";
import { ArrowRight } from "lucide-react";
import { Check } from "lucide-react";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    title: "Product",
    links: [
      { href: "/about", label: "About" },
      { href: "/plans", label: "Premium" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/tools/twitter-roast", label: "Twitter Profile Roaster" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "https://www.tiktok.com/@opencharacter", label: "TikTok", external: true },
      { href: "https://www.reddit.com/r/OpenCharacterAI/", label: "Reddit", external: true },
      { href: "https://www.instagram.com/opencharacter_org/", label: "Instagram", external: true },
      { href: "https://github.com/bobcoi03/opencharacter", label: "GitHub", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-of-service", label: "Terms of Service" },
    ],
  },
];

export async function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="">
      <div className="mx-auto w-full max-w-screen-xl lg:py-12">
        {/* CTA Card - Only shown for non-subscribers and non-authenticated users */}
        <CTACard />

        {/* Footer Links */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:gap-12 p-4">
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} OpenCharacter. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 

export async function CTACard() {
    const session = await auth();
  
    if (!session?.user?.id) {
        return <CTACardContent />; // Show CTA for non-authenticated users
    }

    // Check for active subscription
    const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, session.user.id as string),
    });

    // Show CTA if no subscription or if subscription is not active
    if (!subscription || subscription.status !== 'active') {
        return <CTACardContent />;
    }

    return null;
}

function CTACardContent() {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 py-16 px-4 sm:px-6 lg:px-8 rounded-2xl border border-neutral-800 mb-6 m-2">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
            <div className="h-32 w-32 rounded-full bg-blue-500/20 blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2">
            <div className="h-32 w-32 rounded-full bg-purple-500/20 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            Unlock Premium Features
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">
                            Get unlimited access to all AI models, faster response times, and extended memory.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="text-sm text-gray-300">All Premium Models</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="text-sm text-gray-300">3x Faster Responses</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="text-sm text-gray-300">64x More Memory</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto px-8 text-lg font-medium bg-white hover:bg-gray-100 text-neutral-900 shadow-lg shadow-white/10 transition-all hover:scale-105"
                    >
                        <Link href="/plans" className="flex items-center justify-center gap-2">
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-medium text-white">Starting at</p>
                        <p className="text-2xl font-bold text-white">$10<span className="text-sm text-gray-300">/month</span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}