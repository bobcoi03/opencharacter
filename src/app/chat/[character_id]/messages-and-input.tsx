"use client";

import { type CoreMessage } from "ai";
import React, { useState, useEffect, useRef, useMemo, FormEvent, useCallback } from "react";
import { readStreamableValue } from "ai/rsc";
import { continueConversation } from "@/app/actions/chat";
import { saveChat, createChatSession } from "@/app/actions/index";
import { createChatRecommendations, getPresignedUrlForImageKey } from "@/app/actions/chat";
import { User } from "next-auth";
import Image from "next/image";
import {
  RotateCcw,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { characters, ChatMessage, ChatMessageArray, personas } from "@/server/db/schema";
import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";
import SignInButton from "@/components/signin-button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";  
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AdsProvider, InlineAd } from '@kontextso/sdk';
import { ModelSelector } from "@/components/model-selector";

const MAX_TEXTAREA_HEIGHT = 450; // maximum height in pixels

interface R2ImageProps {
  imageKeyOrUrl: string;
  messageIndex: number;
  partIndex: number;
}

const R2Image: React.FC<R2ImageProps> = ({ imageKeyOrUrl, messageIndex, partIndex }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false); // Prevent refetching on re-renders


  useEffect(() => {

    // Check if it's a key (not data URI or http/https) and hasn't been fetched yet
    const isKey = !imageKeyOrUrl.startsWith('data:') && !imageKeyOrUrl.startsWith('http');

    if (isKey && !hasFetched.current) {
      hasFetched.current = true; // Mark as fetched
      setIsLoading(true);
      setError(null);
      setImageUrl(null); // Reset previous URL if key changes

      getPresignedUrlForImageKey(imageKeyOrUrl)
        .then(result => {

          if (result.url) {
            setImageUrl(result.url);
          } else {
            setError(result.error || "Failed to load image URL.");
          }
        })
        .catch(err => {
          console.error(`[R2Image M:${messageIndex} P:${partIndex}] Error fetching presigned URL:`, err);
          setError("Failed to load image.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isKey) {
      // If it's already a valid URL (data or http), use it directly
      setImageUrl(imageKeyOrUrl);
      setIsLoading(false);
      setError(null);
      hasFetched.current = true; // Mark as "fetched" since we have the URL
    } else if (isKey && hasFetched.current) {
    }
  }, [imageKeyOrUrl, messageIndex, partIndex]); // Re-run effect if the key/URL changes


  if (isLoading) {
    return (
      <div className="max-w-xs max-h-64 h-auto rounded-lg my-2 bg-gray-700 animate-pulse flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xs max-h-64 h-auto rounded-lg my-2 bg-red-900 border border-red-700 flex items-center justify-center p-2 text-center">
        <span className="text-red-300 text-xs">Error: {error}</span>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Chat content"
        className="max-w-xs max-h-64 h-auto rounded-lg my-2 object-contain"
      />
    );
  }

  return null; // Should not happen if logic is correct
};

interface MessageContentProps {
  characterId?: string
  showRetries: boolean;
  userImage?: string | undefined | null;
  message: CustomChatMessage;
  index: number;
  isUser: boolean;
  userName?: string;
  characterName: string;
  characterAvatarUrl?: string | undefined | null;
  isError?: boolean;
  chatSession?: string | null;
  onRetry?: () => void;
  onEdit: (index: number, editedContent: string) => void;
  onDelete: (index: number) => void;
  onGoBackRegenerate?: (toIndex: number) => void;
  regenerations: string[];
  currentRegenerationIndex: number;
  onNewChatFromHere: (index: number) => void;
  onRateMessage: (index: number, rating: number) => void;
  isSubscribed: boolean;
}

const MessageContent: React.FC<MessageContentProps> = React.memo(({
  characterId,
  showRetries,
  userImage,
  message,
  index,
  isUser,
  userName,
  characterName,
  characterAvatarUrl,
  isError,
  onRetry,
  onEdit,
  onDelete,
  onGoBackRegenerate,
  regenerations,
  currentRegenerationIndex,
  onNewChatFromHere,
  onRateMessage,
  isSubscribed,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content as string);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRating = (rating: number) => {
    onRateMessage(index, rating);
  };

  const markdownComponents: Partial<Components> = {
    p: ({ children }) => <p className="mb-2 last:mb-0 text-wrap break-words">{children}</p>,
    em: ({ children }) => <em className="text-neutral-300 text-wrap break-words">{children}</em>,
    code: ({ children }) => (
      <code className="px-1 py-0.5 rounded text-sm text-neutral-200">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="p-2 rounded text-sm text-neutral-200 whitespace-pre-wrap break-words overflow-x-auto">
        {children}
      </pre>
    ),
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content as string);
    setIsDropdownOpen(false);
  };

  const handleSave = () => {
    onEdit(index, editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(message.content as string);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setIsDropdownOpen(false);
  };

  const confirmDelete = () => {
    onDelete(index);
    setIsDeleting(false);
  };

  const cancelDelete = () => {
    setIsDeleting(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
  };

  const renderContent = () => {

    if (Array.isArray(message.content)) {
      // Handle multimodal content
      return (message.content as MultimodalContent).map((part, partIndex) => {
        if (part.type === 'text' && part.text) {
          return (
            <ReactMarkdown
              key={`part-${partIndex}-text`}
              className="text-md text-white text-wrap break-words"
              components={markdownComponents}
            >
              {part.text}
            </ReactMarkdown>
          );
        } else if (part.type === 'image_url' && part.image_url?.url) {
          return (
            <R2Image
              key={`part-${partIndex}-image`}
              imageKeyOrUrl={part.image_url.url}
              messageIndex={index}
              partIndex={partIndex}
            />
          );
        }
        return null;
      });
    } else if (typeof message.content === 'string') {
      // Handle string content
      return (
        <ReactMarkdown
          className="text-md text-white text-wrap break-words"
          components={markdownComponents}
        >
          {message.content}
        </ReactMarkdown>
      );
    }
    console.warn(`[MessageContent Render M:${index}] Content is neither string nor array. Type: ${typeof message.content}`);
    return null;
  };

  if (isDeleting) {
    return (
      <dialog className="fixed bottom-0 top-0 flex flex-col items-center justify-center p-4 bg-black rounded-lg shadow-lg">
        <p className="mb-4 text-white">Are you sure you want to delete this message?</p>
        <div className="flex gap-4 w-full flex justify-between">
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} variant="destructive">Delete</Button>
        </div>
      </dialog>
    );
  }

  return (
    <div 
      className={`flex items-start mb-8 ${localStorage.getItem("chat-style") === "bubble" && isUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (!isDropdownOpen) {
          setIsDropdownOpen(false);
        }
      }}
    >
      <Link className={`mr-2 flex-shrink-0 overflow-hidden`} style={{ width: `${localStorage.getItem("character_icon_size") ?? '40'}px`, height: `${localStorage.getItem("character_icon_size") ?? '40'}px` }}
        href={isUser ? "/profile" : `/character/${characterId}/profile`}
      >
        <img 
          src={isUser ? (userImage ?? "/opencharacter_icon.png") : (characterAvatarUrl || "/default-avatar.jpg")}
          alt={isUser ? (userName ?? "Guest") : characterName}
          className={`w-full h-full object-cover ${localStorage.getItem("character_icon_style") === "circle" ? "rounded-full" : "rounded-lg"}`}
        />
      </Link>
      <div className={`flex flex-col max-w-full w-full flex-grow ${localStorage.getItem("chat-style") === "bubble" && isUser ? "justify-end" : ""}`}>
        <div className={`flex justify-between items-center mb-2 flex-grow ${localStorage.getItem("chat-style") === "bubble" && isUser ? "flex-row-reverse " : ""}`}>
          <span className={`text-xs text-neutral-400 ${localStorage.getItem("chat-style") === "bubble" && isUser ? "mr-2" : ""}`}>
            {isUser ? userName || "You" : characterName}
          </span>
          {!isEditing && (isHovered || isDropdownOpen) && (
            <DropdownMenu open={isDropdownOpen} onOpenChange={handleDropdownOpenChange}>
              <DropdownMenuTrigger asChild>
                <button className="text-neutral-400 hover:text-neutral-300 focus:outline-none">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="flex flex-col gap-2">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onNewChatFromHere(index); setIsDropdownOpen(false); }}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  New chat from here
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className={`text-wrap break-words w-full flex ${localStorage.getItem("chat-style") === "bubble" && isUser ? "flex justify-end" : ""}`}>
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={handleTextareaChange}
                className="min-h-[100px] text-sm text-slate-300 overflow-y-auto"
                rows={1}
              />
              <div className="flex justify-start gap-2">
                <Button variant="outline" onClick={handleCancel} className="rounded-full">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="rounded-full">
                  Save
                </Button>
              </div>
            </div>
          ) : (
              <div className={`inline-block ${localStorage.getItem("chat-style") === "bubble" && isUser ? "w-full" : ""}`}>
                <div 
                  style={{
                    backgroundColor: localStorage.getItem("chat-style") === "bubble" 
                      ? (isUser 
                        ? localStorage.getItem("user_chat_color") || "#262626"
                        : localStorage.getItem("ai_chat_color") || "#404040")
                      : "transparent"
                  }}
                  className={`${
                    localStorage.getItem("chat-style") === "bubble" 
                      ? (isUser ? "float-right mr-2" : "") 
                      : ""
                  } px-4 py-2 rounded-xl`}
                >
                  {renderContent()}
                </div>
              </div>
          )}
        </div>
        {!isUser && showRetries && index != 1 && (
        <div className="w-full flex justify-between max-w-full flex-row">
          <div className="items-center flex gap-2">
            <div className="flex space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 transition-transform transform hover:scale-125 cursor-pointer ${
                      (message.rating || 0) >= i + 1 ? 'text-yellow-500' : 'text-gray-600'
                    }`} 
                    onClick={() => handleRating(i + 1)}
                    fill={(message.rating || 0) >= i + 1 ? '#FFFF00' : ''}
                  />
              ))}
            </div>
            
          </div>
          <div className="flex items-center space-x-2 mt-4 ml-2">
            <button 
              className="p-1 rounded-full"
              onClick={() => {
                  onGoBackRegenerate && onGoBackRegenerate(currentRegenerationIndex - 1);
              }}
              disabled={currentRegenerationIndex <= 0}
            >
              <ChevronLeft className={`w-4 h-4 ${currentRegenerationIndex <= 0 ? "text-slate-700" : ""}`} />
            </button>
            <span className="text-sm text-gray-400">
              {currentRegenerationIndex + 1} / {regenerations.length}
              {!isSubscribed && regenerations.length >= 5 && " (Max)"}
            </span>
            <button 
              className="p-1 rounded-full"
              onClick={() => {
                if (currentRegenerationIndex < regenerations.length - 1) {
                  onGoBackRegenerate && onGoBackRegenerate(currentRegenerationIndex + 1);
                } else {
                  // For non-Pro users, limit to 5 regenerations
                  if ((isSubscribed && regenerations.length < 30) || 
                      (!isSubscribed && regenerations.length < 5)) {
                    onRetry && onRetry();
                  }
                }
              }}
              disabled={
                (currentRegenerationIndex >= regenerations.length - 1 && 
                 ((isSubscribed && regenerations.length >= 30) || 
                  (!isSubscribed && regenerations.length >= 5))) || 
                regenerations.length === 0
              }
            >
              <ChevronRight className={`w-4 h-4 ${
                (currentRegenerationIndex >= regenerations.length - 1 && 
                 ((isSubscribed && regenerations.length >= 30) || 
                  (!isSubscribed && regenerations.length >= 5))) || 
                regenerations.length === 0 ? "text-slate-700" : ""
              }`} />
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
});

