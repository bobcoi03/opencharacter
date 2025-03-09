import { Metadata } from "next";
import AutoCharacterGenerator from "@/components/auto-character-generator";
import AuthProvider from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "AI Character Creator | Create Custom AI Characters",
  description: "Generate custom AI characters with a simple prompt. Create detailed personalities, backstories, and avatars for your AI companions, chatbots, or virtual assistants.",
  keywords: "AI character creator, character generation, AI companion, custom AI, virtual assistant, chatbot personality, AI avatar generator",
  openGraph: {
    title: "AI Character Creator | Create Custom AI Characters",
    description: "Generate custom AI characters with a simple prompt. Create detailed personalities, backstories, and avatars for your AI companions.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AI Character Creator | Create Custom AI Characters",
    description: "Generate custom AI characters with a simple prompt. Create detailed personalities, backstories, and avatars for your AI companions.",
  },
};

export const runtime = "edge";

export default function AutoCharacterGeneratorPage() {
  return (
    <div className="w-full">
      <AuthProvider>
        <AutoCharacterGenerator />
      </AuthProvider>
    </div>
  );
} 