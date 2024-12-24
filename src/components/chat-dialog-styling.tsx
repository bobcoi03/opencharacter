"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Menu } from "lucide-react"
import { useState, useEffect } from "react"

export function ChatDialogStyling() {
    const [chatStyle, setChatStyle] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('chat-style') || 'classic'
        }
        return 'classic'
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chat-style', chatStyle)
        }
    }, [chatStyle])

    return (
        <div className="flex flex-col gap-1">
            <span className="block mb-2 font-semibold mt-8">Chat Styling</span>

            <div className="flex gap-2">
                <Button
                    variant={chatStyle === 'default' ? 'default' : 'outline'}
                    className={`rounded-xl flex items-center gap-2 ${chatStyle === 'bubble' ? 'bg-white text-black hover:bg-neutral-200' : ''}`}
                    onClick={() => setChatStyle("bubble")}
                >
                    <MessageCircle className="h-4 w-4" />
                    Bubble
                </Button>
                <Button
                    variant={chatStyle === 'classic' ? 'default' : 'outline'} 
                    className={`rounded-xl flex items-center gap-2 ${chatStyle === 'classic' ? 'bg-white text-black hover:bg-neutral-200' : ''}`}
                    onClick={() => setChatStyle("classic")}
                >
                    <Menu className="h-4 w-4" />
                    Classic
                </Button>
            </div>
        </div>
    )
}
