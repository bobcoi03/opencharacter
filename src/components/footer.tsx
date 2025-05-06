import Link from "next/link";
import { Button } from "./ui/button";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { subscriptions } from "@/server/db/schema";
import { ArrowRight, Mail, Github } from "lucide-react";
import { Check } from "lucide-react";
import Image from "next/image";

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
  icon?: React.ReactNode;
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
      { href: "/tools/create-character", label: "Create Character" },
    ],
  },
  {
    title: "Community",
    links: [
      { 
        href: "https://www.tiktok.com/@opencharacter.org", 
        label: "TikTok", 
        external: true,
        icon: <div className="w-5 h-5 text-[#000000] dark:text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </div>
      },
      { 
        href: "https://www.reddit.com/r/OpenCharacterAI/", 
        label: "Reddit", 
        external: true,
        icon: <div className="w-5 h-5 text-[#FF4500] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-18c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8zm6.5 8.5c0-.813-.669-1.5-1.5-1.5-.423 0-.8.18-1.07.47-.84-.59-2.01-.95-3.32-.99l.73-2.22 1.93.53c.03.54.48.97 1.02.97.56 0 1.02-.46 1.02-1.02s-.46-1.02-1.02-1.02c-.36 0-.67.19-.86.47L13.17 6c-.13-.03-.25-.04-.38-.01-.12.03-.22.1-.28.2l-1.13 3.37c-1.25.06-2.35.42-3.15.99-.27-.29-.65-.49-1.07-.49-.83 0-1.5.67-1.5 1.5 0 .66.43 1.21 1.03 1.41-.03.16-.05.33-.05.5 0 1.93 2.36 3.5 5.25 3.5s5.25-1.57 5.25-3.5c0-.17-.01-.33-.04-.49.6-.21 1.02-.76 1.02-1.42zm-2.21.53c.28.36.53.78.7 1.21-1.78.63-3.7.63-5.49 0 .18-.43.43-.85.71-1.21.28-.36.63-.66 1.04-.87.41-.22.85-.33 1.29-.33.46 0 .9.11 1.31.33.41.21.76.51 1.04.87z"/>
                  <circle cx="16.73" cy="9.26" r=".97"/>
                  <circle cx="7.26" cy="9.26" r=".97"/>
                </svg>
              </div>
      },
      { 
        href: "https://www.instagram.com/opencharacter_org/", 
        label: "Instagram", 
        external: true,
        icon: <div className="w-5 h-5 text-[#E4405F] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.987.01-4.04.059-.977.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.88-.344 1.857-.047 1.053-.059 1.37-.059 4.04 0 2.67.01 2.988.059 4.04.045.977.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.88.3 1.857.344 1.054.047 1.37.059 4.04.059 2.67 0 2.987-.01 4.04-.059.977-.045 1.504-.207 1.857-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.88.344-1.857.047-1.054.059-1.37.059-4.04 0-2.67-.01-2.987-.059-4.04-.045-.977-.207-1.504-.344-1.857a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.88-.3-1.857-.344-1.053-.047-1.37-.059-4.04-.059zm0 3.064A5.139 5.139 0 0017.134 12 5.139 5.139 0 0012 17.134 5.139 5.139 0 006.866 12 5.139 5.139 0 0012 6.866zm0 8.468A3.334 3.334 0 018.668 12 3.334 3.334 0 0112 8.668 3.334 3.334 0 0115.332 12 3.334 3.334 0 0112 15.332zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" />
                </svg>
              </div>
      },
      { 
        href: "https://github.com/bobcoi03/opencharacter", 
        label: "GitHub", 
        external: true,
        icon: <Github size={20} className="text-white dark:text-white" />
      },
      { 
        href: "https://x.com/opencharacter_", 
        label: "Twitter", 
        external: true,
        icon: <div className="w-5 h-5 text-black dark:text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M13.79 9.32L20.27 2h-1.85l-5.61 6.32L8.09 2H2.72l7.11 9.61L2.98 19h1.85l5.98-6.75L15.96 19h5.37l-7.54-9.68zm-2.84 3.2l-.7-.95L4.75 3.51H6.9l4.34 5.93.7.94 5.76 7.86h-2.15l-4.6-6.27z"/>
                </svg>
              </div>
      },
      { 
        href: "mailto:opencharacter.org@gmail.com", 
        label: "Email", 
        external: true,
        icon: <Mail size={20} className="text-[#D44638] dark:text-[#D44638]" />
      }
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
                      className="group text-sm text-muted-foreground transition-colors hover:text-foreground flex items-center gap-3"
                    >
                      {link.icon}
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