MessageContent.displayName = 'MessageContent';

interface SubscriptionCheckResponse {
  hasActiveSubscription: boolean;
  subscription: any | null;
}

// Define the structure for multimodal content parts
interface TextPart {
  type: 'text';
  text: string;
}

interface ImagePart {
  type: 'image_url';
  image_url: {
    url: string; // Expecting base64 data URL
  };
}

// Define MultimodalContent DIRECTLY as the array type
type MultimodalContent = (TextPart | ImagePart)[];

// Define the main message type - Adjust roles to match schema
interface CustomChatMessage {
  role: 'user' | 'assistant' | 'system'; // Match roles defined in schema.ts ChatMessage
  content: string | MultimodalContent;
  id?: string; // Keep optional for state management flexibility
  rating?: number;
  // Remove other roles/fields not present in schema.ts ChatMessage if they cause issues
}

// --- Helper function to map CustomChatMessage to DB schema expected type ---
// Assumes DB stores multimodal content as JSON string
const mapToDbMessage = (msg: CustomChatMessage): ChatMessage => {
  // Ensure the role conforms to the allowed types in ChatMessage
  if (msg.role !== 'user' && msg.role !== 'assistant' && msg.role !== 'system') {
     // Handle unexpected roles, e.g., default to 'user' or throw an error
     console.warn(`Invalid role found: ${msg.role}. Defaulting to 'user'.`);
     // Or throw new Error(`Invalid role: ${msg.role}`);
  }

  return {
    role: msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system' ? msg.role : 'user', // Ensure valid role
    id: msg.id ?? crypto.randomUUID(), // Ensure ID exists and is string
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    // Add other required fields from ChatMessage schema if necessary, with defaults
    rating: msg.rating ?? undefined, // Pass rating if exists
    // time: msg.time ?? Date.now(), // Add if time is required in ChatMessage
    // model: msg.model ?? undefined, // Add if model is required in ChatMessage
 };
};

