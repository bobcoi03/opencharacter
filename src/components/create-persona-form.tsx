'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Repeat2, Loader2, Camera } from 'lucide-react';
import { CreatePersona, updatePersona } from "@/app/actions/index"
import { useRouter } from 'next/navigation';
import { personas } from '@/server/db/schema';

interface CreatePersonaFormProps {
    edit?: boolean;
    persona?: typeof personas.$inferSelect | undefined
}

export default function CreatePersonaForm({ edit = false, persona }: CreatePersonaFormProps) {
    const [displayName, setDisplayName] = useState(persona?.displayName || '');
    const [background, setBackground] = useState(persona?.background || '');
    const [isDefault, setIsDefault] = useState(persona?.isDefault || false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(persona?.image || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (persona) {
            setDisplayName(persona.displayName);
            setBackground(persona.background);
            setIsDefault(persona.isDefault);
            setAvatarPreview(persona.image || null);
        }
    }, [persona]);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        const formData = new FormData();
        formData.append('displayName', displayName);
        formData.append('background', background);
        formData.append('isDefault', isDefault ? 'on' : 'off');

        if (fileInputRef.current?.files?.[0]) {
            formData.append('avatar', fileInputRef.current.files[0]);
        }

        if (edit && persona) {
            formData.append('personaId', persona.id);
        }

        try {
            const result = edit && persona 
                ? await updatePersona(formData)
                : await CreatePersona(formData);

            if (result.success) {
                setSuccess(true);
                router.push(`/profile/persona?t=${new Date().getTime()}`);
            } else {
                setError(result.error || 'An unexpected error occurred');
            }
        } catch (err) {
            setError(`Failed to ${edit ? 'update' : 'create'} persona. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
            <div className="flex justify-center mb-6">
                <div 
                    className="relative w-24 h-24 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-full h-full rounded-full overflow-hidden">
                        <img
                            src={avatarPreview || '/default-avatar.jpg'}
                            alt="Persona Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                </div>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    ref={fileInputRef}
                    className="hidden"
                />
            </div>

            <div className="bg-neutral-800 rounded-lg p-4">
                <div className="flex items-start mb-4">
                    <Clock className="w-6 h-6 mr-2 text-neutral-400" />
                    <p className="text-sm">Characters will remember your persona information to improve their conversations with you</p>
                </div>
                <div className="flex items-start">
                    <Repeat2 className="w-6 h-6 mr-2 text-neutral-400" />
                    <p className="text-sm">Create multiple personas to change your background info between chats</p>
                </div>
            </div>

            <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-1">Display Name</label>
                <div className="relative">
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-neutral-800 rounded-md py-2 px-3 text-white"
                        maxLength={20}
                        required
                    />
                    <div className="absolute right-3 top-2 text-neutral-400 text-sm">{displayName.length}/20</div>
                </div>
            </div>

            <div>
                <label htmlFor="background" className="block text-sm font-medium mb-1">Background</label>
                <div className="relative">
                    <textarea
                        id="background"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-full bg-neutral-800 rounded-md py-2 px-3 text-white resize-none"
                        rows={4}
                        maxLength={728*2}
                        required
                    ></textarea>
                    <div className="absolute right-3 bottom-2 text-neutral-400 text-sm">{background.length}/{728*2}</div>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="defaultChat"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="mr-2 bg-neutral-800 border-neutral-600 rounded"
                />
                <label htmlFor="defaultChat" className="text-sm">Make default for new chats</label>
            </div>

            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}

            {success && (
                <div className="text-green-500 text-sm">Persona {edit ? 'updated' : 'created'} successfully!</div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-neutral-700 text-white rounded-md py-2 font-medium flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin mr-2" />
                        {edit ? 'Updating...' : 'Creating...'}
                    </>
                ) : edit ? 'Update' : 'Create'}
            </button>
        </form>
    );
}