"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! 👋 Welcome to Cygnatrix IT Solutions. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()

    // Greetings
    if (/(hello|hi|hey|good morning|good afternoon|good evening)/.test(lowerMessage)) {
      return "Hello! How can I assist you today? You can ask about our company, services, team, or how to contact us."
    }

    // Company info
    if (/(cygnatrix|about your company|who are you|what is cygnatrix|company info|company information|about you)/.test(lowerMessage)) {
      return "Cygnatrix IT Solutions is a leading provider of digital solutions, specializing in web and mobile development, UI/UX design, cloud, and AI automation. Our mission is to empower businesses with smart, scalable, and innovative technology. Would you like to know about our services, team, or portfolio?"
    }

    // Mission & vision
    if (/(mission|vision|goal|values)/.test(lowerMessage)) {
      return "Our mission is to build smart digital solutions for the future, helping startups and enterprises grow with technology. We value innovation, quality, and customer success."
    }

    // Services
    if (/(service|what do you do|offer|solutions|provide|expertise)/.test(lowerMessage)) {
      return "We offer the following services:\n\n• Web Development\n• Mobile App Development\n• UI/UX Design\n• Cloud Solutions\n• AI Automation\n• Maintenance & Support\n\nType the service name to learn more!"
    }
    if (/web( |-)development|website/.test(lowerMessage)) {
      return "Our web development team builds modern, responsive websites and web apps using the latest technologies. We focus on performance, security, and user experience. See our Portfolio page for examples."
    }
    if (/(mobile|app|android|ios)/.test(lowerMessage)) {
      return "We develop native and cross-platform mobile apps for iOS and Android, delivering seamless experiences and robust performance. Want to discuss your app idea?"
    }
    if (/(ui|ux|design|user interface|user experience)/.test(lowerMessage)) {
      return "Our UI/UX design experts create intuitive, engaging interfaces that drive user satisfaction and business results. We can help with branding, prototyping, and design systems."
    }
    if (/(cloud|cloud solutions|cloud services)/.test(lowerMessage)) {
      return "We provide secure, scalable cloud solutions for businesses of all sizes, including cloud migration, DevOps, and managed hosting."
    }
    if (/(ai|automation|artificial intelligence|machine learning)/.test(lowerMessage)) {
      return "We help automate business processes with AI and machine learning, from chatbots to intelligent analytics."
    }
    if (/(maintenance|support|after sales|after-sales)/.test(lowerMessage)) {
      return "We offer ongoing maintenance and support to keep your digital products running smoothly and securely."
    }

    // Portfolio
    if (/(portfolio|work|projects|case studies|examples)/.test(lowerMessage)) {
      return "You can view our portfolio and case studies on the Portfolio page to see examples of our work."
    }

    // Team
    if (/(team|who works|staff|developers|designers|experts)/.test(lowerMessage)) {
      return "Our team consists of experienced developers, designers, and cloud/AI specialists dedicated to delivering top-quality solutions. Learn more on our About page."
    }

    // Contact
    if (/(contact|phone|call|email|reach|whatsapp|how to contact|get in touch)/.test(lowerMessage)) {
      return "You can reach us at +91 89278 91273, use the WhatsApp button, or visit our Contact page for more options."
    }

    // Pricing
    if (/(price|cost|quote|estimate|how much|charges|pricing)/.test(lowerMessage)) {
      return "Our pricing depends on your project requirements. Please contact us at +91 89278 91273 or use the Contact page for a personalized quote."
    }

    // Thanks & closing
    if (/(thank|thanks|thank you)/.test(lowerMessage)) {
      return "You're welcome! If you have more questions, just ask. 😊"
    }
    if (/(bye|goodbye|see you|later)/.test(lowerMessage)) {
      return "Goodbye! Have a great day. Feel free to come back anytime! 👋"
    }

    // Default fallback
    return "I'm here to help you with information about Cygnatrix IT Solutions, our services, team, and more. Please ask about our company, services, or how to contact us!"
  }

  const handleSend = () => {
    if (inputValue.trim() === "") return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-32 right-6 z-50 w-96 max-h-[calc(100vh-150px)] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="gradient-bg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#0EA5E9]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Cygnatrix AI</h3>
                <p className="text-white/80 text-xs">Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === "user"
                      ? "bg-[#0EA5E9] text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user" ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSend} size="icon" className="gradient-bg shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 gradient-bg text-white rounded-full shadow-lg hover:scale-110 transition-all duration-300 group"
        aria-label="Open chatbot"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          Chat with AI
        </span>
      </button>
    </>
  )
}