const mapToDbMessageArray = (messages: CustomChatMessage[]): ChatMessageArray => {
  return messages.map(mapToDbMessage);
};
// ---

export default function MessageAndInput({
  user,
  character,
  made_by_name,
  messages,
  chat_session,
  persona,
  share = false,
}: {
  user: User | undefined;
  character: typeof characters.$inferSelect;
  made_by_name: string;
  messages: CoreMessage[];
  chat_session?: string | undefined;
  persona?: typeof personas.$inferSelect | undefined;
  share?: boolean;
}) {
  const router = useRouter();
  const replacePlaceholders = (content: string | (TextPart | ImagePart)[] | undefined): string | (TextPart | ImagePart)[] | undefined => {
    const userPlaceholder = persona?.displayName || user?.name || "Guest";
    const charPlaceholder = character.name || "";

    if (content === undefined) {
      return undefined;
    }

    if (typeof content === 'string') {
      // Handle string content
      return content
        .replace(/{{user}}/g, userPlaceholder)
        .replace(/{{char}}/g, charPlaceholder);
    }

    // --- Corrected Array Handling ---
    if (Array.isArray(content)) {
      // Explicitly cast to the array type we expect for mapping
      const contentArray = content as (TextPart | ImagePart)[];

      // Now 'content' correctly matches the MultimodalContent type (the array)
      const processedArray = contentArray.map((part) => { // 'part' is correctly inferred as TextPart | ImagePart
        if (part.type === 'text' && part.text) {
          return {
            ...part,
            text: part.text
              .replace(/{{user}}/g, userPlaceholder)
              .replace(/{{char}}/g, charPlaceholder)
          };
        }
        return part; // Return non-text parts unchanged
      });
      return processedArray; // Return the modified array
    }
    // --- End Corrected Array Handling ---

    // Fallback
    console.warn("replacePlaceholders received unexpected content type:", typeof content, content);
    return content;
  };

  // Map initial messages from props, PARSING stringified JSON content first
  const parsedAndMappedInitialMessages = useMemo(() => {
    return messages.map((msg, index) => {

      let processedContent: string | MultimodalContent | undefined = undefined;
      let parseError: Error | null = null;
      let validationPassed: boolean | null = null;
      let attemptedParse = false;

      if (typeof msg.content === 'string' && msg.content.trim().startsWith('[')) {
        // Only attempt parse if it's a string that starts with '['
        attemptedParse = true;
        try {
          const parsed = JSON.parse(msg.content);

          if (Array.isArray(parsed)) {
            validationPassed = parsed.every(p =>
              p != null && typeof p === 'object' && typeof p.type === 'string' &&
              ((p.type === 'text' && typeof p.text === 'string') ||
               (p.type === 'image_url' && p.image_url && typeof p.image_url.url === 'string'))
            );

            if (validationPassed) {
              processedContent = parsed as MultimodalContent;
            } else {
              processedContent = msg.content; // Fallback
            }
          } else {
            processedContent = msg.content; // Fallback
            validationPassed = false;
          }
        } catch (e) {
          parseError = e as Error;
          processedContent = msg.content; // Fallback
        }
      } else if (typeof msg.content === 'string'){
        // It's a string, but doesn't start with '[', treat as plain text
        processedContent = msg.content;
      } else {
        // Content is not a string initially
        if (msg.content === null || msg.content === undefined) {
          processedContent = "";
        } else {
          // Assume it's already in the correct format (e.g., MultimodalContent array)
          // Add validation here if necessary based on expected non-string types
          processedContent = msg.content as string | MultimodalContent;
        }
      }

      const finalContent = replacePlaceholders(processedContent);

      const finalMappedMessage = {
        role: msg.role as 'user' | 'assistant' | 'system',
        id: (msg as any).id ?? crypto.randomUUID(),
        rating: (msg as any).rating,
        content: finalContent,
      } as CustomChatMessage;

      return finalMappedMessage;
    });
  }, [messages, character.name, persona?.displayName, user?.name]);

  // Use the correctly parsed and mapped messages for initial state
  const [messagesState, setMessagesState] = useState<CustomChatMessage[]>(parsedAndMappedInitialMessages);

  // Update initial state for regenerations based on the *parsed* initial messages
   const [regenerations, setRegenerations] = useState<string[]>(() => {
       // Use the result of the robust parsing logic
       const lastMessage = parsedAndMappedInitialMessages[parsedAndMappedInitialMessages.length - 1];
       let lastContentText = "";
       if (lastMessage) {
           if (typeof lastMessage.content === 'string') {
               // If content is already a string, use it directly
               lastContentText = lastMessage.content;
           } else if (Array.isArray(lastMessage.content)) {
               // If content is an array (MultimodalContent), extract text parts
               // Type assertion is safe here because we know it's an array
               lastContentText = (lastMessage.content as (TextPart | ImagePart)[])
                   .filter((part): part is TextPart => part.type === 'text') // Type guard
                   .map(part => part.text || "") // Map to text, default empty if text is missing
                   .join("\n"); // Join multiple text parts with newline
           }
           // Handle other potential content types if necessary
       }
       // Ensure regenerations always starts with at least one string element
       return [lastContentText || ""]; // Initialize with extracted text or empty string
   });

  const [selectedModel, setSelectedModel] = useState("mistralai/mistral-nemo");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<boolean>(false);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentRegenerationIndex, setCurrentRegenerationIndex] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const { toast } = useToast()
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [messageRecommendations, setMessageRecommendations] = useState<{ title: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adData, setAdData] = useState<{ ad: any; context: any } | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      if (user?.id) {
        console.log("[Frontend] Checking subscription for user:", user.id);
        try {
          const response = await fetch("/api/subscriptions/check");
          console.log("[Frontend] API response status:", response.status);
          const data = (await response.json()) as SubscriptionCheckResponse;
          console.log("[Frontend] API response data:", JSON.stringify(data, null, 2));
          console.log("[Frontend] Setting isSubscribed to:", data.hasActiveSubscription);
          setIsSubscribed(data.hasActiveSubscription);
          if (data.hasActiveSubscription) {
            console.log("[Frontend] User has active subscription, setting pro model");
            const savedModel = localStorage.getItem("selectedModel");
            if (!savedModel) {
              setSelectedModel("meta-llama/llama-3.1-70b-instruct");
              localStorage.setItem("selectedModel", "meta-llama/llama-3.1-70b-instruct");
            } else {
              setSelectedModel(savedModel);
            }
          } else {
            console.log("[Frontend] User does not have active subscription");
          }
        } catch (error) {
          console.error("[Frontend] Error checking subscription:", error);
          setIsSubscribed(false);
        }
      } else {
        console.log("[Frontend] No user ID available");
      }
    }
    checkSubscription();
  }, [user?.id]);

  // Fetch ads when messages change
  /** useEffect(() => {
    console.log("fetchAds effect triggered with message length:", messagesState.length);
    
    async function fetchAds() {
      if (!user || messagesState.length < 3 || !chat_session) {
        console.log("Skipping fetchAds due to conditions not met:", { 
          hasUser: !!user, 
          messageCount: messagesState.length, 
          hasChatSession: !!chat_session 
        });
        return;
      }
      
      try {
        console.log("Executing fetchAds with chat_session:", chat_session);
        const dbMessages = mapToDbMessageArray(messagesState);
        const adsResult = await getAds(
          character, 
          { id: chat_session } as typeof chat_sessions.$inferSelect, 
          dbMessages
        );
        
        if (adsResult) {
          console.log("Received ad data:", adsResult);
          setAdData(adsResult);
        } else {
          console.log("No ad data returned from getAds");
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      }
    }

    // Fetch ads immediately after 3 messages and then periodically every 5 messages
    if (messagesState.length >= 3) {
      console.log("Calling fetchAds");
      fetchAds();
    }
  }, [messagesState.length, character, chat_session, user]);
   * 
   * 
   */
 
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const finalHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT);
      textareaRef.current.style.height = `${finalHeight}px`;

            // Simple detection: check for line breaks or height increase
      const textContent = textareaRef.current.value;
      const hasLineBreaks = textContent.includes('\n');
      const isMultiLine = hasLineBreaks || finalHeight > 80; // Simple height threshold
      
      console.log('=== TEXTAREA DEBUG ===');
      console.log('Height:', finalHeight, 'HasLineBreaks:', hasLineBreaks, 'IsMultiLine:', isMultiLine);
      console.log('Text content length:', textContent.length);
      console.log('Textarea element:', textareaRef.current);
      console.log('Textarea current border-radius before:', getComputedStyle(textareaRef.current).borderRadius);
      
      // Try multiple ways to find the backdrop div
      let backdropDiv = textareaRef.current.parentElement?.querySelector('.textarea-backdrop') as HTMLElement;
      if (!backdropDiv) {
        // Try going up one more level
        backdropDiv = textareaRef.current.parentElement?.parentElement?.querySelector('.textarea-backdrop') as HTMLElement;
      }
      if (!backdropDiv) {
        // Try finding by searching the form container
        const formContainer = textareaRef.current.closest('form');
        if (formContainer) {
          backdropDiv = formContainer.querySelector('.textarea-backdrop') as HTMLElement;
        }
      }
      
      console.log('Backdrop div found:', !!backdropDiv);
      console.log('Textarea parent element:', textareaRef.current.parentElement);
      console.log('All elements with textarea-backdrop class:', document.querySelectorAll('.textarea-backdrop'));
      
      if (backdropDiv) {
        console.log('Backdrop current border-radius before:', getComputedStyle(backdropDiv).borderRadius);
      }
      
      if (isMultiLine) {
        // Multi-line: rounded-xl style with !important
        console.log('Setting MULTILINE styles (12px border-radius)');
        textareaRef.current.style.setProperty('border-radius', '12px', 'important');
        if (backdropDiv) {
          backdropDiv.style.setProperty('border-radius', '12px', 'important');
        }
      } else {
        // Single line: fully rounded
        console.log('Setting SINGLE LINE styles (9999px border-radius)');
        textareaRef.current.style.setProperty('border-radius', '9999px', 'important');
        if (backdropDiv) {
          backdropDiv.style.setProperty('border-radius', '9999px', 'important');
        }
      }
      
             // Check what was actually applied
       setTimeout(() => {
         if (textareaRef.current) {
           console.log('Textarea border-radius AFTER:', getComputedStyle(textareaRef.current).borderRadius);
           console.log('All textarea styles:', textareaRef.current.style.cssText);
         }
         if (backdropDiv) {
           console.log('Backdrop border-radius AFTER:', getComputedStyle(backdropDiv).borderRadius);
           console.log('All backdrop styles:', backdropDiv.style.cssText);
         }
       }, 100);
      
      console.log('=== END DEBUG ===');

      // Add scrollbar if content exceeds max height
      textareaRef.current.style.overflowY =
        scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
      // Reset to fully rounded (single line appearance)
      textareaRef.current.style.borderRadius = "9999px";
      
      // Reset backdrop border radius too
      const backdropDiv = textareaRef.current.parentElement?.querySelector('.textarea-backdrop') as HTMLElement;
      if (backdropDiv) {
        backdropDiv.style.borderRadius = "9999px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // --- Actions that PREVENT default behavior or have specific logic ---
    if (window.innerWidth > 768) {
      // Desktop: Submit on Enter (without Shift)
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        formRef.current?.requestSubmit();
        return; // Stop further processing for this specific case
      }
      // Desktop: Reset on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        resetTextareaHeight();
        if (textareaRef.current?.value.trim() === "") {
          if (textareaRef.current) textareaRef.current.value = "";
        }
        return; // Stop further processing
      }
    }

    // --- Default behavior + Height Adjustment ---
    // For any key press (including Enter+Shift, Backspace, typing, mobile Enter)
    // that isn't a modifier key, schedule a height adjustment.
    const isModifierKey = ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key);

    if (!isModifierKey) {
       // Let the default action happen (insert char, delete char, insert newline)
       // Then, adjust height shortly after to account for the DOM update
       setTimeout(adjustTextareaHeight, 0);
    }
  };

  const handleEdit = useCallback(async (index: number, editedContent: string) => {
    const newMessages = messagesState.map((msg, i) =>
      i === index ? ({ ...msg, content: editedContent } as CustomChatMessage) : msg,
    );
    setMessagesState(newMessages);

    try {
      // Map before saving
      await saveChat(mapToDbMessageArray(newMessages), character, chat_session);
    } catch (error) {
      console.error("Failed to save edited message:", error);
      toast({
        title: "Error",
        description: "Failed to save edited message. Please try again.",
        variant: "destructive",
        className: "text-xs"
      });
    }
  }, [messagesState, character, chat_session, toast]);

  const handleOnGoBackRegenerate = useCallback(async (index: number) => {
    if (index < 0 || index >= regenerations.length) return; // Boundary check

    const wantMessage = regenerations[index];
    const newMessages = [...messagesState];
    let updated = false;

    // Find the last assistant message and replace its content
    for (let i = newMessages.length - 1; i >= 0; i--) {
      if (newMessages[i].role === "assistant") {
        newMessages[i] = { ...newMessages[i], content: wantMessage };
        updated = true;
        break;
      }
    }

    if (updated) {
      setMessagesState(newMessages);
      setCurrentRegenerationIndex(index);
      try {
        // Map before saving
        await saveChat(mapToDbMessageArray(newMessages), character, chat_session);
      } catch (error) {
        console.error("Failed to save regenerated message:", error);
        // Optionally revert state or show toast
      }
    }
  }, [regenerations, messagesState, character, chat_session]);

  const handleDelete = useCallback(async (index: number) => {
    const newMessages = messagesState.filter((_, i) => i !== index);
    const originalMessages = [...messagesState]; // For potential revert

    setMessagesState(newMessages);

    try {
       // Map before saving
      await saveChat(mapToDbMessageArray(newMessages), character, chat_session);
      toast({
        title: "Deleted Message",
        className: "text-xs"
      })
    } catch (error) {
      console.error("Failed to save after deleting message:", error);
      setMessagesState(originalMessages); // Revert on error
      toast({ /* error toast */ });
    }
  }, [messagesState, character, chat_session, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom()
  }, [])

  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesState]);

  // Clean up recommendations loading state if the component unmounts
  useEffect(() => {
    return () => {
      setIsLoadingRecommendations(false);
    };
  }, []);

  // Check if recommendations are enabled in user settings
  const areRecommendationsEnabled = () => {
    if (typeof window !== 'undefined') {
      const savedValue = localStorage.getItem('message_recommendations_enabled');
      // If no value has been set yet, default to true (enabled)
      return savedValue === null ? true : savedValue === 'true';
    }
    return true;
  };

  const handleInputFocus = () => {
    if (!user) {
      setIsSignInDialogOpen(true);
    }
  };

  const handleSubmit = async (
    input: string,
    error: boolean = false,
    regenerate: boolean = false,
    userMessageContentOverride?: string | MultimodalContent
  ) => {
    // Ensure user is signed in
    if (!user) {
      setIsSignInDialogOpen(true);
      return;
    }

    // Determine the input content: Use override if provided during regeneration, otherwise use ref.
    const currentInput = (regenerate && userMessageContentOverride !== undefined)
      ? "" // If regenerating with override, the 'input' param isn't the source user message
      : textareaRef.current?.value ?? "";
    const effectiveUserContent = (regenerate && userMessageContentOverride !== undefined)
      ? userMessageContentOverride
      : currentInput; // For new messages, effective content is from the textarea

    // Do nothing if loading or if there's no effective content and no image selected
    // Check based on effectiveUserContent for text, OR selectedImage
    const hasTextContent = typeof effectiveUserContent === 'string' ? effectiveUserContent.trim() : true; // Assume array content is valid
    if (isLoading || (!hasTextContent && !selectedImage)) {
      return;
    }

    // Clear message recommendations
    setMessageRecommendations([]);

    // --- Construct message content for the NEW user message OR the one being regenerated ---
    let currentUserMessageContent: string | MultimodalContent;

    if (regenerate && userMessageContentOverride !== undefined) {
        // If regenerating, use the provided override content directly.
        // Assume image was part of the original message if override is an array.
        currentUserMessageContent = userMessageContentOverride;
    } else if (selectedImage) {
        // If it's a new message with an image
        currentUserMessageContent = [
            { type: "text", text: currentInput }, // Use currentInput from ref for text part
            {
                type: "image_url",
                image_url: {
                    url: selectedImage,
                },
            },
        ];
    } else {
        // If it's a new message with only text
        currentUserMessageContent = currentInput; // Use currentInput from ref
    }
    // --- End message content construction ---

    // Determine the next state based on action type
    let nextState: CustomChatMessage[];
    let messagesForApi: ChatMessage[];
    const isRegeneratingAction = (regenerate && !error) || (error && messagesState.length > 0 && messagesState[messagesState.length - 1].role === 'assistant');

    if (isRegeneratingAction) {
      // For regeneration or retrying an assistant error, remove the last assistant message
      nextState = messagesState.slice(0, -1);
    } else {
      // For new message or retrying a user message error, add the new user message
      // Note: currentUserMessageContent was constructed earlier based on input/image/override
      const newUserMessage: CustomChatMessage = { content: currentUserMessageContent, role: "user", id: crypto.randomUUID() };
      // If retrying a user error, the user message might already be in messagesState. Avoid duplication.
      if (error && messagesState.length > 0 && messagesState[messagesState.length - 1].role === 'user') {
        nextState = [...messagesState]; // Use existing state if last was user and error occurred
      } else {
        nextState = [...messagesState, newUserMessage];
      }
    }

    // Set the state immediately before the API call
    setMessagesState(nextState);

    // Prepare message history for the API call from the updated state
    messagesForApi = mapToDbMessageArray(nextState);

    // Clear the input fields ONLY for new, non-error submissions
    if (!regenerate && !error) {
        if (textareaRef.current) {
            textareaRef.current.value = "";
        }
        resetTextareaHeight();
        setSelectedImage(null);
    }

    // Set loading and clear errors
    setIsLoading(true);
    setError(false);
    setErrorMessage("");

    try {
      // API Call uses messagesForApi prepared above
      const result = await continueConversation(
        messagesForApi,
        selectedModel,
        character,
        chat_session,
        localStorage.getItem('openai_base_url') ?? undefined,
        localStorage.getItem('openai_api_key') ?? undefined,
      );

      // --- Handle result (streaming, saving, recommendations) ---
      if ("error" in result) {
        setError(true);
        setErrorMessage(result.message);
        setIsLoading(false); // Stop loading on error
        // Consider reverting state if API call failed
        if (!isRegeneratingAction) { // Don't revert user message if regenerating/retrying assistant
            setMessagesState(messagesState); // Revert back to state before adding user message
        }
        return;
      }

      let finalContent = '';
      let assistantMessageId = crypto.randomUUID(); // Pre-generate ID for the assistant message

      // Add placeholder for streaming assistant message to the *current* state
      // Use functional update to ensure it's based on the latest state
      setMessagesState(prev => [...prev, { role: "assistant", content: "", id: assistantMessageId, rating: undefined }]);

      for await (const content of readStreamableValue(result)) {
        // Ensure replacePlaceholders handles potential non-string content robustly,
        // although stream deltas are expected to be strings.
        const processedContent = replacePlaceholders(content as string) as string; // Cast input and expect string output here
        finalContent = processedContent; // Keep track of the full content

        // Update the placeholder assistant message content using functional update
        setMessagesState(prevMessages => prevMessages.map(msg =>
            msg.id === assistantMessageId ? { ...msg, content: processedContent } : msg
        ));
      }

      // --- Streaming Finished ---

      // Ensure the final content is set definitively in the state
      setMessagesState(prevMessages => prevMessages.map(msg =>
          msg.id === assistantMessageId ? { ...msg, content: finalContent } : msg
      ));

      // --- Update Regeneration State ---
      if (regenerate) { // This 'regenerate' flag comes from the initial call
          setRegenerations(prevRegens => {
              const newRegens = [...prevRegens, finalContent].slice(-30);
              setCurrentRegenerationIndex(newRegens.length - 1);
              return newRegens;
          });
      } else if (!error) {
          // If it's a new message (not retry/regenerate), reset regenerations
          setRegenerations([finalContent]);
          setCurrentRegenerationIndex(0);
      }
      // --- End Regeneration State Update ---

      // ---- Logic for Final Save ----
      // Use a functional update to get the *guaranteed latest state* after all updates.
      let finalStateForRecommendations: CustomChatMessage[] = [];
      setMessagesState(currentStateAfterStreaming => {
        finalStateForRecommendations = currentStateAfterStreaming; // Capture for later use
        const messagesToSaveDb = mapToDbMessageArray(currentStateAfterStreaming);

        // Call saveChat asynchronously, handle potential errors
        saveChat(messagesToSaveDb, character, chat_session)
          .catch(saveError => {
            console.error("Failed to save chat after streaming:", saveError);
            toast({
              title: "Save Error",
              description: "Could not save the latest messages.",
              variant: "destructive",
              className: "text-xs"
            });
            // Note: We don't revert the UI state here, as the messages are already displayed.
          });

        return currentStateAfterStreaming; // Return the state unchanged
      });
      // ---- End Logic for Final Save ----


      setIsLoading(false); // Set loading false *after* initiating the save

      // Fetch recommendations (using the state captured right before save)
      if (finalStateForRecommendations.length > 2 && finalStateForRecommendations.length % 12 === 0) {
         try {
          if (areRecommendationsEnabled()) {
            setIsLoadingRecommendations(true);
            // Use the captured state 'finalStateForRecommendations'
            const messagesForRecs = mapToDbMessageArray(finalStateForRecommendations);
            const recommendationsResult = await createChatRecommendations(messagesForRecs);
            if (!recommendationsResult.error && recommendationsResult.recommendations) {
              setMessageRecommendations(recommendationsResult.recommendations);
            }
          }
        } catch (recError) {
          console.error("Failed to get message recommendations:", recError);
          // Handle recommendation errors silently or with a toast
        } finally {
          setIsLoadingRecommendations(false); // Ensure this resets
        }
      } else {
        setIsLoadingRecommendations(false); // Reset if condition not met
      }

    } catch (err) {
      console.error("Error during conversation API call or streaming:", err);
      setError(true);
      setErrorMessage((err as any).message || "An unexpected error occurred.");
      setIsLoading(false);
      setIsLoadingRecommendations(false);
       // Revert message state more robustly on general catch error
       if (!isRegeneratingAction) {
           setMessagesState(messagesState); // Revert back to state before adding user message
       }
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("selectedModel", modelId);
  };

  const handleRetry = useCallback(() => {
    if (messagesState.length > 0) {
      const lastMessage = messagesState[messagesState.length - 1];
      const secondLastMessage = messagesState.length > 1 ? messagesState[messagesState.length - 2] : null;

      if (error && lastMessage.role === "assistant" && secondLastMessage?.role === "user") {
        // Pass the original user message content as the override
        handleSubmit("", true, true, secondLastMessage.content);
      } else if (lastMessage.role === "assistant" && secondLastMessage?.role === "user") {
        // Pass the original user message content as the override
        handleSubmit("", false, true, secondLastMessage.content);
      } else if (lastMessage.role === "user") {
        // This case might indicate an error submitting the user message itself.
        // We use the last message's content, pass error=true, no regeneration override needed.
        handleSubmit(lastMessage.content as string, true, false);
      } else {
      }
    } else {
    }
  }, [messagesState, error, handleSubmit]);

  const handleNewChatFromHere = useCallback(async (index: number) => {
    try {
      // Map before creating session
      const messagesForNewSession = mapToDbMessageArray(messagesState.slice(0, index + 1));
      const sessionId = await createChatSession(character, messagesForNewSession);
      router.push(`/chat/${character.id}?session=${sessionId}`);
      window.location.reload();
    } catch (error) {
      console.error('Failed to create chat session:', error);
      toast({
        title: "Error",
        description: "Failed to create chat session. Please try again later.",
        variant: "destructive",
        className: "text-xs"
      });
    }
  }, [character, messagesState, router, toast]);

  const handleRateMessage = useCallback(async (index: number, rating: number) => {
    if (index >= messagesState.length) {
      console.warn("Attempted to rate a non-existent message index:", index);
      return;
    }

    const originalMessages = [...messagesState];
    const newMessages = messagesState.map((msg, i) =>
      i === index ? { ...msg, rating } : msg
    );

    setMessagesState(newMessages);

    try {
      // Map before saving
      await saveChat(mapToDbMessageArray(newMessages), character, chat_session);
    } catch (error) {
      console.error("Failed to save message rating:", error);
      setMessagesState(originalMessages);
      toast({
        title: "Error",
        description: "Failed to save message rating. Please try again.",
        variant: "destructive",
        className: "text-xs"
      });
    }
  }, [messagesState, character, chat_session, toast]);

  const handleRecommendationClick = (recommendedMessage: string) => {
    if (textareaRef.current) {
      // Set the textarea value directly
      textareaRef.current.value = recommendedMessage;
      textareaRef.current.focus();
      // Manually trigger height adjustment as onChange isn't fired
      adjustTextareaHeight();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    // Reset file input value immediately to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (file && file.type.startsWith("image/")) {
      // Check file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setSelectedImage(null);
        toast({
          title: "Image Too Large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        return; // Stop processing
      }

      // File is valid, proceed with reading
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      // Handle invalid file type (if a file was selected)
      setSelectedImage(null);
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (e.g., JPG, PNG, GIF).",
        variant: "destructive",
      });
    } else {
      // No file selected (e.g., user cancelled the dialog)
      setSelectedImage(null);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const memoizedMessageList = useMemo(() => {
    if (messagesState.length <= 1) return null;

    return messagesState.slice(1).map((m, i) => (
      <MessageContent
        characterId={character.id}
        onRateMessage={handleRateMessage}
        showRetries={i === messagesState.length - 2}      
        key={`${m.role}-${i}`}
        userImage={persona?.image || user?.image}
        message={m as CustomChatMessage}
        index={i + 1}
        isUser={m.role === "user"}
        userName={persona?.displayName ?? user?.name ?? "Guest"}
        characterName={character.name}
        characterAvatarUrl={character.avatar_image_url}
        isError={error && i === messagesState.length - 2}
        onRetry={
          m.role === "assistant" &&
          i === messagesState.length - 2 &&
          !isLoading
            ? handleRetry
            : undefined
        }
        onEdit={handleEdit}
        onDelete={handleDelete}
        regenerations={
          m.role === "assistant" &&
          i === messagesState.length - 2 &&
          !isLoading
            ? regenerations
            : []
        }
        currentRegenerationIndex={currentRegenerationIndex}
        onGoBackRegenerate={handleOnGoBackRegenerate}
        onNewChatFromHere={handleNewChatFromHere}
        isSubscribed={isSubscribed}
      />
    ));
  }, [
    messagesState,
    character.id,
    character.name,
    character.avatar_image_url,
    persona?.image,
    persona?.displayName,
    user?.image,
    user?.name,
    error,
    isLoading,
    regenerations,
    currentRegenerationIndex,
    handleRateMessage,
    handleRetry,
    handleEdit,
    handleDelete,
    handleOnGoBackRegenerate,
    handleNewChatFromHere,
    isSubscribed
  ]);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current && textareaRef.current) {
      // Get the value directly from the ref
      const inputValue = textareaRef.current.value;
      // Check if there's input or an image before submitting
      if (inputValue.trim() || selectedImage) {
         // Pass the obtained value to handleSubmit
        handleSubmit(inputValue, false, false);
        // Clear the uncontrolled textarea manually after successful submission logic starts in handleSubmit
        // Note: handleSubmit clears the ref now, so maybe redundant here unless handleSubmit fails early
        // textareaRef.current.value = ''; // This is now done inside handleSubmit
        // resetTextareaHeight(); // This is now done inside handleSubmit
        // setSelectedImage(null); // This is now done inside handleSubmit
      } else {
        // Optionally provide feedback if there's nothing to send
      }
    }
  };

  const [processedMessages, setProcessedMessages] = useState<any>([]);
  useEffect(() => {
    const processedMessages = messagesState.map((message, index) => ({
      ...message,
      id: index.toString(), // Use index as the id
      content: replacePlaceholders(message.content as string | MultimodalContent | undefined) as string,
    })) // Ensure type includes 'id'
    setProcessedMessages(processedMessages);
  }, [messagesState]);

  return (
    <AdsProvider
      publisherToken='opencharacter-jh56hf9cl'
      isLoading={isLoading}
      messages={processedMessages}
      userId={user?.id ?? "guest"}
      conversationId={`${character.id.slice(24)}-${user?.id?.slice(24)}`}
      isDisabled={isSubscribed}
    >

    <div className="flex flex-col h-full relative max-w-full overflow-x-hidden p-4">
      
      <style jsx global>{`
        /* Webkit browsers (Chrome, Safari) */
        ::-webkit-scrollbar {
          width: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.1);
        }

        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          * {
            scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.1);
          }
        }
        
        /* Animation for recommendation chips */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Skeleton loading animation */
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: 200px 0;
          }
        }
        
        .animate-skeleton {
          background: linear-gradient(90deg, rgba(30, 41, 59, 0.2) 25%, rgba(71, 85, 105, 0.3) 50%, rgba(30, 41, 59, 0.2) 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
      <div className="flex-grow w-full flex justify-center overflow-y-auto mx-auto">
        <div id="messages-container" className="w-full mx-auto max-w-2xl">
          {/* Character Information Header */}
          <div className="mx-auto pt-12 pb-6 flex flex-col gap-2 text-center items-center overflow-hidden">
            <div className={`w-24 h-24 ${localStorage.getItem('character_icon_style') === "circle" ? "rounded-full" : "rounded-lg"} overflow-hidden mr-3`}>
              <Link href={`/character/${character.id}/profile`}>
                <Image
                  src={character.avatar_image_url ?? "/default-avatar.jpg"}
                  alt={`${character.name}'s avatar`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </Link>
            </div>
            <p className="font-light text-md text-white">
              {character.name}
            </p>
            <ReactMarkdown className="font-light text-md text-slate-200">
              {character.tagline}
            </ReactMarkdown>
            <Link className="text-xs font-light text-gray-400 hover:underline hover:text-blue-700" href={`/public-profile/${character.userId}`}>
              by {made_by_name}
            </Link>
          </div>

          <div className="pb-32">
            {memoizedMessageList}    
            <div className="w-full mx-auto text-white flex flex-row">
              <div className="">
                <InlineAd code="inlineAd" messageId={String(processedMessages.length - 1)}/>              
              </div>
            </div>
            
            {/* Display custom ads from our server action */}
            {adData && (
              <div className="w-full mx-auto my-4 p-4 bg-slate-800/70 rounded-lg border border-slate-700">
                <div className="text-sm font-medium mb-2 text-slate-300">Sponsored</div>
                <a 
                  href={adData.ad.link || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block hover:bg-slate-700/50 p-3 rounded transition-colors"
                >
                  <h3 className="text-base font-semibold text-blue-400">{adData.ad.ad_title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{adData.ad.ad_description}</p>
                </a>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      { share &&
        <Link 
          className="fixed bottom-20 md:bottom-6 left-0 right-0 px-8 py-4 max-w-lg w-full border mx-auto rounded-xl text-center text-slate-400 hover:bg-slate-900 hover:cursor-pointer bg-neutral-900"
          href={`/chat/${character.id}`}  
        >
          chat with {character.name}...
        </Link>
      }
      {!share && 
        <div className="fixed bottom-4 left-0 right-0 py-0 w-full max-w-full">
        <div className="max-w-2xl mx-auto w-full">
          {error && (
            <div className="mb-2 p-2 bg-red-900 border border-red-800 rounded-lg text-red-200 text-sm pointer-events-auto flex justify-between items-center">
              <p className="flex items-center text-xs">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorMessage}
              </p>
              <RotateCcw
                className="w-5 h-5 text-red-500 cursor-pointer hover:text-red-600 ml-2"
                onClick={handleRetry}
              />
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="pointer-events-auto flex items-center space-x-2 w-full px-2 flex-col"
          >
            {(messageRecommendations.length > 0 || isLoadingRecommendations) && !isLoading && areRecommendationsEnabled() && (
              <div className="absolute bottom-full left-2 right-2 mb-2 z-20 flex flex-wrap gap-2 justify-center animate-fade-in">
                {isLoadingRecommendations ? (
                  // Single recommendation loading skeleton with text
                  <div 
                    className="bg-slate-800/70 text-xs px-3 py-1 rounded-md border border-slate-700 shadow-md animate-skeleton h-6 flex items-center"
                  >
                    <span className="text-slate-400 text-[10px]">Cooking some messages...</span>
                  </div>
                ) : (
                  // Actual recommendations
                  messageRecommendations.map((rec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRecommendationClick(rec.message)}
                      className="bg-slate-800/80 backdrop-blur-sm text-white text-[10px] px-3 py-1 rounded-md hover:bg-slate-700 transition-colors border border-slate-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-transform"
                      title={rec.message}
                    >
                      {rec.title}
                    </button>
                  ))
                )}
              </div>
            )}

            {!isSubscribed && 
              <Link 
                className="left-2 mb-1 z-20 p-1 bg-slate-700/50 rounded-md backdrop-blur-sm border border-slate-600"
                href={'/plans'}  
              >
                <p className="text-[8px] text-slate-400">
                  Upgrade to Pro
                </p>
              </Link>
            } 

            <div className="relative flex-grow w-full flex">
              {/* Image Preview */}
              {selectedImage && (
                <div className="absolute bottom-full left-2 mb-1 z-20 p-1 bg-slate-700/50 rounded-md backdrop-blur-sm border border-slate-600">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Image preview"
                      className="max-h-24 max-w-full h-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-0.5 z-30"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            
              <div className="textarea-backdrop absolute inset-0 bg-slate-600 bg-opacity-20 backdrop-blur-md border-neutral-700" style={{ borderRadius: "9999px" }}></div>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-20 flex items-center space-x-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={handleImageUploadClick}
                  className="p-1 rounded-full hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-slate-200"
                  aria-label="Upload image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelSelect={handleModelSelect}
                />
              </div>
              
              {/* Textarea Container - takes up available space minus button width */}
              <div className="flex-1 relative">
                <textarea
                  autoFocus
                  ref={textareaRef}
                  name="message"
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onInput={adjustTextareaHeight}
                  placeholder={`Message ${character.name}...`}
                  className="w-full py-4 pl-[calc(2.5rem+3.5rem)] pr-3 bg-transparent relative z-10 outline-none text-white text-xl resize-none overflow-hidden pointer-events-auto"
                  style={{
                    minHeight: "60px",
                    maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
                    overflowY: "auto",
                    borderRadius: "9999px", // Initial border radius (rounded-full), will be dynamically adjusted
                  }}
                  rows={1}
                />
              </div>
              
              {/* Submit Button Container - fixed width */}
              <div className="flex items-center justify-center w-16 relative">
                <button
                  type="submit"
                  className="bg-white rounded-full p-2 z-40 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer pointer-events-auto"
                  disabled={isLoading}
                >
                  {!isLoading ?
                      <svg
                        viewBox="0 0 24 24"
                        className="w-6 h-6 text-black"
                        fill="none"
                        stroke="currentColor"
                        >
                        <path
                          d="M5 12h14M12 5l7 7-7 7"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    :
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                  }
                </button>
              </div>
            </div>
          </form>

          <Dialog
            open={isSignInDialogOpen}
            onOpenChange={setIsSignInDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign in to continue</DialogTitle>
              </DialogHeader>
              <p className="text-xs">Please sign in to send messages and save your conversation.</p>
              
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-4">
                  <input 
                    type="checkbox" 
                    checked={isAgeVerified}
                    onChange={(e) => setIsAgeVerified(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  I confirm that I am 18 years or older
                </label>
              </div>

              {isAgeVerified ? (
                <SignInButton />
              ) : (
                <button 
                  disabled
                  className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded cursor-not-allowed opacity-50"
                >
                  Please confirm you are 18 or older
                </button>
              )}

              <p className="text-[8px] mt-2 text-slate-400">
                By signing in, you agree to our 
                <Link href="/terms-of-service" className="text-blue-500 underline"> Terms of Service</Link> and 
                <Link href="/privacy-policy" className="text-blue-500 underline"> Privacy Policy</Link>, 
                and receive emails from us about product updates, news, and promotional offers. You can unsubscribe at any time.
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>      
      }
    </div>
    </AdsProvider>
  );
}