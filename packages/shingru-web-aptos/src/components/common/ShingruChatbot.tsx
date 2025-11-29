"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { aiPrompt, GROQ_CONFIG, SUPPORTED_LANGUAGES } from "@/ai/aiPrompt"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Groq from "groq-sdk"
import {
  ChevronDown,
  Maximize2,
  Minus,
  Trash2,
  X,
  Send,
  MessageCircle,
} from "lucide-react"

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

interface Message {
  text: string
  sender: "user" | "ai"
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
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                selectedLanguage === language.code
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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

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
      if (USE_GROQ && groqClient) {
        const streamPlaceholder = { text: "", sender: "ai" as const }
        setMessages((prev) => [...prev, streamPlaceholder])
        response = await handleStreamWithGroq(userMessage.text)
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].text = response
          return newMessages
        })
      } else {
        // Fallback response when API is not configured
        response =
          "I'm sorry, but the AI service is not configured. Please set up your GROQ API key in the environment variables (NEXT_PUBLIC_GROQ_API_KEY) to enable chat functionality."
        const aiMessage = { text: response, sender: "ai" as const }
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
        "What is Vault?",
        "How do stealth addresses work?",
        "How do I receive payments?",
      ],
      hi: [
        "Vault क्या है?",
        "स्टेल्थ एड्रेस कैसे काम करते हैं?",
        "मैं भुगतान कैसे प्राप्त करूं?",
      ],
      bn: [
        "Vault কি?",
        "স্টেলথ অ্যাড্রেস কিভাবে কাজ করে?",
        "আমি কিভাবে পেমেন্ট পাব?",
      ],
    }
    return questions[selectedLanguage] || questions["en"]
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
    if (!isLoading) setTimeout(() => handleSendMessage(), 100)
  }

  const handleClearChat = () => setMessages([])

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
            className={`rounded-2xl shadow-2xl flex flex-col w-[350px] sm:w-[400px] h-[500px] sm:h-[550px] ${
              isExpanded ? "md:w-[600px] md:h-[700px]" : ""
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
                    Vault Assistant
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
                    Ask me anything about privacy-first payments on Aptos.
                  </p>
                </motion.div>
              )}

              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    custom={message}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-[#FF8200] text-white rounded-br-md shadow-md"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {index === messages.length - 1 &&
                      message.sender === "ai" &&
                      isStreaming ? (
                        renderStreamingText(streamingContent)
                      ) : (
                        <MarkdownRenderer content={message.text} />
                      )}
                    </motion.div>
                  </motion.div>
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
                className="flex flex-wrap gap-2 mt-3"
              >
                {getSampleQuestions().map((question, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleQuestionClick(question)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors truncate max-w-[180px]"
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
    </motion.div>
  )
}

export default ShingruChatbot
