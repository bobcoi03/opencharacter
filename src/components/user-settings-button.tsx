"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Settings, User, Sliders, Circle, Square, Shield, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { users } from '@/server/db/schema';
import Image from 'next/image';
import { saveUser, deleteUser } from '@/app/actions/index';
import NSFWToggle from './nsfw-toggle';
import NSFWBlur from './nsfw-blur';
import { ChatDialogStyling } from './chat-dialog-styling';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';

type UserType = typeof users.$inferSelect;

type SettingsButtonProps = {
  user: UserType;
};

const RecommendationsToggle = () => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem('message_recommendations_enabled');
      // If no value has been set yet, default to true (enabled)
      return savedValue === null ? true : savedValue === 'true';
    }
    return true;
  });

  const toggleRecommendations = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('message_recommendations_enabled', newValue.toString());
  };

  return (
    <div className="bg-neutral-800 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Message Recommendations</h3>
          <p className="text-xs text-neutral-400">
            Show message suggestions after AI responses
          </p>
        </div>
        <Switch 
          checked={enabled} 
          onCheckedChange={toggleRecommendations}
          className="data-[state=checked]:bg-white border border-neutral-700 bg-neutral-900"
        />
      </div>
    </div>
  );
};

const SettingsButton = ({ user }: SettingsButtonProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const [previewImage, setPreviewImage] = useState<string | null>(user.image);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
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
      localStorage.setItem('character_icon_style', 'square') 
    }
    if (characterIcon === 'circle') {
      localStorage.setItem('character_icon_style', 'circle');
    }
  }, [characterIcon])

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

  const handleShowDeleteConfirmation = () => {
    setIsOpen(false);
    setTimeout(() => {
      setShowDeleteConfirmation(true);
    }, 100);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setTimeout(() => {
      setIsOpen(true);
      setActiveTab('Account');
    }, 100);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const result = await deleteUser();
      
      if (result.success) {
        setShowDeleteConfirmation(false);
        router.push('/');
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
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
        <DialogContent className="sm:max-w-[800px] bg-neutral-900 text-white p-0 rounded-xl overflow-hidden max-h-[90vh] flex flex-col min-h-[30vh] z-[100]">
          <div className="flex flex-col sm:flex-row flex-grow overflow-hidden">
            <div className="sm:w-1/4 bg-neutral-800 p-4 flex flex-row sm:flex-col justify-between sm:justify-start">
              <nav className="flex flex-row sm:flex-col gap-2 sm:gap-0">
                {['Profile', 'Preferences', 'Account'].map((tab) => (
                  <Button
                    key={tab}
                    variant="ghost"
                    className={`justify-start rounded-xl px-3 py-2 text-sm ${activeTab === tab ? 'bg-neutral-700' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'Profile' && <User className="mr-2 h-4 w-4" />}
                    {tab === 'Preferences' && <Sliders className="mr-2 h-4 w-4" />}
                    {tab === 'Account' && <Shield className="mr-2 h-4 w-4" />}
                    {tab}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex-grow p-6 bg-neutral-900 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">{activeTab}</h2>
              {activeTab === 'Account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Account Information</h3>
                    <div className="bg-neutral-800 p-4 rounded-xl space-y-3">
                      <div>
                        <label className="text-sm text-neutral-400">Email</label>
                        <p className="text-white">{user.email || 'No email provided'}</p>
                      </div>
                      {user.emailVerified && (
                        <div>
                          <label className="text-sm text-neutral-400">Email Verified</label>
                          <p className="text-white">{new Date(user.emailVerified).toLocaleDateString()}</p>
                        </div>
                      )}
                      {user.pay_as_you_go !== undefined && (
                        <div>
                          <label className="text-sm text-neutral-400">Pay As You Go</label>
                          <p className="text-white">{user.pay_as_you_go ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-neutral-700">
                    <h3 className="text-lg font-medium text-red-500 mb-2">Danger Zone</h3>
                    <div className="bg-neutral-800 p-4 rounded-xl">
                      <p className="text-sm text-neutral-400 mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleShowDeleteConfirmation}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'Profile' && (
                <div className="space-y-2">
                  <div className="flex justify-center mb-2">
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
                    <label className="block mb-2 font-semibold">Character Icon</label>
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
                  <div className='w-full flex flex-col gap-4 '>
                    <NSFWToggle />
                    <NSFWBlur />
                    <ChatDialogStyling />
                    <RecommendationsToggle />
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
            {activeTab === "Profile" && 
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

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="bg-neutral-900 text-white p-6 rounded-xl max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="bg-red-900/30 border-red-800 text-red-300 my-4">
            <AlertDescription>
              All your conversations, characters, and personal data will be permanently deleted.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-4">
            <Button 
              variant="outline" 
              className="border-neutral-700 text-white hover:bg-neutral-800"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
            </Button>
          </DialogFooter>
          
          {errorMessage && (
            <div className="text-red-500 mt-2">{errorMessage}</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsButton;