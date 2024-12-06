"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createCharacter } from "@/app/actions/character"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { extractPngMetadata } from "@/lib/png-metadata"

interface CharacterData {
    name: string;
    tagline: string;
    description: string;
    greeting: string;
    visibility: string;
    avatar_image_url?: string;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    repetition_penalty?: number;
    min_p?: number;
    top_a?: number;
    max_tokens?: number;
    tags?: string[];
}

export default function CreateCharacterImport() {
    const [jsonContent, setJsonContent] = useState<CharacterData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const validateRequiredFields = (content: any): CharacterData | null => {
        // Handle Character.AI format
        if (content.char_name || content.char_persona || content.example_dialogue || content.mes_example) {
            // Combine all descriptive fields into one comprehensive description
            const descriptionParts = [
                content.char_persona ? `Character Persona:\n${content.char_persona}\n\n` : '',
                content.description ? `Description:\n${content.description}\n\n` : '',
                content.example_dialogue ? `Example Dialogue:\n${content.example_dialogue}\n\n` : '',
                content.mes_example ? `Message Examples:\n${content.mes_example}` : ''
            ].filter(Boolean);

            const combinedDescription = descriptionParts.join('').trim();
            
            // Get tagline from personality or first line of char_persona
            const tagline = content.personality || 
                          (content.char_persona ? content.char_persona.split('\n')[0] : '') || 
                          content.description || 
                          'No description available';

            return {
                name: content.char_name || content.name || '',
                tagline: tagline,
                description: combinedDescription || content.description || content.char_persona || '',
                greeting: content.char_greeting || content.first_mes || 'Hello!',
                visibility: "public",
                temperature: 1.0,
                top_p: 1.0,
                top_k: 0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                repetition_penalty: 1.0,
                min_p: 0.0,
                top_a: 0.0,
                max_tokens: 600,
                tags: []
            }
        }

        // Handle Chara Card V2 format
        if (content.spec === "chara_card_v2" && content.data) {
            return {
                name: content.data.name,
                tagline: content.data.personality || content.data.description.slice(0, 500) + "...",
                description: content.data.description,
                greeting: content.data.first_mes,
                visibility: "public",
                avatar_image_url: content.data.avatar,
                temperature: 1.0,
                top_p: 1.0,
                top_k: 0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                repetition_penalty: 1.0,
                min_p: 0.0,
                top_a: 0.0,
                max_tokens: 600,
                tags: []
            }
        }

        // Handle direct format
        const requiredFields = ['name', 'tagline', 'description', 'greeting']
        const missingFields = requiredFields.filter(field => !content[field])
        
        if (missingFields.length > 0) {
            toast({
                title: "Missing Required Fields",
                description: `Missing: ${missingFields.join(', ')}`,
                variant: "destructive",
            })
            return null
        }
        
        return {
            ...content,
            visibility: content.visibility || "public",
            temperature: content.temperature || 1.0,
            top_p: content.top_p || 1.0,
            top_k: content.top_k || 0,
            frequency_penalty: content.frequency_penalty || 0.0,
            presence_penalty: content.presence_penalty || 0.0,
            repetition_penalty: content.repetition_penalty || 1.0,
            min_p: content.min_p || 0.0,
            top_a: content.top_a || 0.0,
            max_tokens: content.max_tokens || 600,
            tags: content.tags || []
        }
    }

    const onDropJson = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const content = JSON.parse(e.target?.result as string)
                    const validatedContent = validateRequiredFields(content)
                    if (validatedContent) {
                        setJsonContent(validatedContent)
                        toast({
                            title: "Success",
                            description: "Character JSON file uploaded successfully",
                        })
                    }
                } catch (error) {
                    toast({
                        title: "Error",
                        description: "Invalid JSON file",
                        variant: "destructive",
                    })
                }
            }
            reader.readAsText(file)
        }
    }, [toast])

    const onDropPng = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            try {
                const metadata = await extractPngMetadata(file)
                const validatedContent = validateRequiredFields(metadata)
                if (validatedContent) {
                    // Create object URL for the PNG file
                    const imageUrl = URL.createObjectURL(file)
                    setJsonContent({
                        ...validatedContent,
                        avatar_image_url: imageUrl
                    })
                    toast({
                        title: "Success",
                        description: "Character PNG file uploaded successfully",
                    })
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to extract character data from PNG",
                    variant: "destructive",
                })
            }
        }
    }, [toast])

    const { getRootProps: getJsonRootProps, getInputProps: getJsonInputProps, isDragActive: isJsonDragActive } = useDropzone({
        onDrop: onDropJson,
        accept: {
            'application/json': ['.json']
        },
        maxFiles: 1
    })

    const { getRootProps: getPngRootProps, getInputProps: getPngInputProps, isDragActive: isPngDragActive } = useDropzone({
        onDrop: onDropPng,
        accept: {
            'image/png': ['.png']
        },
        maxFiles: 1
    })

    const handleImport = async () => {
        if (!jsonContent) return

        setIsLoading(true)
        try {
            const formData = new FormData()
            formData.append('name', jsonContent.name)
            formData.append('tagline', jsonContent.tagline)
            formData.append('description', jsonContent.description)
            formData.append('greeting', jsonContent.greeting)
            formData.append('visibility', jsonContent.visibility)
            formData.append('temperature', String(jsonContent.temperature))
            formData.append('top_p', String(jsonContent.top_p))
            formData.append('top_k', String(jsonContent.top_k))
            formData.append('frequency_penalty', String(jsonContent.frequency_penalty))
            formData.append('presence_penalty', String(jsonContent.presence_penalty))
            formData.append('repetition_penalty', String(jsonContent.repetition_penalty))
            formData.append('min_p', String(jsonContent.min_p))
            formData.append('top_a', String(jsonContent.top_a))
            formData.append('max_tokens', String(jsonContent.max_tokens))
            formData.append('tags', JSON.stringify(jsonContent.tags))

            // Handle avatar image URL
            if (jsonContent.avatar_image_url) {
                if (jsonContent.avatar_image_url.startsWith('blob:')) {
                    // For PNG uploads, we already have the file
                    const response = await fetch(jsonContent.avatar_image_url)
                    const blob = await response.blob()
                    formData.append('avatar', blob, 'avatar.png')
                } else {
                    // For JSON uploads with avatar URL
                    const avatarResponse = await fetch(jsonContent.avatar_image_url)
                    const avatarBlob = await avatarResponse.blob()
                    formData.append('avatar', avatarBlob, 'avatar.png')
                }
            }

            const result = await createCharacter(formData)

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Character imported successfully!",
                })
                router.push(`/chat/${result?.character?.id}`)
            } else {
                throw new Error(result.error || 'Failed to import character')
            }
        } catch (error) {
            console.error('Import error:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to import character",
                variant: "destructive",
            })
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 2000);
        }
    }

    const handleVisibilityChange = (checked: boolean) => {
        if (jsonContent) {
            setJsonContent({
                ...jsonContent,
                visibility: checked ? "public" : "private"
            })
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Import Character</h1>
                {jsonContent && (
                    <Button 
                        className="rounded-full px-6" 
                        size="lg"
                        onClick={handleImport}
                        disabled={isLoading}
                    >
                        {isLoading ? "Importing..." : "Import Character"}
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Card className="overflow-hidden border-0">
                    <div
                        {...getJsonRootProps()}
                        className={`p-8 text-center cursor-pointer transition-all h-full
                            ${isJsonDragActive ? 'bg-primary/10 scale-[0.99]' : 'hover:bg-primary/5'}`}
                    >
                        <input {...getJsonInputProps()} />
                        <div className="space-y-4">
                            <div className="text-5xl">📄</div>
                            {isJsonDragActive ? (
                                <p className="text-lg font-medium">Drop the JSON file here...</p>
                            ) : (
                                <>
                                    <p className="text-lg font-medium">Import from JSON</p>
                                    <p className="text-sm text-gray-500">Drag and drop or click to select</p>
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="overflow-hidden border-0">
                    <div
                        {...getPngRootProps()}
                        className={`p-8 text-center cursor-pointer transition-all h-full
                            ${isPngDragActive ? 'bg-primary/10 scale-[0.99]' : 'hover:bg-primary/5'}`}
                    >
                        <input {...getPngInputProps()} />
                        <div className="space-y-4">
                            <div className="text-5xl">🖼️</div>
                            {isPngDragActive ? (
                                <p className="text-lg font-medium">Drop the PNG file here...</p>
                            ) : (
                                <>
                                    <p className="text-lg font-medium">Import from PNG</p>
                                    <p className="text-sm text-gray-500">Drag and drop or click to select</p>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {jsonContent && (
                <Card className="mt-4 overflow-hidden border-0">
                    <div className="border-t border-neutral-800">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="visibility"
                                        checked={jsonContent.visibility === "public"}
                                        onCheckedChange={handleVisibilityChange}
                                    />
                                    <Label htmlFor="visibility" className="text-sm font-medium">
                                        {jsonContent.visibility === "public" ? "Public" : "Private"}
                                    </Label>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                {jsonContent.avatar_image_url && (
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
                                        <img
                                            src={jsonContent.avatar_image_url}
                                            alt={jsonContent.name}
                                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-200"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold">{jsonContent.name}</h2>
                                    <p className="text-gray-400 mt-1">{jsonContent.tagline}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="rounded-xl">
                                    <h3 className="font-semibold mb-2">Description</h3>
                                    <p className="text-gray-300 whitespace-pre-wrap">{jsonContent.description}</p>
                                </div>
                                
                                <div className="rounded-xl">
                                    <h3 className="font-semibold mb-2">Greeting</h3>
                                    <p className="text-gray-300 whitespace-pre-wrap">{jsonContent.greeting}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    )
}