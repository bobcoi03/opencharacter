"use client"

import { useEffect, useState } from "react"

// IndexedDB setup for background image
const DB_NAME = "chatCustomization"
const DB_VERSION = 2
const STORE_NAME = "backgroundImages"
const ACTIVE_IMAGE_KEY = "activeBackgroundImage"
const IMAGE_KEYS = ["backgroundImage1", "backgroundImage2", "backgroundImage3"]

async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

async function getBackgroundImages(): Promise<{[key: string]: string | null}> {
  try {
    const db = await openDB()
    const result: {[key: string]: string | null} = {}
    
    for (const key of [...IMAGE_KEYS, ACTIVE_IMAGE_KEY]) {
      result[key] = await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly")
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)
        
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result || null)
      })
    }
    
    return result
  } catch (error) {
    console.error("Error getting background images:", error)
    return {
      [IMAGE_KEYS[0]]: null,
      [IMAGE_KEYS[1]]: null,
      [IMAGE_KEYS[2]]: null,
      [ACTIVE_IMAGE_KEY]: null
    }
  }
}

interface ChatBackgroundProps {
  children: React.ReactNode
}

export default function ChatBackground({ children }: ChatBackgroundProps) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if background is enabled in localStorage
    if (typeof window !== "undefined") {
      const enabled = localStorage.getItem("background_image_enabled") !== "false"
      setIsBackgroundEnabled(enabled)
    }
  }, [])

  // Load background image from IndexedDB
  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        setIsLoading(true)
        const images = await getBackgroundImages()
        
        // Get the active image key and then the actual image data
        const activeImageKey = images[ACTIVE_IMAGE_KEY]
        const activeImage = activeImageKey ? images[activeImageKey] : null
        
        setBackgroundImage(activeImage)
      } catch (error) {
        console.error("Failed to load background image:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (typeof window !== "undefined") {
      loadBackgroundImage()
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Background layer - fixed to viewport */}
      {backgroundImage && isBackgroundEnabled && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'rgba(0,0,0,0.03)',
            opacity: 0.7,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Content layer - scrollable */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
} 