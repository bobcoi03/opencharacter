'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { roastTweets, getRoast } from '@/app/actions/index'
import { Card } from "@/components/ui/card"
import { Loader2, Copy, Check, AtSign, Flame } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { readStreamableValue } from "ai/rsc"
import { useSearchParams } from 'next/navigation'

export function TwitterRoastForm() {
  const [username, setUsername] = useState('')
  const [roast, setRoast] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [currentRoastId, setCurrentRoastId] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadExistingRoast = async () => {
      const id = searchParams.get('id')
      const username = searchParams.get('username')
      
      if (id && username) {
        setIsLoading(true)
        try {
          const existingRoast = await getRoast(id)
          if (existingRoast && existingRoast[0]) {
            setUsername(username)
            setRoast(existingRoast[0].roastContent)
            setCurrentRoastId(id)
          }
        } catch (err) {
          console.error('Error loading roast:', err)
          setError(err instanceof Error ? err.message : 'Failed to load roast')
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadExistingRoast()
  }, [searchParams])

  async function handleFormSubmit(e: React.FormEvent | string) {
    if (typeof e !== 'string') {
      e.preventDefault()
      if (!username) return
    } else {
      if (!e) return
      setUsername(e)
    }

    // Strip @ symbol from username if present
    const cleanUsername = (typeof e === 'string' ? e : username).replace(/^@/, '')
    setUsername(cleanUsername) // Update the input field to show cleaned username
    setIsLoading(true)
    setError(undefined)
    setRoast('')
    
    try {
      const roastId = crypto.randomUUID()
      setCurrentRoastId(roastId)
      
      console.log('🎭 Generating roast for:', cleanUsername, 'with ID:', roastId)
      const result = await roastTweets(cleanUsername, roastId)
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
      <div className="text-center space-y-2 mb-8">
        <div className="relative">
          <h1 className={cn(
            "text-4xl md:text-5xl font-bold",
            "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500",
            "bg-clip-text text-transparent",
            "animate-gradient-x bg-[length:200%_auto]",
            "pb-2"
          )}>
            DeepRoast
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 
            bg-gradient-to-r from-purple-500 to-pink-500 
            rounded-full blur-sm" />
        </div>
        <p className="text-muted-foreground animate-fade-in">
          Let DeepSeek R1 roast your Twitter profile 🔥
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="relative group">
        <div className={cn(
          "relative flex items-center transition-all duration-300",
          isFocused ? "transform scale-[1.02]" : ""
        )}>
          <div className="absolute left-3 text-muted-foreground">
            <AtSign className="w-5 h-5" />
          </div>
          <Input
            placeholder="Twitter username to roast!"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-10 pr-32 h-14 text-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10",
              "border-2 border-purple-500/20 focus:border-pink-500/50",
              "transition-all duration-300 rounded-2xl",
              "placeholder:text-muted-foreground/50",
              isFocused ? "shadow-[0_0_15px_rgba(236,72,153,0.3)]" : ""
            )}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "absolute right-2 bg-gradient-to-r from-purple-500 to-pink-500",
              "hover:from-purple-600 hover:to-pink-600",
              "text-white font-semibold px-4 h-10 rounded-xl",
              "transition-all duration-300 hover:scale-105",
              "flex items-center gap-2"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Roasting...
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 animate-pulse" />
                Roast!
              </>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <p className="text-red-500 text-center animate-shake">{error}</p>
      )}

      {roast && (
        <>
          <div className="flex items-center justify-center gap-2 flex-wrap">

            {/* Twitter/X Share */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🔥 Check out this AI roast of @${username}!\n\n`)}&url=${encodeURIComponent(`${window.location.origin}/tools/twitter-roast?username=${username}&id=${currentRoastId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 transition-all hover:bg-purple-500/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M13.3174 10.7749L19.1457 4H17.7646L12.7039 9.88256L8.66193 4H4L10.1122 12.8955L4 20H5.38119L10.7254 13.7878L14.994 20H19.656L13.3171 10.7749H13.3174ZM11.4257 12.9738L10.8064 12.0881L5.87886 5.03974H8.00029L11.9769 10.728L12.5962 11.6137L17.7652 19.0075H15.6438L11.4257 12.9742V12.9738Z" />
                </svg>
                Share
              </Button>
            </a>

            {/* Facebook Share */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/tools/twitter-roast?username=${username}&id=${currentRoastId}`)}&quote=${encodeURIComponent(`🔥 Check out this AI roast of @${username}!\n\n${roast}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 transition-all hover:bg-purple-500/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                </svg>
                Facebook
              </Button>
            </a>

            {/* LinkedIn Share */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/tools/twitter-roast?username=${username}&id=${currentRoastId}`)}&summary=${encodeURIComponent(`🔥 Check out this AI roast of @${username}!\n\n${roast}`)}&title=${encodeURIComponent("AI Twitter Roast by DeepRoast")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 transition-all hover:bg-purple-500/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </Button>
            </a>

            {/* Direct Link Share */}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 transition-all hover:bg-purple-500/10"
              onClick={async () => {
                const url = `${window.location.origin}/tools/twitter-roast?username=${username}&id=${currentRoastId}`;
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Link Copied!
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Link
                </>
              )}
            </Button>
          </div>
          <Card className="relative group p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown className="whitespace-pre-wrap text-sm leading-relaxed">
                {roast}
              </ReactMarkdown>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
