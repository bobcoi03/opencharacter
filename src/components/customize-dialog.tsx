"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Palette, X, Save, Upload, EyeOff, Eye, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import { HexColorPicker } from "react-colorful"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

// IndexedDB setup for background image
const DB_NAME = "chatCustomization"
const DB_VERSION = 2 // Increment version to trigger onupgradeneeded
const STORE_NAME = "backgroundImages"
const ACTIVE_IMAGE_KEY = "activeBackgroundImage"
const IMAGE_KEYS = ["backgroundImage1", "backgroundImage2", "backgroundImage3"]

async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    // This will run when the database is first created or when the version changes
    request.onupgradeneeded = () => {
      const db = request.result
      
      // Check if the store already exists before trying to create it
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log("Creating object store:", STORE_NAME)
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

async function saveBackgroundImage(key: string, imageData: string | null) {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    
    if (imageData === null) {
      store.delete(key)
    } else {
      store.put(imageData, key)
    }
    
    // Wait for the transaction to complete
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error(`Error saving background image for ${key}:`, error)
  }
}

// Function to delete and recreate the database if needed
async function resetDatabase() {
  return new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    
    deleteRequest.onerror = () => reject(deleteRequest.error)
    deleteRequest.onsuccess = () => {
      console.log("Database deleted successfully")
      // Now open the database again to recreate it
      const openRequest = indexedDB.open(DB_NAME, DB_VERSION)
      
      openRequest.onerror = () => reject(openRequest.error)
      openRequest.onsuccess = () => {
        console.log("Database recreated successfully")
        openRequest.result.close()
        resolve()
      }
      
      openRequest.onupgradeneeded = (event) => {
        const db = openRequest.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    }
  })
}

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

  const [backgroundImages, setBackgroundImages] = useState<{[key: string]: string | null}>({
    [IMAGE_KEYS[0]]: null,
    [IMAGE_KEYS[1]]: null,
    [IMAGE_KEYS[2]]: null,
    [ACTIVE_IMAGE_KEY]: null
  })
  
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("background_image_enabled") !== "false"
    }
    return true
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [dbError, setDbError] = useState<Error | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get active background image
  const activeImage = backgroundImages[backgroundImages[ACTIVE_IMAGE_KEY] || ""] || null

  useEffect(() => {
    localStorage.setItem("user_chat_color", userColor)
    localStorage.setItem("ai_chat_color", aiColor)
  }, [userColor, aiColor])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("background_image_enabled", isBackgroundEnabled.toString())
    }
  }, [isBackgroundEnabled])

  // Initialize database and load background images
  useEffect(() => {
    const initializeAndLoad = async () => {
      try {
        setIsLoading(true)
        setDbError(null)
        
        // Try to load images
        const images = await getBackgroundImages()
        setBackgroundImages(images)
      } catch (error) {
        console.error("Database error, attempting to reset:", error)
        setDbError(error as Error)
        
        try {
          // If there's an error, try to reset the database
          await resetDatabase()
          // Try loading again after reset
          const images = await getBackgroundImages()
          setBackgroundImages(images)
          setDbError(null)
        } catch (resetError) {
          console.error("Failed to reset database:", resetError)
          setDbError(resetError as Error)
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    if (typeof window !== "undefined") {
      initializeAndLoad()
    }
  }, [])

  // Save all background images to IndexedDB when they change
  useEffect(() => {
    const saveImages = async () => {
      if (typeof window === "undefined" || isLoading || dbError) return
      
      try {
        // Save each image
        for (const key of IMAGE_KEYS) {
          if (backgroundImages[key] !== undefined) {
            await saveBackgroundImage(key, backgroundImages[key])
          }
        }
        
        // Save active image key
        if (backgroundImages[ACTIVE_IMAGE_KEY] !== undefined) {
          await saveBackgroundImage(ACTIVE_IMAGE_KEY, backgroundImages[ACTIVE_IMAGE_KEY])
        }
      } catch (error) {
        console.error("Failed to save background images:", error)
        setDbError(error as Error)
      }
    }
    
    saveImages()
  }, [backgroundImages, isLoading, dbError])

  const handleSave = () => {
    window.location.reload()
  }

  const handleReset = async () => {
    localStorage.removeItem("user_chat_color")
    localStorage.removeItem("ai_chat_color")
    localStorage.removeItem("background_image_enabled")
    
    // Reset all background images
    try {
      for (const key of [...IMAGE_KEYS, ACTIVE_IMAGE_KEY]) {
        await saveBackgroundImage(key, null)
      }
      
      setBackgroundImages({
        [IMAGE_KEYS[0]]: null,
        [IMAGE_KEYS[1]]: null,
        [IMAGE_KEYS[2]]: null,
        [ACTIVE_IMAGE_KEY]: null
      })
      setIsBackgroundEnabled(true)
      window.location.reload()
    } catch (error) {
      console.error("Failed to reset background images:", error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            resolve(e.target.result)
          } else {
            reject(new Error("Failed to read file"))
          }
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      
      // Find the first empty slot or use the first slot if all are filled
      let targetKey = IMAGE_KEYS[0]
      for (const key of IMAGE_KEYS) {
        if (!backgroundImages[key]) {
          targetKey = key
          break
        }
      }
      
      // Update state with new image data
      const updatedImages = {
        ...backgroundImages,
        [targetKey]: result,
        [ACTIVE_IMAGE_KEY]: targetKey
      }
      
      setBackgroundImages(updatedImages)
      setIsBackgroundEnabled(true)
      
    } catch (error) {
      console.error("Failed to upload image:", error)
    } finally {
      // Clear the input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemoveImage = async (key: string) => {
    try {
      // Find another image to set as active if needed
      let newActiveKey = backgroundImages[ACTIVE_IMAGE_KEY]
      if (newActiveKey === key) {
        newActiveKey = null
        for (const imgKey of IMAGE_KEYS) {
          if (imgKey !== key && backgroundImages[imgKey]) {
            newActiveKey = imgKey
            break
          }
        }
      }
      
      // Update state
      setBackgroundImages(prev => ({
        ...prev,
        [key]: null,
        [ACTIVE_IMAGE_KEY]: newActiveKey
      }))
      
    } catch (error) {
      console.error(`Failed to remove image ${key}:`, error)
    }
  }

  const setActiveImage = (key: string) => {
    setBackgroundImages(prev => ({
      ...prev,
      [ACTIVE_IMAGE_KEY]: key
    }))
    setIsBackgroundEnabled(true)
  }

  const toggleBackgroundImage = () => {
    setIsBackgroundEnabled(!isBackgroundEnabled)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Check if any images are uploaded
  const hasAnyImages = IMAGE_KEYS.some(key => !!backgroundImages[key])

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
          <DialogTitle className="text-xs">Customize</DialogTitle>
          <DialogDescription className="sr-only">
            Customize chat appearance including colors and background images
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-3">
          {/* Preview */}
          <Card 
            className="bg-zinc-800 p-3 relative" 
            style={{
              backgroundImage: activeImage && isBackgroundEnabled ? `url(${activeImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              height: '120px'
            }}
          >
            <div className="flex flex-col gap-1 h-full justify-between">
              <div>
                <div style={{ backgroundColor: aiColor }} className="h-3 w-16 rounded-full transition-colors" />
                <div style={{ backgroundColor: userColor }} className="ml-auto h-3 w-20 rounded-full transition-colors mt-1" />
              </div>
              <div className="text-center text-[10px] text-zinc-400 bg-black/50 rounded px-1 w-fit mx-auto">Preview</div>
            </div>
          </Card>

          {/* Database Error Message */}
          {dbError && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-2 text-xs text-red-200">
              <p className="font-semibold mb-1">Storage Error</p>
              <p>There was a problem with image storage. Your images may not be saved.</p>
            </div>
          )}

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

          <Separator className="bg-zinc-800" />

          {/* Background Image Uploader */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-xs font-semibold">Chat background</h3>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              onChange={handleImageUpload} 
              className="hidden" 
            />

            {hasAnyImages ? (
              <div className="space-y-2">
                {/* Image Gallery */}
                <div className="grid grid-cols-3 gap-2">
                  {IMAGE_KEYS.map((key, index) => (
                    <div key={key} className="relative">
                      {backgroundImages[key] ? (
                        <div 
                          className={`relative rounded-md overflow-hidden cursor-pointer border-2 ${backgroundImages[ACTIVE_IMAGE_KEY] === key ? 'border-zinc-500' : 'border-transparent'}`}
                          style={{ height: '60px' }}
                          onClick={() => setActiveImage(key)}
                        >
                          <img 
                            src={backgroundImages[key] || ''} 
                            alt={`Background ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          {backgroundImages[ACTIVE_IMAGE_KEY] === key && (
                            <div className="absolute bottom-1 right-1 bg-black/70 p-1 rounded-full">
                              <Check className="w-2 h-2 text-white" />
                            </div>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(key);
                            }}
                            className="absolute top-1 right-1 bg-black/70 p-1 rounded-full hover:bg-black/90 transition-colors"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Button 
                          onClick={triggerFileInput}
                          className="w-full h-[60px] bg-zinc-800 hover:bg-zinc-700 text-gray-400 text-xs flex items-center justify-center"
                          variant="outline"
                        >
                          <Upload className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Background Toggle */}
                {activeImage && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={isBackgroundEnabled} 
                        onCheckedChange={toggleBackgroundImage}
                        className="data-[state=checked]:bg-zinc-600"
                      />
                      <span className="text-xs text-zinc-300">
                        {isBackgroundEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <Button
                      onClick={toggleBackgroundImage}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-zinc-800 hover:bg-zinc-700"
                    >
                      {isBackgroundEnabled ? (
                        <EyeOff className="h-3 w-3 text-zinc-400" />
                      ) : (
                        <Eye className="h-3 w-3 text-zinc-400" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                onClick={triggerFileInput}
                className="w-full h-8 bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                <span>Upload background image</span>
              </Button>
            )}
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

