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

  console.log(`[R2Image M:${messageIndex} P:${partIndex}] Received prop imageKeyOrUrl:`, imageKeyOrUrl);

  useEffect(() => {
    console.log(`[R2Image M:${messageIndex} P:${partIndex}] useEffect running. Current imageKeyOrUrl:`, imageKeyOrUrl, `HasFetched: ${hasFetched.current}`);

    // Check if it's a key (not data URI or http/https) and hasn't been fetched yet
    const isKey = !imageKeyOrUrl.startsWith('data:') && !imageKeyOrUrl.startsWith('http');
    console.log(`[R2Image M:${messageIndex} P:${partIndex}] Is R2 Key check:`, isKey);

    if (isKey && !hasFetched.current) {
      hasFetched.current = true; // Mark as fetched
      setIsLoading(true);
      setError(null);
      setImageUrl(null); // Reset previous URL if key changes
      console.log(`[R2Image M:${messageIndex} P:${partIndex}] Detected key. Initiating fetch for presigned URL...`);

      getPresignedUrlForImageKey(imageKeyOrUrl)
        .then(result => {
          console.log(`[R2Image M:${messageIndex} P:${partIndex}] Fetched presigned URL result:`, result);
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
          console.log(`[R2Image M:${messageIndex} P:${partIndex}] Fetch finished. Setting isLoading to false.`);
          setIsLoading(false);
        });
    } else if (!isKey) {
      console.log(`[R2Image M:${messageIndex} P:${partIndex}] Prop is not an R2 key (likely data URI or existing URL). Using directly.`);
      // If it's already a valid URL (data or http), use it directly
      setImageUrl(imageKeyOrUrl);
      setIsLoading(false);
      setError(null);
      hasFetched.current = true; // Mark as "fetched" since we have the URL
    } else if (isKey && hasFetched.current) {
       console.log(`[R2Image M:${messageIndex} P:${partIndex}] Is key, but already fetched or fetch in progress.`);
    }
  }, [imageKeyOrUrl, messageIndex, partIndex]); // Re-run effect if the key/URL changes

  console.log(`[R2Image M:${messageIndex} P:${partIndex}] Rendering state: isLoading=${isLoading}, error=${error}, imageUrl=${imageUrl?.substring(0,60)}...`);

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
    console.log(`[MessageContent Render M:${index}] Rendering content:`, message.content);

    if (Array.isArray(message.content)) {
      // Handle multimodal content
      return (message.content as MultimodalContent).map((part, partIndex) => {
        console.log(`[MessageContent Render M:${index} P:${partIndex}] Rendering part:`, part);
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
            </span>
            <button 
              className="p-1 rounded-full"
              onClick={() => {
                if (currentRegenerationIndex < regenerations.length - 1) {
                  onGoBackRegenerate && onGoBackRegenerate(currentRegenerationIndex + 1);
                } else {
                  if (regenerations.length < 30) {
                    onRetry && onRetry();
                  }
                }
              }}
              disabled={(currentRegenerationIndex >= regenerations.length - 1 && regenerations.length >= 30) || regenerations.length === 0}
            >
              <ChevronRight className={`w-4 h-4 ${(currentRegenerationIndex >= regenerations.length - 1 && regenerations.length >= 30) || regenerations.length === 0 ? "text-slate-700" : ""}`} />
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
  subscribed: boolean;
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
    console.log("[Initial Load] Processing messages from props:", messages.length);
    return messages.map((msg, index) => {
      console.log(`[Initial Load - Msg ${index}] Processing message:`, { role: msg.role, contentPreview: typeof msg.content === 'string' ? msg.content.substring(0, 100) + '...' : '(Non-string content)' });

      let processedContent: string | MultimodalContent | undefined = undefined;
      let parseError: Error | null = null;
      let validationPassed: boolean | null = null;
      let attemptedParse = false;

      if (typeof msg.content === 'string' && msg.content.trim().startsWith('[')) {
        // Only attempt parse if it's a string that starts with '['
        attemptedParse = true;
        try {
          console.log(`[Initial Load - Msg ${index}] String starts with '[', attempting JSON.parse...`);
          const parsed = JSON.parse(msg.content);
          console.log(`[Initial Load - Msg ${index}] JSON.parse successful. Type: ${typeof parsed}, IsArray: ${Array.isArray(parsed)}`);

          if (Array.isArray(parsed)) {
            validationPassed = parsed.every(p =>
              p != null && typeof p === 'object' && typeof p.type === 'string' &&
              ((p.type === 'text' && typeof p.text === 'string') ||
               (p.type === 'image_url' && p.image_url && typeof p.image_url.url === 'string'))
            );
            console.log(`[Initial Load - Msg ${index}] Parsed to array. Validation passed: ${validationPassed}`);

            if (validationPassed) {
              processedContent = parsed as MultimodalContent;
              console.log(`[Initial Load - Msg ${index}] Assigned parsed array to processedContent.`);
            } else {
              console.warn(`[Initial Load - Msg ${index}] Parsed array FAILED validation. Falling back to original string.`);
              processedContent = msg.content; // Fallback
            }
          } else {
            console.log(`[Initial Load - Msg ${index}] Parsed content is not an array. Treating as original string.`);
            processedContent = msg.content; // Fallback
            validationPassed = false;
          }
        } catch (e) {
          parseError = e as Error;
          console.warn(`[Initial Load - Msg ${index}] JSON.parse FAILED even though string started with '['. Treating as plain string. Error:`, parseError.message);
          processedContent = msg.content; // Fallback
        }
      } else if (typeof msg.content === 'string'){
        // It's a string, but doesn't start with '[', treat as plain text
        console.log(`[Initial Load - Msg ${index}] Content is a string but doesn't start with '['. Treating as plain text.`);
        processedContent = msg.content;
      } else {
        // Content is not a string initially
        console.log(`[Initial Load - Msg ${index}] Initial content type is not string: ${typeof msg.content}. Assigning directly.`);
        if (msg.content === null || msg.content === undefined) {
          console.warn(`[Initial Load - Msg ${index}] Content is null/undefined.`);
          processedContent = "";
        } else {
          // Assume it's already in the correct format (e.g., MultimodalContent array)
          // Add validation here if necessary based on expected non-string types
          processedContent = msg.content as string | MultimodalContent;
        }
      }

      const finalContent = replacePlaceholders(processedContent);
      console.log(`[Initial Load - Msg ${index}] Final content type after placeholders: ${typeof finalContent}, AttemptedParse: ${attemptedParse}, ValidationPassed: ${validationPassed ?? 'N/A'}`);

      const finalMappedMessage = {
        role: msg.role as 'user' | 'assistant' | 'system',
        id: (msg as any).id ?? crypto.randomUUID(),
        rating: (msg as any).rating,
        content: finalContent,
      } as CustomChatMessage;
      console.log(`[Initial Load - Msg ${index}] FINAL mapped message object being added to state:`, JSON.stringify(finalMappedMessage));

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

  const [input, setInput] = useState("");
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

  console.log("messages", messages)

  useEffect(() => {
    async function checkSubscription() {
      if (user?.id) {
        try {
          const response = await fetch("/api/subscriptions/check");
          const data = (await response.json()) as SubscriptionCheckResponse;
          console.log(data)
          setIsSubscribed(data.subscribed);
          if (data.subscribed) {
            const savedModel = localStorage.getItem("selectedModel");
            if (!savedModel) {
              setSelectedModel("nousresearch/hermes-3-llama-3.1-70b");
              localStorage.setItem("selectedModel", "nousresearch/hermes-3-llama-3.1-70b");
            } else {
              setSelectedModel(savedModel);
            }
          }
        } catch (error) {
          console.error("Error checking subscription:", error);
          setIsSubscribed(false);
        }
      }
    }
    checkSubscription();
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;

      // Add scrollbar if content exceeds max height
      textareaRef.current.style.overflowY =
        scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (window.innerWidth > 768) {
      // Desktop
      if (e.key === "Enter" && !e.shiftKey) {
        // submit form
        e.preventDefault();
        formRef.current?.requestSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        resetTextareaHeight();
        if (input.trim() === "") {
          setInput("");
        }
      }
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
  ) => {
    // Ensure user is signed in
    if (!user) {
      setIsSignInDialogOpen(true);
      return;
    }

    // Do nothing if loading or if there's no input and no image selected
    if (isLoading || (!input.trim() && !selectedImage)) {
      return;
    }

    // Clear message recommendations
    setMessageRecommendations([]);

    let currentUserMessageContent: string | MultimodalContent = input;

    // --- Construct multimodal content if image is selected ---
    if (selectedImage) {
      currentUserMessageContent = [
        { type: "text", text: input },
        {
          type: "image_url",
          image_url: {
            url: selectedImage,
          },
        },
      ];
      // TODO: Add check for model compatibility with images here?
      // e.g., if (!selectedModelSupportsImages(selectedModel)) { showToast('Model doesn't support images'); return; }
    }
    // --- End multimodal content construction ---

    let newMessages: CustomChatMessage[];

    if (regenerate && !error) {
      newMessages = messagesState.slice(0, -1);
    } else if (error) {
      newMessages = [...messagesState];
    } else {
      // Ensure new user message has an ID for state consistency (though optional in type)
      newMessages = [...messagesState, { content: currentUserMessageContent, role: "user", id: crypto.randomUUID() }];
    }

    setMessagesState(newMessages);
    setInput("");
    resetTextareaHeight();
    setSelectedImage(null);
    setIsLoading(true);
    setError(false);
    setErrorMessage("");

    try {
      // --- Map to expected format for continueConversation --- 
      // Assuming continueConversation also expects the DB format now
      const messagesForApi = mapToDbMessageArray(newMessages);

      const result = await continueConversation(
        messagesForApi, // Pass mapped array
        selectedModel,
        character,
        chat_session,
        localStorage.getItem('openai_base_url') ?? undefined,
        localStorage.getItem('openai_api_key') ?? undefined,
      );

      // --- Handle result (streaming, saving, recommendations) ---
      if ("error" in result) {
        setError(true);
        console.log(result.error);
        setErrorMessage(result.message);
        setIsLoading(false); // Stop loading on error
        // Important: Consider how to handle potential state mismatch if API call fails
        // Maybe revert messagesState? setMessagesState(messagesState.slice(0, -1)) if not regenerating?
        return;
      }

      let finalContent = '';
      let assistantMessageId = crypto.randomUUID(); // Pre-generate ID for the assistant message

      // Add placeholder for streaming assistant message
      setMessagesState(prev => [...prev, { role: "assistant", content: "", id: assistantMessageId }]);

      for await (const content of readStreamableValue(result)) {
        // Ensure replacePlaceholders handles potential non-string content robustly,
        // although stream deltas are expected to be strings.
        const processedContent = replacePlaceholders(content as string) as string; // Cast input and expect string output here
        finalContent = processedContent; // Keep track of the full content

        // Update the placeholder assistant message content
        setMessagesState(prevMessages => prevMessages.map(msg =>
            msg.id === assistantMessageId ? { ...msg, content: processedContent } : msg
        ));
      }

      // --- Regeneration State Update Logic (Moved After Stream) ---
      if (regenerate) {
          // Append the newly generated final content to the existing regenerations
          setRegenerations(prevRegens => {
              // Ensure we don't exceed the max limit (e.g., 30)
              const newRegens = [...prevRegens, finalContent].slice(-30); 
              // Update the index to point to the newly added regeneration
              setCurrentRegenerationIndex(newRegens.length - 1);
              return newRegens;
          });
      } else if (!error) {
          // If it's a new message (not retry/regenerate), reset regenerations
          setRegenerations([finalContent]);
          setCurrentRegenerationIndex(0);
      }
      // --- End Regeneration State Update ---

      // Final state update with complete assistant message (already done in stream)
      // Ensure finalMessages reflects the true state for saving
       const finalMessagesWithIds = messagesState.map(msg => // Use current messagesState which includes the streamed update
            msg.id === assistantMessageId ? { ...msg, content: finalContent } : msg
        );
       // If streaming somehow failed, ensure last message has final content (redundant check)
       if (finalMessagesWithIds.length > 0 && finalMessagesWithIds[finalMessagesWithIds.length - 1].id === assistantMessageId) {
            finalMessagesWithIds[finalMessagesWithIds.length - 1].content = finalContent;
        } else if (!finalMessagesWithIds.some(msg => msg.id === assistantMessageId)) {
             // Fallback if placeholder wasn't added correctly (shouldn't happen)
             finalMessagesWithIds.push({ role: "assistant", content: finalContent, id: assistantMessageId });
        }

      // ---- REVISED LOGIC FOR FINAL SAVE ----
      // Explicitly construct the final state for saving
      // Start with `newMessages` (which includes the latest user message)
      // Add the final assistant message object.
      const finalAssistantMessageObject: CustomChatMessage = {
          role: "assistant",
          content: finalContent, // Use the fully streamed content
          id: assistantMessageId
      };
      // Ensure the correct list is saved, including the user message from `newMessages`
      const finalMessagesToSaveState = regenerate 
          ? [...newMessages, finalAssistantMessageObject] // newMessages excludes last AI msg if regenerating
          : [...newMessages, finalAssistantMessageObject]; // newMessages includes user msg if not regenerating

      console.log(`[handleSubmit] Preparing to save ${finalMessagesToSaveState.length} messages. Final state for saving:`, JSON.stringify(finalMessagesToSaveState, null, 2));
      // ---- End Revised Logic ----

      // --- Map to ChatMessageArray before saving ---
      const messagesToSaveDb = mapToDbMessageArray(finalMessagesToSaveState); // Use the explicitly constructed array

      await saveChat(messagesToSaveDb, character, chat_session);

      setIsLoading(false);

      // Fetch recommendations (using the correct final state)
      if (finalMessagesToSaveState.length > 2 && finalMessagesToSaveState.length % 12 === 0) {
         try {
          if (areRecommendationsEnabled()) {
            setIsLoadingRecommendations(true);
            const messagesForRecs = mapToDbMessageArray(finalMessagesToSaveState);
            const recommendationsResult = await createChatRecommendations(messagesForRecs);
            console.log("Recommendations result:", recommendationsResult);
            if (!recommendationsResult.error && recommendationsResult.recommendations) {
              setMessageRecommendations(recommendationsResult.recommendations);
            }
            setIsLoadingRecommendations(false);
          }
        } catch (recError) {
          console.error("Failed to get message recommendations:", recError);
          setIsLoadingRecommendations(false);
        }
      } else {
        setIsLoadingRecommendations(false);
      }

    } catch (err) {
      console.error("Error during conversation:", err);
      setError(true);
      setErrorMessage((err as any).message || "An unexpected error occurred.");
      setIsLoading(false);
      setIsLoadingRecommendations(false);
       // Revert message state on general catch error?
       // setMessagesState(messagesState.slice(0, -1)); // If not regenerating
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("selectedModel", modelId);
  };

  const handleRetry = useCallback(() => {
    console.log("Attempting to retry the last message.");
    if (messagesState.length > 0) {
      const lastMessage = messagesState[messagesState.length - 1];
      const secondLastMessage = messagesState.length > 1 ? messagesState[messagesState.length - 2] : null;

      if (error && lastMessage.role === "assistant" && secondLastMessage?.role === "user") {
        console.log("Retrying the last user message to get a new assistant response after an error.");
        handleSubmit(secondLastMessage.content as string, false, true);
      } else if (lastMessage.role === "assistant" && secondLastMessage?.role === "user") {
        console.log("Regenerating the last assistant response.");
        handleSubmit(secondLastMessage.content as string, false, true);
      } else if (lastMessage.role === "user") {
        console.log("Retrying the user's message submission.");
        handleSubmit(lastMessage.content as string, true);
      } else {
        console.log("Cannot determine how to retry based on the last message(s).");
      }
    } else {
      console.log("Not enough messages to retry.");
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
      setInput(recommendedMessage);
      textareaRef.current.value = recommendedMessage;
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const MAX_FILE_SIZE_MB = 1;
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
    handleNewChatFromHere
  ]);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      const inputValue = formData.get('message') as string;
      handleSubmit(inputValue, false, false);
      formRef.current.reset();
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
        <div className="fixed bottom-0 left-0 right-0 py-0 w-full max-w-full">
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

          {!isSubscribed && (
            <div className="flex flex-col items-center justify-center mb-1">
              <Link href="/plans" className="text-center justify-center text-[9px] text-blue-500 underline ">
                Upgrade to Pro
              </Link>
            </div>
          )}

          <form
            ref={formRef}
            onSubmit={handleFormSubmit}
            className="pointer-events-auto flex items-center space-x-2 max-w-full px-2"
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
            <div className="relative flex-grow">
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
              <div className="absolute inset-0 bg-slate-600 bg-opacity-20 backdrop-blur-md rounded-t-xl border-neutral-700"></div>
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
              <textarea
                autoFocus
                ref={textareaRef}
                name="message"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                placeholder={`Message ${character.name}...`}
                className="w-full py-4 pl-[calc(2.5rem+3.5rem)] pr-12 bg-transparent relative z-10 outline-none text-white text-xl rounded-t-3xl resize-none overflow-hidden"
                style={{
                  minHeight: "60px",
                  maxHeight: `${MAX_TEXTAREA_HEIGHT}px`,
                  overflowY: "auto",
                }}
                rows={1}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform bg-blue-700 rounded-full -translate-y-1/2 p-2 z-20 transition-opacity opacity-70 hover:opacity-100 focus:opacity-100 hover:cursor-pointer"
                disabled={isLoading}
              >
                {!isLoading ?
                    <svg
                      viewBox="0 0 24 24"
                      className="w-8 h-8 text-white"
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
                  <Loader2 className="w-8 h-8 animate-spin" />
                }
              </button>
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