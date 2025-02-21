'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { roastTweets } from '@/app/actions/index'
import { Card } from "@/components/ui/card"
import { Loader2, Copy, Check } from "lucide-react"
import { AIInputWithLoading } from './ui/ai-input-with-loading'
import { readStreamableValue } from "ai/rsc"
import ReactMarkdown from "react-markdown"

export function TwitterRoastForm() {
  const [username, setUsername] = useState('')
  const [roast, setRoast] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)

  async function handleFormSubmit(e: React.FormEvent | string) {
    if (typeof e !== 'string') {
      e.preventDefault()
      if (!username) return
    } else {
      if (!e) return
      setUsername(e)
    }

    const valueToRoast = typeof e === 'string' ? e : username
    setIsLoading(true)
    setError(undefined)
    setRoast('')
    
    try {
      console.log('🎭 Generating roast for:', valueToRoast)
      const result = await roastTweets(valueToRoast)
      for await (const content of readStreamableValue(result)) {
        setRoast(content)
      }
      console.log('✅ Roast completed')
    } catch (err) {
      console.error('💥 Error generating roast:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate roast')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roast)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <form onSubmit={handleFormSubmit} className="flex w-full items-center space-x-2">
        <AIInputWithLoading
          placeholder="Enter Twitter username to roast"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1"
          disabled={isLoading}
          onSubmit={handleFormSubmit}
        />
      </form>

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {roast && (
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown className="whitespace-pre-wrap text-sm leading-relaxed">
              {roast}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
