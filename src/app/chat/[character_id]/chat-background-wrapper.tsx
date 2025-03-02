"use client"

import ChatBackground from "@/components/chat-background"

interface ChatBackgroundWrapperProps {
  children: React.ReactNode
}

export default function ChatBackgroundWrapper({ children }: ChatBackgroundWrapperProps) {
  return (
    <ChatBackground>
      {children}
    </ChatBackground>
  )
} 