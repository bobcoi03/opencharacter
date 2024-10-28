"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ReactMarkdown from "react-markdown";
import { Clock, MessageCircle, Settings, Sliders, Globe2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Character = {
  name: string;
  tagline: string;
  description: string;
  avatar_image_url: string | undefined;
  banner_image_url: string | undefined;
  temperature: number | undefined;
  top_p: number | undefined;
  top_k: number | undefined;
  frequency_penalty: number | undefined;
  presence_penalty: number | undefined;
  repetition_penalty: number | undefined;
  min_p: number | undefined;
  top_a: number | undefined;
  max_tokens: number | undefined;
  visibility: string;
};

type Message = {
  character: string;
  content: string;
  timestamp: number;
  sessionId?: string;
  characterDetails?: Character;
  fullConversation?: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
};

export default function RecentMessages({ messages }: { messages: Message[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Message | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(messages.length / ITEMS_PER_PAGE);
  
  const paginatedMessages = messages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleMessageClick = (message: Message) => {
    setSelectedConversation(message);
    setIsOpen(true);
  };

  const renderSettingsValue = (value: number | undefined) => {
    return value !== undefined ? value.toFixed(2) : 'Default';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const items = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // Always show first page
        i === totalPages || // Always show last page
        (i >= currentPage - 1 && i <= currentPage + 1) // Show current page and adjacent pages
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className={`${currentPage === i ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
              onClick={() => handlePageChange(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (i === 2 && showEllipsisStart) {
        items.push(
          <PaginationEllipsis key="ellipsis-start" className="text-gray-500" />
        );
      } else if (i === totalPages - 1 && showEllipsisEnd) {
        items.push(
          <PaginationEllipsis key="ellipsis-end" className="text-gray-500" />
        );
      }
    }
    return items;
  };

  return (
    <div className="bg-black rounded-xl shadow-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-gray-400" />
          <h2 className="text-base font-semibold text-white">Recent Conversations</h2>
        </div>
        <div className="text-xs text-gray-500">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, messages.length)} of {messages.length} conversations
        </div>
      </div>

      <div className="space-y-3 custom-scrollbar mb-6">
        {paginatedMessages.map((message, index) => (
          <div 
            key={index} 
            className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/70 
                     cursor-pointer transition-all duration-200 border border-gray-800/50
                     hover:border-gray-700/50 group"
            onClick={() => handleMessageClick(message)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {message.characterDetails?.avatar_image_url ? (
                    <img 
                      src={message.characterDetails.avatar_image_url} 
                      alt={message.character}
                      className="w-8 h-8 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center
                                border border-gray-700 group-hover:border-gray-600 transition-colors">
                      <span className="text-xs font-medium text-gray-300">
                        {message.character.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-700">
                          {message.characterDetails?.visibility === 'public' ? (
                            <Globe2 className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Lock className="w-3 h-3 text-amber-400" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{message.characterDetails?.visibility === 'public' ? 'Public Character' : 'Private Character'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm font-medium text-gray-200">{message.character}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <span className="text-xs">{new Date(message.timestamp).toLocaleString()}</span>
              </div>
            </div>
            <ReactMarkdown className="text-sm text-gray-400 line-clamp-2 pl-10">
              {message.content ? message.content.slice(0, 100) : ""}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'text-gray-400 hover:text-white'}`}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              />
            </PaginationItem>
            
            {renderPaginationItems()}
            
            <PaginationItem>
              <PaginationNext
                className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'text-gray-400 hover:text-white'}`}
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto border-l border-gray-800 bg-black/95 backdrop-blur-xl">
          <SheetHeader className="relative border-b border-gray-800 pb-4">
            {selectedConversation?.characterDetails?.banner_image_url && (
              <div className="absolute top-0 left-0 right-0 h-24 -mt-4 -mx-6">
                <img 
                  src={selectedConversation.characterDetails.banner_image_url}
                  alt="Banner"
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
              </div>
            )}
            <SheetTitle className="flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="relative overflow-hidden">
                  {selectedConversation?.characterDetails?.avatar_image_url ? (
                    <img 
                      src={selectedConversation.characterDetails.avatar_image_url}
                      alt={selectedConversation.character}
                      className="w-10 h-10 rounded-full border border-gray-700 overflow-hidden"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <span className="text-sm font-medium text-gray-300">
                        {selectedConversation?.character.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1 border border-gray-700">
                    {selectedConversation?.characterDetails?.visibility === 'public' ? (
                      <Globe2 className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-200">{selectedConversation?.character}</div>
                  <div className="text-xs text-gray-500">
                    {selectedConversation?.characterDetails?.tagline}
                  </div>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle AI Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </SheetTitle>

            {showSettings && selectedConversation?.characterDetails && (
              <div className="mt-4 grid grid-cols-2 gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="col-span-2 flex items-center gap-2 pb-2 border-b border-gray-800">
                  <Sliders className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">AI Settings</span>
                </div>
                {[
                  { label: 'Temperature', value: selectedConversation.characterDetails.temperature },
                  { label: 'Top P', value: selectedConversation.characterDetails.top_p },
                  { label: 'Top K', value: selectedConversation.characterDetails.top_k },
                  { label: 'Frequency Penalty', value: selectedConversation.characterDetails.frequency_penalty },
                  { label: 'Presence Penalty', value: selectedConversation.characterDetails.presence_penalty },
                  { label: 'Max Tokens', value: selectedConversation.characterDetails.max_tokens }
                ].map((setting, index) => (
                  <div key={index} className="text-xs">
                    <span className="text-gray-500">{setting.label}:</span>
                    <span className="ml-1 text-gray-300">{renderSettingsValue(setting.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </SheetHeader>
          
          <div className="mt-6 space-y-4 pb-24">
            {selectedConversation?.fullConversation?.map((msg, index) => (
              <div key={index} 
                className={`rounded-lg p-4 ${
                  msg.role === 'assistant' || msg.role === 'system'
                    ? 'bg-gray-900/50 border border-gray-800/50 ml-4'
                    : 'bg-gray-800/30 border border-gray-700/50 mr-4'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 overflow-hidden">
                  {selectedConversation?.characterDetails?.avatar_image_url && 
                   (msg.role === 'assistant' || msg.role === 'system') ? (
                    <img 
                      src={selectedConversation.characterDetails.avatar_image_url}
                      alt={selectedConversation.character}
                      className="w-6 h-6 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center
                      ${msg.role === 'assistant' || msg.role === 'system'
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-gray-700 border border-gray-600'
                      }`}
                    >
                      <span className="text-xs font-medium text-gray-300">
                        {(msg.role === 'assistant' || msg.role === 'system'
                          ? selectedConversation.character
                          : 'User').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-400">
                    {msg.role === 'assistant' || msg.role === 'system' 
                      ? selectedConversation.character 
                      : 'User'}
                  </div>
                  <div className="text-xs text-gray-500 ml-auto">
                    {new Date(msg.timestamp).toLocaleString()}
                  </div>
                </div>
                <ReactMarkdown className="text-sm text-gray-300 whitespace-pre-wrap pl-8">
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4B5563 #1F2937;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }
      `}</style>
    </div>
  );
}