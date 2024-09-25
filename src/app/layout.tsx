import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";
import SideBar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from '@next/third-parties/google'
import { auth } from "@/server/auth";
import { searchCharacters } from "./actions";


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
    // You can use the session here if needed
    // For example, to filter characters based on user permissions
    const characters = await searchCharacters(query, 30);
    // You might want to filter or process the results here
    // based on the session or other server-side logic
    return characters;
  }

  return (
    <html lang="en">
      <head>
        <ThemeScript/>
        <link rel="icon" href="/favicon.svg" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <div className="flex h-screen">       
          <SideBar search={search} />
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 relative w-full"> {/* Added pl-16 for left padding */}
            {children}
          </main>
        </div>
        <Toaster />
      </body>
      <GoogleAnalytics gaId={process.env.GOOGLE_ANALYTICS_ID ?? ""} />
    </html>
  );
}