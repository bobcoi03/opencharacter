"use client"

import { Palette, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { HexColorPicker } from "react-colorful"
import { ChatDialogStyling } from "./chat-dialog-styling"

export default function CustomizeDialog() {
  const [userColor, setUserColor] = useState(() => {
    // Only run in client since localStorage is not available on server
    if (typeof window !== "undefined") {
      return localStorage.getItem("user_chat_color") || "#262626"
    }
    return "#1e90ff"
  })

  const [aiColor, setAiColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_chat_color") || "#404040"
    }
    return "#10b981"
  })

  useEffect(() => {
    localStorage.setItem("user_chat_color", userColor)
    localStorage.setItem("ai_chat_color", aiColor)
  }, [userColor, aiColor])

  const handleSave = () => {
    window.location.reload()
  }

  const handleReset = () => {
    localStorage.removeItem("user_chat_color")
    localStorage.removeItem("ai_chat_color")
    window.location.reload()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors">
          <div className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Customize
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[280px] border-0 bg-zinc-900 p-0 text-white">
        <DialogHeader className="border-b border-zinc-800 p-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs">Customize</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-3 p-3">
          {/* Preview */}
          <Card className="bg-zinc-800 p-3">
            <div className="flex flex-col gap-1">
              <div style={{ backgroundColor: aiColor }} className="h-3 w-16 rounded-full transition-colors" />
              <div style={{ backgroundColor: userColor }} className="ml-auto h-3 w-20 rounded-full transition-colors" />
            </div>
            <div className="mt-1 text-center text-[10px] text-zinc-400">Preview</div>
          </Card>

          {/* Color Pickers */}
          <div className="space-y-2">
            {/* AI Color Picker */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs font-semibold">AI chat color</h3>
                <span className="text-[10px] text-zinc-400">{aiColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md" style={{ backgroundColor: aiColor }} />
                <HexColorPicker color={aiColor} onChange={setAiColor} className="!w-[100px] !h-[100px]" />
              </div>
            </div>

            {/* User Color Picker */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-xs font-semibold">Your chat color</h3>
                <span className="text-[10px] text-zinc-400">{userColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md" style={{ backgroundColor: userColor }} />
                <HexColorPicker color={userColor} onChange={setUserColor} className="!w-[100px] !h-[100px]" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleReset}
              className="h-8 bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs"
            >
              Reset
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 h-8 bg-zinc-700 hover:bg-zinc-600 text-gray-200 text-xs"
            >
              <Save className="w-3 h-3 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  )
}

