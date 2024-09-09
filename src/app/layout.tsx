import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/lib/theme/theme-script";
import SideBar from "@/components/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "aifriendhub",
  description: "Discover the power of AI friendship at AIFriend.org. Connect, learn, and grow with your personal AI companion.",
  openGraph: {
    title: "aifriends - ai friends",
    description: "Discover the power of AI friendship at AIFriend.org. Connect, learn, and grow with your personal AI companion.",
    url: "https://aifriend.org",
    siteName: "AIFriend.org",
    images: [
      {
        url: "https://aifriend.org/og-image.jpg", // Make sure to create and add this image
        width: 1200,
        height: 630,
        alt: "AIFriend.org Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIFriend.org - Your AI Companions",
    description: "Discover the power of AI friendship at AIFriend.org. Connect, learn, and grow with your personal AI companion.",
    creator: "@justwrapapi",
    images: ["https://aifriend.org/twitter-image.jpg"], // Make sure to create and add this image
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
          <main className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-neutral-900 relative w-full pl-16"> {/* Added pl-16 for left padding */}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}