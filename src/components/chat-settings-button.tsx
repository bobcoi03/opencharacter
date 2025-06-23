"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Ellipsis, Share, Flag, Edit, MessageSquarePlus, UserPlus, MoreVertical, Globe, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { characters, chat_sessions, ChatMessageArray } from '@/server/db/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createChatSession, getAllConversationsByCharacter, getAllUserPersonas, getDefaultPersona, setDefaultPersona, clearDefaultPersona } from '@/app/actions/index';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { personas as PersonaType } from '@/server/db/schema';
import { useToast } from "@/hooks/use-toast"
import ChatSessionDeleteButton from './chat-session-delete-button';
import { Textarea } from './ui/textarea';
import { Brain } from 'lucide-react';
import { CoreMessage } from 'ai';
import { summarizeConversation, saveSummarization, fetchSummary, toggleChatSessionSharing, getChatSessionShareStatus, updateChatSessionTitle } from '@/app/actions/chat';
import { readStreamableValue } from 'ai/rsc';
import { Switch } from './ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import CustomizeDialog from './customize-dialog';
import { reportCharacter } from '@/app/actions/character';

export default function EllipsisButton({ character, made_by_username, chat_session, messages }: { character: typeof characters.$inferSelect, made_by_username: string, chat_session: string | null, messages: CoreMessage[] }) {
  const [shareMessage, setShareMessage] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [conversations, setConversations] = useState<typeof chat_sessions.$inferSelect[]>([]);
  const [personas, setPersonas] = useState<typeof PersonaType.$inferSelect[]>([]);
  const [defaultPersona, setDefaultPersonaState] = useState<typeof PersonaType.$inferSelect | null>(null);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [memoryContent, setMemoryContent] = useState('');
  const [isLoadingAutoSummarize, setIsLoadingAutoSummarize] = useState(false);
  const [shareStatus, setShareStatus] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [isOpenAISettingsOpen, setIsOpenAISettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const router = useRouter();
  const [isTogglingShare, setIsTogglingShare] = useState(false);
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReportConfirmationOpen, setIsReportConfirmationOpen] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedBaseUrl = localStorage.getItem('openai_base_url');
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('selectedModel');
    if (savedBaseUrl) setBaseUrl(savedBaseUrl);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setModelInput(savedModel);
  }, []);

  useEffect(() => {
    const fetchShareStatus = async () => {
      const status = await getChatSessionShareStatus(character, chat_session || undefined);
      if (status.error) {
        setShareStatus(false);
      } else {
        setShareStatus(status.chatSession?.share ?? false);
      }
    };
    fetchShareStatus();
  }, [character, chat_session]);

  const handleToggleShare = async () => {
    setIsTogglingShare(true);
    try {
      const result = await toggleChatSessionSharing(character, chat_session || undefined);
      if (result.error) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      } else {
        setShareStatus(result.chatSession!.share || false);
        toast({
          title: "Success",
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Failed to toggle chat session sharing:", error);
      toast({
        title: "Error",
        description: "Failed to toggle chat sharing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingShare(false);
    }
  };

  useEffect(() => {
    const ff = async () => {
      const content = await fetchSummary(character, chat_session)
      setMemoryContent(content.summary || "")
    }
    ff()
  }, [])

  useEffect(() => {
    const fetchConversations = async () => {
      const fetchedConversations = await getAllConversationsByCharacter(character.id);
      setConversations(fetchedConversations);
    };
    fetchConversations();
    fetchDefaultPersona();
  }, [character.id]);

  const fetchDefaultPersona = async () => {
    const result = await getDefaultPersona();
    if (result.success && result.persona) {
      setDefaultPersonaState(result.persona);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareMessage('URL copied to clipboard!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setShareMessage('Failed to copy URL');
    }
  };

  const handleNewChat = async () => {
    setIsCreatingSession(true);
    try {
      const sessionId = await createChatSession(character);
      router.push(`/chat/${character.id}?session=${sessionId}`);
      window.location.reload()
    } catch (error) {
      console.error('Failed to create chat session:', error);
      setShareMessage('Failed to create new chat. Please try again.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleContinueChat = (conversationId: string) => {
    console.log("going to conversation session: ", conversationId);
    // Navigate to the chat page with a timestamp to force a reload
    const timestamp = new Date().getTime();
    window.location.href = `/chat/${character.id}?session=${conversationId}&t=${timestamp}`;
  };

  const fetchPersonas = async () => {
    setIsLoadingPersonas(true);
    try {
      const result = await getAllUserPersonas();
      if (result.success) {
        setPersonas(result.personas);
      } else {
        console.error(result.error);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Failed to fetch personas:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  const handleSetDefaultPersona = async (persona: typeof PersonaType.$inferSelect) => {
    setIsSettingDefault(true);
    try {
      // If clicking on the current default persona, deselect it
      if (defaultPersona && defaultPersona.id === persona.id) {
        const result = await clearDefaultPersona();
        if (result.success) {
          setDefaultPersonaState(null);
          setPersonas(prevPersonas => prevPersonas.map(p => ({
            ...p,
            isDefault: false
          })));
          toast({
            title: `Removed ${persona.displayName} as default persona`,
          })
          setTimeout(() => window.location.reload(), 1000)
        } else {
          console.error(result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to remove default persona",
            variant: "destructive",
          });
        }
      } else {
        // Normal behavior - set as default
        const result = await setDefaultPersona(persona.id);
        if (result.success) {
          // Update the local state to reflect the change
          setDefaultPersonaState(persona);
          setPersonas(prevPersonas => prevPersonas.map(p => ({
            ...p,
            isDefault: p.id === persona.id
          })));
          toast({
            title: `Set ${persona.displayName} as default persona`,
          })
          setTimeout(() => window.location.reload(), 1000)
        } else {
          console.error(result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to set default persona",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to set default persona:", error);
      toast({
        title: "Error",
        description: "Failed to update persona settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleDeleteSuccess = useCallback((deletedSessionId: string) => {
    setConversations(prevConversations => 
      prevConversations.filter(conversation => conversation.id !== deletedSessionId)
    );
    toast({
      title: "Chat session deleted",
      description: "The chat session has been successfully deleted.",
    });
  }, []);

  const handleAutoSummary = async () => {
    setIsLoadingAutoSummarize(true)

    const result = await summarizeConversation(messages as ChatMessageArray, character, chat_session)
    if ("error" in result) {
      return;
    } else {
      for await (const content of readStreamableValue(result)) {
        setMemoryContent(content as string)
      }
    }

    setIsLoadingAutoSummarize(false)
  };

  const handleSaveMemory = async () => {
    setIsLoadingAutoSummarize(true)
    const result = await saveSummarization(memoryContent, character, chat_session);
    toast({
      title: result.message,
      className: `${result.error ? 'bg-red-300' : 'bg-green-300'}`
    });
    setIsLoadingAutoSummarize(false)
  };

  const handleUpdateTitle = async (conversationId: string, title: string) => {
    const result = await updateChatSessionTitle(conversationId, title);
    toast({
      title: result.message,
      className: `${result.error ? 'bg-red-300' : 'bg-green-300'}`
    });
  }

  const [characterIcon, setCharacterIcon] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('character_icon_style') || 'circle';
    }
    return 'circle';
  });

  const handleSubmitReport = async () => {
    try {
      const result = await reportCharacter(character.id, reportReason);
      if (result.success) {
        setReportReason('');
        setIsReportDialogOpen(false);
        setIsReportConfirmationOpen(true);
        toast({
          title: "Report Submitted",
          description: result.message,
        });
      } else {
        toast({
          title: "Report Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="p-2 w-[24] h-[24] rounded-full hover:bg-neutral-800 transition-colors border border-neutral-700">
            <Ellipsis className='text-gray-400' />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-80 bg-neutral-800 border-l border-neutral-700 overflow-y-auto">
          <div className="py-4">
            <div className="flex items-center mb-4 gap-4">
              <div className={`w-16 h-16 overflow-hidden ${characterIcon === 'circle' ? 'rounded-full' : 'rounded-lg'}`}>
                <div className="w-full h-full relative">
                  <Image 
                    src={character.avatar_image_url ?? "/default-avatar.jpg"} 
                    alt={character.name} 
                    layout="fill"
                    objectFit="cover"
                    className={characterIcon === 'circle' ? 'rounded-full' : 'rounded-lg'}
                  />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">{character.name}</h2>
                <p className="text-xs text-gray-400">By {made_by_username}</p>
                <p className="text-xs text-gray-400">{character.interactionCount} chats</p>
              </div>
            </div>

            <div className="flex flex-col justify-between mb-4">
              <div 
                className="flex items-center cursor-pointer hover:bg-neutral-700 p-2 rounded-lg transition-colors" 
                onClick={handleShare}
              >
                <Share className="w-5 h-5 text-gray-400" />
                <span className="ml-2 text-gray-400">Share</span>
              </div>
              <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogTrigger asChild>
                  <div 
                    className="flex items-center cursor-pointer hover:bg-neutral-700 p-2 rounded-lg transition-colors"
                  >
                    <Flag className="w-5 h-5 text-gray-400" />
                    <span className="ml-2 text-gray-400">Report</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white">
                  <DialogHeader>
                    <DialogTitle>Report Character</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for reporting this character. Your feedback helps us maintain a safe community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Enter your reason here..."
                      className="w-full h-32 bg-neutral-800 text-white"
                      maxLength={1000}
                    />
                    <p className='w-full text-right text-xs text-slate-400 mt-1'>{reportReason.length}/1000</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReportDialogOpen(false)} className="text-gray-400 border-neutral-600 hover:bg-neutral-700 hover:text-white">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitReport} 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!reportReason.trim()}
                    >
                      Submit Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Link 
                href={`/character/${character.id}/edit`}
                className="flex items-center cursor-pointer hover:bg-neutral-700 p-2 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-400" />
                <span className="ml-2 text-gray-400">Edit</span>
              </Link>
            </div>

            <Dialog open={isOpenAISettingsOpen} onOpenChange={setIsOpenAISettingsOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
                >
                  <div className='flex items-center'>
                    <Settings className="w-4 h-4 mr-2" />
                    Proxy Settings
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white">
                <DialogHeader>
                  <DialogTitle>Proxy</DialogTitle>
                  <DialogDescription className='flex flex-col gap-2'>
                    <p>Your OpenAI API compatible endpoints</p>
                    <p className='text-xs text-gray-400'>We don{"'"}t store your API keys, they are stored in your browser{"'"}s localStorage.</p>
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSavingSettings(true);
                  try {
                    // Store settings in localStorage
                    localStorage.setItem('openai_base_url', baseUrl);
                    localStorage.setItem('openai_api_key', apiKey);
                    if (modelInput) {
                      localStorage.setItem('selectedModel', modelInput);
                      window.location.reload();
                    }
                    toast({
                      title: "Settings saved",
                      description: "Your proxy settings have been saved successfully.",
                    });
                    setIsOpenAISettingsOpen(false);
                  } catch (error) {
                    console.error('Failed to save settings:', error);
                    toast({
                      title: "Error",
                      description: "Failed to save settings. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsSavingSettings(false);
                  }
                }}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="baseUrl" className="text-right">
                        Completion URL
                      </Label>
                      <Input
                        id="baseUrl"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1/chat/completions"
                        className="col-span-3 bg-neutral-800"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="apiKey" className="text-right">
                        API Key
                      </Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="col-span-3 bg-neutral-800"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="model" className="text-right">
                        Model
                      </Label>
                      <Input
                        id="model"
                        value={modelInput}
                        onChange={(e) => setModelInput(e.target.value)}
                        placeholder="gpt-4-turbo-preview"
                        className="col-span-3 bg-neutral-800"
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex gap-2">
                    <Button 
                      variant="destructive"
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('openai_base_url');
                        localStorage.removeItem('openai_api_key');
                        localStorage.removeItem('selectedModel');
                        setBaseUrl('');
                        setApiKey('');
                        setModelInput('');
                        toast({
                          title: "Settings cleared",
                          description: "Your OpenAI settings have been removed.",
                        });
                      }}
                    >
                      Clear Settings
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Link href={`/chat/${character.id}`} passHref>
              <Button 
                onClick={handleNewChat}
                disabled={isCreatingSession}
                className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
              >
                {isCreatingSession ? (
                  'Creating...'
                ) : (
                  <div className='flex items-center'>
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    New Chat
                  </div>
                )}
              </Button>
            </Link>
            <div 
              className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
            >
              <div className='flex items-center'>
                <Globe className='w-4 h-4 mr-2'/>
                <p className='text-sm font-semibold mr-2'>Make Chat Public</p>
                <Switch 
                  checked={shareStatus} 
                  onCheckedChange={handleToggleShare}
                  disabled={isTogglingShare}
                  className='text-green-300'
                />
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
                >
                  <div className='flex items-center'>
                    <Brain className="w-4 h-4 mr-2" />
                    Memory
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white">
                <DialogHeader>
                  <DialogTitle>Conversation Memory</DialogTitle>
                  <DialogDescription>
                    <p>TEMPORARY: If AUTO SUMMARISE, MAKE SURE TO REFRESH PAGE BEFORE</p>
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Textarea
                    value={memoryContent}
                    onChange={(e) => setMemoryContent(e.target.value)}
                    placeholder="Enter chat memory here... (4000 characters max)
                    "
                    className="w-full h-40 bg-neutral-800 text-white"
                    maxLength={4000}
                  />
                  <p className='w-full text-xs text-slate-200'>{memoryContent.length}/4000</p>
                  <Button 
                    onClick={handleAutoSummary}
                    className="mt-4 w-full bg-neutral-700 hover:bg-neutral-600"
                    disabled={isLoadingAutoSummarize}
                  >
                    Auto Summary
                  </Button>
                  <Button 
                    onClick={handleSaveMemory}
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoadingAutoSummarize}
                  >
                    Save Memory
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <CustomizeDialog />
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full mb-4 bg-neutral-700 hover:bg-neutral-600 text-gray-200 flex items-center justify-between py-2 px-4 rounded-full transition-colors"
                  onClick={fetchPersonas}
                >
                  <div className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Personas
                  </div>
                  {defaultPersona && (
                    <span className="text-xs text-gray-400">{defaultPersona.displayName}</span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white h-[30rem] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Personas</DialogTitle>
                  <DialogDescription>
                    Select a default persona or click your current persona to turn off personas
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {isLoadingPersonas ? (
                    <p>Loading personas...</p>
                  ) : personas.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {personas.map((persona) => (
                        <div
                          key={persona.id}
                          className="flex items-center justify-between hover:cursor-pointer hover:bg-neutral-800 p-2 hover:rounded-xl max-w-sm"
                          onClick={() => handleSetDefaultPersona(persona)}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {persona.image ? (
                              <img src={persona.image} alt={persona.displayName} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-gradient-to-br from-black via-black to-purple-300">
                                {persona.displayName[0]}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h2 className="font-semibold flex items-center text-sm">
                                <span className="truncate">{persona.displayName}</span>
                                {persona.isDefault && (
                                  <span className="ml-2 flex-shrink-0 text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded">Default</span>
                                )}
                              </h2>
                              <p className="text-xs text-neutral-400 truncate break-words text-wrap ">{persona.background.slice(0, 100)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No personas found. Create one to get started!</p>
                  )}
                  <Link href={"/profile/persona/create"}>
                    <Button className="mt-4 w-full max-w-sm">Create New Persona</Button>                
                  </Link>
                </div>
              </DialogContent>
            </Dialog>
            {shareMessage && (
              <p className="text-sm text-green-500 mb-4">{shareMessage}</p>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2 text-white">Recent Conversations</h3>
              {conversations.map((conversation) => {
                const latestMessage = conversation.messages[conversation.messages.length - 1];
                return (
                  <div key={conversation.id} className="mb-4 p-3 bg-neutral-700 rounded-lg">
                    <div className='w-full flex justify-between items-center'>
                      <p className="text-sm text-gray-400">
                        {format(new Date(conversation.last_message_timestamp), 'MMM d, yyyy')}
                      </p>
                      <ChatSessionDeleteButton 
                        chatSession={conversation} 
                        onDeleteSuccess={() => handleDeleteSuccess(conversation.id)}
                      />
                    </div>

                    <input 
                      placeholder='title'
                      className='w-full bg-transparent text-md text-white font-bold break-words overflow-wrap-anywhere whitespace-normal'
                      defaultValue={conversation.title ?? ""}
                      onChange={(e) => handleUpdateTitle(conversation.id, e.target.value)}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    />

                    <p className="text-sm font-medium text-white mt-1">
                      {latestMessage.role === 'assistant' ? character.name : 'You'}: 
                      {typeof latestMessage.content === 'string' 
                        ? latestMessage.content.slice(0, 200) 
                        : latestMessage.content?.find(part => part.type === 'text')?.text?.slice(0, 200) || '[Image content]'}
                      {typeof latestMessage.content === 'string' && latestMessage.content.length > 200 && "..."}
                      {Array.isArray(latestMessage.content) && (latestMessage.content.find(part => part.type === 'text')?.text?.length ?? 0) > 200 && "..."}
                    </p>

                    <div className='flex items-center justify-between gap-2'>

                      <Button 
                        variant="link" 
                        className="mt-2 p-0 h-auto text-blue-400"
                        onClick={() => handleContinueChat(conversation.id)}
                      >
                        Continue Chat
                      </Button>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Confirmation Dialog (now a sibling to Sheet, wrapped in Fragment) */}
      <Dialog open={isReportConfirmationOpen} onOpenChange={setIsReportConfirmationOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-900 text-white">
          <DialogHeader>
            <DialogTitle>Report Submitted</DialogTitle>
            <DialogDescription>
              Thank you for your feedback. We have received your report and will review it shortly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end mt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsReportConfirmationOpen(false)} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}