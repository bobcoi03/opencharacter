import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from '@next/third-parties/google'
import { auth } from "@/server/auth";
import { searchCharacters } from "./actions";
import NewSidebar from "@/components/new-sidebar";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenCharacter",
  description: "Explore the world of open AI characters at OpenCharacter.org. Connect, interact, and grow with a diverse range of AI personalities.",
  openGraph: {
    title: "OpenCharacter - Open AI Characters",
    description: "Explore the world of open AI characters at OpenCharacter.org. Connect, interact, and grow with a diverse range of AI personalities.",
    url: "https://opencharacter.org",
    siteName: "OpenCharacter.org",
    images: [
      {
        url: "https://opencharacter.org/og-image.jpg", // Make sure to create and add this image
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
    description: "Explore the world of open AI characters at OpenCharacter.org. Connect, interact, and grow with a diverse range of AI personalities.",
    creator: "@justwrapapi",
    images: ["https://opencharacter.org/twitter-image.jpg"], // Make sure to create and add this image
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  async function search(query: string) {
    'use server'
    const characters = await searchCharacters(query, 30);
    return characters;
  }

  return (
    <html lang="en">
      <head>
        <ThemeScript/>
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"></meta>
      </head>
      <body className={`${inter.className} bg-white dark:bg-neutral-900`}>
        <NewSidebar search={search} />
        <div className="flex flex-col min-h-screen pt-12 md:pl-16">
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
        <Toaster />
        <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID ?? ""} />
      </body>
    </html>
  );
}