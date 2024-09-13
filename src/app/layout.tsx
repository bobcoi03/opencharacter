import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";
import SideBar from "@/components/sidebar";
import { Toaster } from "@/components/ui/toaster"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeScript/>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className}`}>
        <div className="flex h-screen">       
          <SideBar />
          <main className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900 relative w-full"> {/* Added pl-16 for left padding */}
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}