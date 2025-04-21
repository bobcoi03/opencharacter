import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";
import { Toaster } from "@/components/ui/toaster";
import { GoogleAnalytics } from '@next/third-parties/google';
import { searchCharacters } from "./actions";
import NewSidebar from "@/components/new-sidebar";
import IconStyleInitializer from "@/components/icon-style-onmount";
import AuthProvider from "@/components/auth-provider";
import { ConditionalAdsense } from "@/components/conditional-adsense";
import { auth } from "@/server/auth";
import { isUserPro } from "@/lib/subscription";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenCharacter",
  description: "Chat to who ever you desire! Open source and uncensored.",
  openGraph: {
    title: "OpenCharacter - Open AI Characters",
    description: "Chat to who ever you desire! Open source and uncensored.",
    url: "https://opencharacter.org",
    siteName: "OpenCharacter.org",
    images: [
      {
        url: "https://opencharacter.org/OpenCharacterCard.png",
        width: 1200,
        height: 630,
        alt: "OpenCharacter.org Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenCharacter.org - Explore Open AI Characters",
    description: "Chat to who ever you desire! Open source and uncensored.",
    creator: "@justwrapapi",
    images: ["https://opencharacter.org/OpenCharacterCard.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isPro = await isUserPro(session?.user?.id);

  async function search(query: string) {
    'use server'
    const characters = await searchCharacters(query, 30);
    return characters;
  }

  return (
    <AuthProvider>
      <html lang="en" className="dark">
        <head>
          <ThemeScript />
          <link rel="icon" href="/opencharacter_icon.png" sizes="any" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        </head>
        <body className={`${inter.className} bg-neutral-900`}>
          <PostHogProvider>
            <IconStyleInitializer />
            <NewSidebar search={search} />
            <div className="flex flex-col min-h-screen pt-12">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </PostHogProvider>
          <Toaster />
          <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID ?? ""} />
        </body>
      </html>
    </AuthProvider>
  );
}
