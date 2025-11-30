"use client"

import React, { useState, useEffect, useRef, useContext } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { aiPrompt, GROQ_CONFIG, SUPPORTED_LANGUAGES } from "@/ai/aiPrompt"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Groq from "groq-sdk"
import { useAuth } from "@/providers/AuthProvider"
import {
  ChevronDown,
  Maximize2,
  Minus,
  Trash2,
  X,
  Send,
  MessageCircle,
} from "lucide-react"
import AssetCard from "@/components/pages/(app)/rwa/AssetCard"
import CuteModal from "@/components/common/CuteModal"
import CuteButton from "@/components/common/CuteButton"
import { Asset } from "@/lib/mongodb/rwa-types"
import { formatUiNumber } from "@/utils/formatting"
import { useRouter } from "next/navigation"

const USE_GROQ = process.env.NEXT_PUBLIC_GROQ_API_KEY ? true : false

let groqClient: Groq | null = null
if (USE_GROQ && typeof window !== "undefined") {
  try {
    groqClient = new Groq({
      apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
      dangerouslyAllowBrowser: true,
    })
  } catch (error) {
    console.error("Error initializing GROQ client:", error)
  }
}

type GroqRole = "system" | "user" | "assistant"

interface GroqMessage {
  role: GroqRole
  content: string
}

interface UIComponent {
  type: 'asset_cards' | 'action_button' | 'info_card' | string
  assets?: any[]
  label?: string
  action?: string
  url?: string
  title?: string
  content?: string
  [key: string]: any
}

interface Message {
  text: string
  sender: "user" | "ai"
  assets?: any[] // Legacy: Array of asset data if mentioned in AI response
  ui?: {
    components?: UIComponent[] // Generative UI components
  }
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        li: ({ ...props }) => (
          <li className="list-item marker:text-black" {...props} />
        ),
        a: ({ ...props }) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF8200] hover:underline"
            {...props}
          />
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "")
          return !match ? (
            <code
              className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

const LanguageSelector = ({
  selectedLanguage,
  onSelectLanguage,
}: {
  selectedLanguage: string
  onSelectLanguage: (language: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 bg-gray-200/60 hover:bg-gray-300/60 text-gray-700 text-sm rounded-lg px-3 py-1.5 transition-colors"
      >
        <span>
          {SUPPORTED_LANGUAGES.find((lang) => lang.code === selectedLanguage)
            ?.nativeName || "English"}
        </span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>
      {isOpen && (
        <div className="overflow-y-auto absolute right-0 z-50 mt-2 w-48 max-h-60 bg-white rounded-lg shadow-lg backdrop-blur-md border border-gray-200">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                onSelectLanguage(language.code)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${selectedLanguage === language.code
                  ? "bg-orange-50 font-medium"
                  : ""
                }`}
            >
              <span className="block text-gray-800">{language.nativeName}</span>
              <span className="block text-xs text-gray-500">
                {language.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const LoadingIndicator = () => (
  <div className="flex justify-center items-center p-3 space-x-1.5 text-gray-500 bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm">
    <div
      className="w-2 h-2 rounded-full animate-pulse bg-[#FF8200]"
      style={{ animationDelay: "0ms" }}
    ></div>
    <div
      className="w-2 h-2 rounded-full animate-pulse bg-[#FF8200]"
      style={{ animationDelay: "300ms" }}
    ></div>
    <div
      className="w-2 h-2 rounded-full animate-pulse bg-[#FF8200]"
      style={{ animationDelay: "600ms" }}
    ></div>
  </div>
)

const TypingIndicator = () => (
  <span className="inline-flex text-[#FF8200]">
    <span className="animate-pulse">.</span>
    <span className="animate-pulse" style={{ animationDelay: "300ms" }}>
      .
    </span>
    <span className="animate-pulse" style={{ animationDelay: "600ms" }}>
      .
    </span>
  </span>
)

const chatWindowVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

const messageVariants: Variants = {
  hidden: (message: Message) => ({
    opacity: 0,
    x: message.sender === "user" ? 20 : -20,
    scale: 0.9,
  }),
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

const toggleButtonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
}

const ShingruChatbot: React.FC = () => {
  // Use useAuth hook (same as RWAIndex) - will throw if not in AuthProvider, which is fine
  let me = null;
  let authError = false;
  try {
    const auth = useAuth();
    me = auth.me;
  } catch (error) {
    // AuthProvider not available - this is fine for public pages
    // Only log in development to avoid console noise
    if (process.env.NODE_ENV === 'development') {
      console.debug('AuthProvider not available in chatbot context (this is normal for public pages)');
    }
    authError = true;
  }

  // HARDCODED FOR TESTING - remove in production
  if (!me || !me.username) {
    me = {
      id: 'test-user-id',
      username: 'ayux',
      profileImage: null,
    } as any;
    console.log('🧪 [TESTING] Using hardcoded user: ayux');
  }

  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  // RWA purchase modal state (exact same as RWA route)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)

  // Loading state for asset cards
  const [loadingAssets, setLoadingAssets] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language.split("-")[0].toLowerCase()
      const isSupported = SUPPORTED_LANGUAGES.some(
        (lang) => lang.code === browserLang
      )
      if (isSupported) setSelectedLanguage(browserLang)
    }
    detectLanguage()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent])

  const formatResponse = (content: string): string => {
    if (!content)
      return "I apologize, but I couldn't generate a response. Please try again."
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(
      /```\s*\n([\s\S]*?)\n```/g,
      (_match, codeContent) => {
        return "```text\n" + codeContent + "\n```"
      }
    )
    return cleanedContent
  }

  const generateGroqMessages = (userInput: string): GroqMessage[] => {
    const langName =
      SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name ||
      "English"
    const languageInstruction =
      selectedLanguage !== "en"
        ? `\n\nIMPORTANT: The user's language is ${langName}. Please respond in ${langName}.`
        : ""
    return [
      { role: "system", content: aiPrompt + languageInstruction },
      { role: "user", content: userInput },
    ]
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { text: input.trim(), sender: "user" as const }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      let response: string

      // Try using the API route first (with MongoDB integration)
      try {
        // Build conversation history (last 10 messages for context)
        const conversationHistory = messages
          .slice(-10) // Last 10 messages for context
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));

        console.log('💬 [Chatbot] Sending conversation history:', conversationHistory.length, 'messages');

        const apiResponse = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.text,
            userId: me?.id || null,
            username: me?.username || null,
            conversationHistory: conversationHistory, // Send conversation history for context
          }),
        })

        if (apiResponse.ok) {
          const data = await apiResponse.json()
          response = data.response || 'I apologize, but I could not generate a response. Please try again.'

          // Handle assets array or legacy asset singular
          let assetsArray: any[] = [];
          if (data.assets && Array.isArray(data.assets) && data.assets.length > 0) {
            assetsArray = data.assets;
          } else if (data.asset) {
            // Backward compatibility: convert singular asset to array
            assetsArray = [data.asset];
          }

          // Log for debugging with full asset details
          if (assetsArray.length > 0) {
            console.log('✅ [Chatbot] Received assets data:', {
              count: assetsArray.length,
              assets: assetsArray.map((a: any) => ({
                assetId: a.assetId,
                name: a.name,
                location: a.location,
                description: a.description ? a.description.substring(0, 50) + '...' : 'NO DESCRIPTION',
                pricePerShare: a.pricePerShare,
                availableShares: a.availableShares,
                totalShares: a.totalShares,
                status: a.status,
                hasAllFields: !!(a.assetId && a.name && a.location && a.description && a.pricePerShare !== undefined && a.availableShares !== undefined && a.totalShares !== undefined)
              })),
            });
          } else {
            console.log('⚠️ [Chatbot] No assets in response:', {
              hasAssets: !!data.assets,
              assetsLength: data.assets?.length || 0,
              hasAsset: !!data.asset,
              metadata: data.metadata
            });
          }

          // Add AI response with asset data if present
          const aiMessage: Message = {
            text: response,
            sender: "ai",
            assets: assetsArray.length > 0 ? assetsArray : undefined,
          }

          console.log('💬 [Chatbot] Adding message to chat:', {
            hasText: !!aiMessage.text,
            textLength: aiMessage.text?.length || 0,
            hasAssets: !!aiMessage.assets,
            assetsCount: aiMessage.assets?.length || 0
          });

          setMessages((prev) => [...prev, aiMessage])
          return // Exit early since we've already added the message
        } else {
          // API route returned an error - parse the error response
          let errorMessage = 'API route failed';
          let errorDetails: any = null;

          try {
            const errorData = await apiResponse.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
            errorDetails = errorData;
            console.error('❌ API route error response:', {
              status: apiResponse.status,
              statusText: apiResponse.statusText,
              error: errorMessage,
              details: errorData,
            });
          } catch (parseError) {
            // If JSON parsing fails, try to get text response
            try {
              const errorText = await apiResponse.text();
              console.error('❌ API route error (non-JSON):', {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                body: errorText,
              });
              errorMessage = `API route failed with status ${apiResponse.status}: ${errorText}`;
            } catch (textError) {
              console.error('❌ API route error (unable to read response):', {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
              });
              errorMessage = `API route failed with status ${apiResponse.status}`;
            }
          }

          // Throw error with details for better debugging
          throw new Error(`API route failed: ${errorMessage}`)
        }
      } catch (apiError: any) {
        // Log the full error for debugging
        console.error('❌ API route error caught:', {
          error: apiError,
          message: apiError?.message,
          stack: apiError?.stack,
        });

        // Check if it's a network error or API error
        const isNetworkError = apiError?.message?.includes('fetch') ||
          apiError?.message?.includes('network') ||
          apiError?.name === 'TypeError';

        // Fallback to direct Groq client if API route is not available
        if (USE_GROQ && groqClient && !isNetworkError) {
          console.log('⚠️ API route unavailable, falling back to direct Groq client');
          try {
            const streamPlaceholder = { text: "", sender: "ai" as const }
            setMessages((prev) => [...prev, streamPlaceholder])
            response = await handleStreamWithGroq(userMessage.text)
            setMessages((prev) => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1].text = response
              return newMessages
            })
            return // Exit early after handling with Groq
          } catch (groqError) {
            console.error('❌ Direct Groq client also failed:', groqError);
            // Fall through to error message
          }
        }

        // Show user-friendly error message
        if (apiError?.message?.includes('AI service not configured')) {
          response = "I'm sorry, but the AI service is not configured. Please set up your GROQ API key in the environment variables (GROQ_API_KEY or NEXT_PUBLIC_GROQ_API_KEY) to enable chat functionality."
        } else if (isNetworkError) {
          response = "I'm having trouble connecting to the AI service. Please check your internet connection and try again."
        } else {
          response = `I encountered an error: ${apiError?.message || 'Unknown error'}. Please try again or contact support if the issue persists.`
        }
      }

      // Add AI response to messages (only if not already added from API route)
      // Note: API route already adds the message and returns early, so this only runs for fallback cases
      if (!isStreaming) {
        const aiMessage: Message = { text: response, sender: "ai" as const }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred. Please try again."
      const aiErrorMessage = {
        text: `I apologize, but I encountered an error: ${errorMessage}`,
        sender: "ai" as const,
      }
      setMessages((prev) => [...prev, aiErrorMessage])
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleStreamWithGroq = async (userInput: string): Promise<string> => {
    if (!groqClient) throw new Error("GROQ client not initialized")
    setIsStreaming(true)
    setStreamingContent("")

    const messages = generateGroqMessages(userInput)

    try {
      const stream = await groqClient.chat.completions.create({
        messages,
        model: GROQ_CONFIG.DEFAULT_MODEL,
        temperature: GROQ_CONFIG.GENERATION_PARAMS.temperature,
        max_tokens: GROQ_CONFIG.GENERATION_PARAMS.max_tokens,
        top_p: GROQ_CONFIG.GENERATION_PARAMS.top_p,
        stream: true,
      })

      let fullResponse = ""
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        fullResponse += content
        setStreamingContent(fullResponse)
      }
      return formatResponse(fullResponse)
    } catch (error) {
      console.error("Primary model error, trying fallback:", error)
      setStreamingContent("")
      const fallbackStream = await groqClient.chat.completions.create({
        messages,
        model: GROQ_CONFIG.FALLBACK_MODEL,
        temperature: GROQ_CONFIG.GENERATION_PARAMS.temperature,
        max_tokens: GROQ_CONFIG.GENERATION_PARAMS.max_tokens,
        top_p: GROQ_CONFIG.GENERATION_PARAMS.top_p,
        stream: true,
      })

      let fallbackResponse = ""
      for await (const chunk of fallbackStream) {
        const content = chunk.choices[0]?.delta?.content || ""
        fallbackResponse += content
        setStreamingContent(fallbackResponse)
      }
      return formatResponse(fallbackResponse)
    } finally {
      setIsStreaming(false)
    }
  }

  const getSampleQuestions = (): string[] => {
    const questions: Record<string, string[]> = {
      en: [
        "Best properties to invest in Pune",
        "Show me RWA assets in Mumbai",
        "What properties are available in Bangalore?",
        "Which assets have the best returns?",
      ],
      hi: [
        "पुणे में निवेश के लिए सर्वश्रेष्ठ properties",
        "मुंबई में RWA assets दिखाएं",
        "बैंगलोर में कौन सी properties उपलब्ध हैं?",
        "किन assets में सबसे अच्छा रिटर्न है?",
      ],
      bn: [
        "পুনেতে বিনিয়োগের জন্য সেরা properties",
        "মুম্বাইতে RWA assets দেখান",
        "বেঙ্গালুরুতে কোন properties উপলব্ধ?",
        "কোন assets এর সবচেয়ে ভাল রিটার্ন আছে?",
      ],
    }
    return questions[selectedLanguage] || questions["en"]
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
    if (!isLoading) setTimeout(() => handleSendMessage(), 100)
  }

  const handleClearChat = () => setMessages([])

  // RWA purchase handlers (reused from RWAIndex)
  const handleBuyClick = (asset: Asset) => {
    console.log('🛒 [Chatbot] handleBuyClick called:', {
      hasMe: !!me,
      meId: me?.id,
      meUsername: me?.username,
      assetId: asset.assetId,
      assetName: asset.name
    });

    if (!me) {
      console.error('❌ [Chatbot] No user object found');
      alert("Please log in to purchase assets")
      return
    }

    if (!me.username) {
      console.error('❌ [Chatbot] User has no username');
      alert("Please complete your profile (username required) to purchase assets")
      return
    }

    if (!me.id) {
      console.error('❌ [Chatbot] User has no ID');
      alert("Please log in to purchase assets")
      return
    }

    console.log('✅ [Chatbot] Opening purchase modal for asset:', asset.name);
    setSelectedAsset(asset)
    setQuantity(1)
    setIsBuyModalOpen(true)
  }

  const handlePurchase = async () => {
    console.log('💳 [Chatbot] handlePurchase called:', {
      hasSelectedAsset: !!selectedAsset,
      hasMe: !!me,
      meId: me?.id,
      meUsername: me?.username,
      quantity
    });

    if (!selectedAsset) {
      console.error('❌ [Chatbot] No asset selected');
      return;
    }

    if (!me) {
      console.error('❌ [Chatbot] No user object');
      alert("Please log in to purchase assets");
      return;
    }

    if (!me.id) {
      console.error('❌ [Chatbot] User has no ID');
      alert("Please log in to purchase assets");
      return;
    }

    if (!me.username) {
      console.error('❌ [Chatbot] User has no username');
      alert("Please complete your profile to purchase assets");
      return;
    }

    setIsProcessing(true)
    try {
      // Reserve the purchase in MongoDB (exact same as RWA route)
      // Exact same flow as RWAIndex
      const reserveResponse = await fetch('/api/rwa/reserve-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: selectedAsset.assetId,
          userId: me.id,
          quantity,
        }),
      })

      const reserveData = await reserveResponse.json()

      if (!reserveData.success) {
        alert(reserveData.error || 'Failed to reserve purchase. Please try again.')
        setIsProcessing(false)
        return
      }

      console.log('✅ Purchase reserved:', reserveData.data)

      // Store purchase intent in sessionStorage for the payment page
      // Include the temp transaction hash so payment processor can update it
      sessionStorage.setItem('rwa-purchase-intent', JSON.stringify({
        assetId: selectedAsset.assetId,
        quantity,
        totalCost: selectedAsset.pricePerShare * quantity,
        pricePerShare: selectedAsset.pricePerShare,
        tempTransactionHash: reserveData.data.transactionHash,
      }))

      // Create a payment link for this RWA purchase
      // The link tag will be the assetId, which allows the payment processor to identify RWA purchases
      const paymentLink = `/${me.username}/${selectedAsset.assetId}`

      // Close modal and navigate to payment page
      // The payment page will handle creating the link if it doesn't exist
      setIsBuyModalOpen(false)
      router.push(paymentLink)
    } catch (error) {
      console.error('Error preparing purchase:', error)
      alert('Failed to prepare purchase. Please try again.')
      setIsProcessing(false)
    }
  }

  const totalCost = selectedAsset
    ? selectedAsset.pricePerShare * quantity
    : 0

  const getPlaceholderText = (): string => {
    const placeholders: Record<string, string> = {
      en: "Ask about Vault...",
      hi: "Vault के बारे में पूछें...",
      bn: "Vault সম্পর্কে জিজ্ঞাসা করুন...",
    }
    return placeholders[selectedLanguage] || placeholders["en"]
  }

  const renderStreamingText = (text: string) => {
    if (!text) return <TypingIndicator />
    return (
      <>
        <MarkdownRenderer content={text} />
        <TypingIndicator />
      </>
    )
  }

  return (
    <motion.div
      className="fixed right-4 bottom-4 z-50 sm:right-8 sm:bottom-8"
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            layout
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`rounded-2xl shadow-2xl flex flex-col w-[350px] sm:w-[400px] h-[500px] sm:h-[550px] ${isExpanded ? "md:w-[600px] md:h-[700px]" : ""
              } bg-white/95 backdrop-blur-xl border border-gray-200/50`}
            style={{ isolation: "isolate" }}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Header - Glassmorphism */}
            <motion.div
              className="flex justify-between items-center p-4 text-gray-800 bg-gray-100/80 backdrop-blur-md border-b border-gray-200/50 rounded-t-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex justify-center items-center w-10 h-10 font-bold bg-[#FF8200] rounded-full text-white text-sm">
                  S
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Agentic Trading
                  </h3>
                  <p className="text-xs text-gray-500">
                    Privacy-first payments
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={setSelectedLanguage}
                />
                <button
                  onClick={handleClearChat}
                  className="p-2 hover:bg-gray-200/60 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-gray-200/60 rounded-lg transition-colors hidden md:block text-gray-600 hover:text-gray-800"
                  aria-label={isExpanded ? "Minimize" : "Maximize"}
                >
                  {isExpanded ? (
                    <Minus className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200/60 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Messages area */}
            <div
              className="flex-1 p-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
              style={{
                scrollBehavior: "smooth",
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              {!USE_GROQ && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 text-center text-orange-700 bg-orange-100 rounded-lg mb-4"
                >
                  <p className="font-medium">API not configured</p>
                  <p className="mt-1 text-sm">
                    Add NEXT_PUBLIC_GROQ_API_KEY to enable chat.
                  </p>
                </motion.div>
              )}

              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full py-8"
                >
                  <motion.img
                    src="/assets/svgs/happy.svg"
                    alt="Happy"
                    className="w-24 h-24 mb-4"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  />
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Welcome to Vault!
                  </h4>
                  <p className="text-sm text-gray-500 text-center px-4">
                    Ask me about privacy-first payments, RWA investments, or your portfolio.
                  </p>
                </motion.div>
              )}

              <div className="space-y-4">
                {messages.map((message, index) => (
                  <React.Fragment key={index}>
                    <motion.div
                      custom={message}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      className={`flex ${message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                        }`}
                    >
                      <motion.div
                        whileHover={message.sender === "ai" && message.assets ? undefined : { scale: 1.01 }}
                        className={`${message.sender === "user"
                            ? "max-w-[85%] p-3 rounded-2xl bg-[#FF8200] text-white rounded-br-md shadow-md"
                            : message.assets && message.assets.length > 0
                              ? "w-full max-w-full"
                              : "max-w-[85%] p-3 rounded-2xl bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                          }`}
                      >
                        {index === messages.length - 1 &&
                          message.sender === "ai" &&
                          isStreaming ? (
                          renderStreamingText(streamingContent)
                        ) : message.assets && message.assets.length > 0 ? (
                          // Render both brief text and asset cards (1-2 cards) when assets are present
                          <div className="space-y-3">
                            {message.text && message.text.trim() && (
                              <div className="text-sm text-gray-700 mb-2">
                                <MarkdownRenderer content={message.text} />
                              </div>
                            )}
                            {/* Render assets in a grid (1-2 cards) */}
                            <div className={`grid gap-3 ${message.assets.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                              {message.assets.map((asset: any, assetIndex: number) => {
                                // Validate asset has required fields
                                if (!asset || !asset.assetId || !asset.name) {
                                  console.error('❌ [Chatbot] Invalid asset data:', asset);
                                  return null;
                                }

                                console.log('🎴 [Chatbot] Rendering asset card:', {
                                  assetId: asset.assetId,
                                  name: asset.name,
                                  hasDescription: !!asset.description,
                                  hasPrice: asset.pricePerShare !== undefined,
                                  hasShares: asset.availableShares !== undefined && asset.totalShares !== undefined
                                });

                                return (
                                  <div key={asset.assetId || assetIndex} className="p-2">
                                    <AssetCard
                                      asset={asset as Asset}
                                      onBuyClick={handleBuyClick}
                                      isLoading={isProcessing}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <MarkdownRenderer content={message.text} />
                        )}
                      </motion.div>
                    </motion.div>
                  </React.Fragment>
                ))}
                <AnimatePresence>
                  {isLoading && !isStreaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <LoadingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 bg-white border-t border-gray-100"
            >
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={getPlaceholderText()}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-black/20 text-sm"
                  disabled={isLoading}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex justify-center items-center px-4 py-3 font-medium text-white rounded-xl bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </form>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-row gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{ scrollbarWidth: 'thin' }}
              >
                {getSampleQuestions().map((question, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuestionClick(question)}
                    className="flex-shrink-0 text-xs bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/50 whitespace-nowrap font-medium"
                    disabled={isLoading}
                  >
                    {question}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            key="toggle-button"
            variants={toggleButtonVariants}
            onClick={() => setIsOpen(true)}
            className="p-4 text-white rounded-full shadow-lg transition-colors bg-black hover:bg-gray-800"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Buy Modal */}
      <CuteModal
        isOpen={isBuyModalOpen}
        onClose={() => {
          setIsBuyModalOpen(false)
          setSelectedAsset(null)
        }}
        title="Purchase Shares"
        size="md"
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* Asset Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-900 mb-1">
                {selectedAsset.name}
              </h3>
              <p className="text-sm text-gray-500">{selectedAsset.location}</p>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Shares
              </label>
              <div className="flex items-center gap-3">
                <CuteButton
                  variant="bordered"
                  size="md"
                  isDisabled={quantity <= 1}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </CuteButton>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {quantity}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedAsset.availableShares} available
                  </div>
                </div>
                <CuteButton
                  variant="bordered"
                  size="md"
                  isDisabled={quantity >= selectedAsset.availableShares}
                  onPress={() =>
                    setQuantity(
                      Math.min(selectedAsset.availableShares, quantity + 1)
                    )
                  }
                >
                  +
                </CuteButton>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price per Share</span>
                <span className="font-medium text-gray-900">
                  {formatUiNumber(selectedAsset.pricePerShare, "", {
                    maxDecimals: 2,
                  })}{" "}
                  APT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity</span>
                <span className="font-medium text-gray-900">{quantity}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span className="text-gray-900">Total Cost</span>
                <span className="text-primary-600">
                  {formatUiNumber(totalCost, "", { maxDecimals: 2 })} APT
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <CuteButton
                color="primary"
                variant="solid"
                size="lg"
                fullWidth
                radius="lg"
                isDisabled={quantity > selectedAsset.availableShares || isProcessing}
                isLoading={isProcessing}
                onPress={handlePurchase}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                Purchase Shares
              </CuteButton>
              <CuteButton
                variant="ghost"
                color="gray"
                size="lg"
                fullWidth
                onPress={() => setIsBuyModalOpen(false)}
              >
                Cancel
              </CuteButton>
            </div>
          </div>
        )}
      </CuteModal>
    </motion.div>
  )
}

export default ShingruChatbot
