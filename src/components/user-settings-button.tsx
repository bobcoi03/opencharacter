"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Settings, User, Sliders, Circle, Square } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { users } from '@/server/db/schema';
import Image from 'next/image';
import { saveUser } from '@/app/actions/index';

type User = typeof users.$inferSelect;

type SettingsButtonProps = {
  user: User;
};

const SettingsButton = ({ user }: SettingsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const [previewImage, setPreviewImage] = useState<string | null>(user.image);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [characterIcon, setCharacterIcon] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character_icon_style') || 'circle';
    }
    return 'circle';
  });
  const [iconSize, setIconSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('character_icon_size') || '40', 10);
    }
    return 40;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const bioInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (characterIcon === 'square') {
      localStorage.setItem('character_icon_style', 'square');
    } else {
      localStorage.removeItem('character_icon_style');
    }
  }, [characterIcon]);

  useEffect(() => {
    localStorage.setItem('character_icon_size', iconSize.toString());
  }, [iconSize]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("name", nameInputRef.current?.value || "");
    formData.append("bio", bioInputRef.current?.value || "");
    formData.append("characterIcon", characterIcon);
    formData.append("iconSize", iconSize.toString());
    
    if (fileInputRef.current?.files?.[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const result = await saveUser(formData);
      
      if (result.success) {
        console.log(result.message);
        setIsOpen(false);
        window.location.reload();
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full px-4 py-2"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] bg-neutral-900 text-white p-0 rounded-xl overflow-hidden max-h-[90vh] flex flex-col min-h-[70vh]">
          <div className="flex flex-col sm:flex-row flex-grow overflow-hidden">
            <div className="sm:w-1/4 bg-neutral-800 p-4 flex flex-row sm:flex-col justify-between sm:justify-start">
              <nav className="flex flex-row sm:flex-col gap-2 sm:gap-0">
                {['Profile', 'Preferences'].map((tab) => (
                  <Button
                    key={tab}
                    variant="ghost"
                    className={`justify-start rounded-xl px-3 py-2 text-sm ${activeTab === tab ? 'bg-neutral-700' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'Profile' && <User className="mr-2 h-4 w-4" />}
                    {tab === 'Preferences' && <Sliders className="mr-2 h-4 w-4" />}
                    {tab}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex-grow p-6 bg-neutral-900 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">{activeTab}</h2>
              {activeTab === 'Profile' && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div 
                      className="relative w-32 h-32 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <img
                        src={previewImage ?? '/default-avatar.jpg'}
                        alt={user.name ?? 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm">Change Avatar</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label htmlFor="displayName" className="block mb-2">Display Name</label>
                    <Input 
                      id="displayName" 
                      defaultValue={user.name ?? ''} 
                      className="bg-neutral-800 rounded-xl" 
                      ref={nameInputRef}
                    />
                    <div className="text-right text-sm text-neutral-400 mt-1">8/50</div>
                  </div>
                  <div>
                    <label htmlFor="bio" className="block mb-2">Bio</label>
                    <Textarea 
                      id="bio" 
                      className="bg-neutral-800 rounded-xl h-24" 
                      ref={bioInputRef}
                      defaultValue={user.bio ?? ''}
                      placeholder='Bio max 500 characters'
                    />
                  </div>
                </div>
              )}
              {activeTab === 'Preferences' && (
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2">Character Icon</label>
                    <div className="flex gap-4">
                      <Button
                        variant={characterIcon === 'circle' ? 'default' : 'outline'}
                        className="rounded-xl flex items-center gap-2"
                        onClick={() => setCharacterIcon('circle')}
                      >
                        <Circle className="h-4 w-4" />
                        Circle
                      </Button>
                      <Button
                        variant={characterIcon === 'square' ? 'default' : 'outline'}
                        className="rounded-xl flex items-center gap-2"
                        onClick={() => setCharacterIcon('square')}
                      >
                        <Square className="h-4 w-4" />
                        Square
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2">Icon Size</label>
                    <Slider
                      min={24}
                      max={64}
                      step={1}
                      value={[iconSize]}
                      onValueChange={(value) => setIconSize(value[0])}
                      className="w-full"
                    />
                    <div className="text-sm text-neutral-400 mt-1">{iconSize}px</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div 
                      className={`overflow-hidden ${characterIcon === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
                      style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                    >
                      <img
                        src={previewImage ?? '/default-avatar.jpg'}
                        alt={user.name ?? 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              )}
              {errorMessage && (
                <div className="text-red-500 mt-2">{errorMessage}</div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-neutral-800">
            <Button
              variant="outline"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none"
              onClick={() => window.open('https://discord.gg/xrjTEeaQ', '_blank')}
            >
              <Image src="/discord-thumb.png" alt="Discord" width={16} height={16} className="mr-2" />
              Join Discord
            </Button>
            <div className="flex gap-2">
            {activeTab == "Profile" && 
                <>
                <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    className="rounded-xl bg-white text-black hover:bg-neutral-200"
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
                </>
            }
              
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsButton;