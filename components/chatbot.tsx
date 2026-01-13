'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, X, User, ShieldCheck, Settings } from 'lucide-react'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')

  // Initial Intent Discovery Greeting from Proposal 
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          role: 'bot', 
          content: "Hello! Welcome to Monika Order & Suppliers. Are you looking for security products (Retail), technical support, or interested in our B2B dealer program?" 
        }
      ])
    }
  }, [isOpen])

  const handleOptionClick = (intent: string) => {
    let response = "";
    if (intent === 'B2B') {
      response = "We’re excited to grow our network! To see wholesale pricing, please provide your Business Name and GST/Trade License number. Would you like to start registration?"; // 
    } else if (intent === 'Support') {
      response = "I understand you need technical help. Is your camera offline, or do you need to register a new service complaint?"; // 
    } else {
      response = "Great! You can browse our retail products on the landing page. Do you need a specific quotation today?"; // 
    }
    
    setMessages(prev => [...prev, 
      { role: 'user', content: intent },
      { role: 'bot', content: response }
    ]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} className="rounded-full w-14 h-14 shadow-xl bg-blue-600 hover:bg-blue-700">
          <MessageCircle className="text-white" />
        </Button>
      ) : (
        <Card className="w-80 md:w-96 shadow-2xl border-none">
          <CardHeader className="bg-blue-600 text-white flex flex-row items-center justify-between p-4 rounded-t-lg">
            <CardTitle className="text-sm font-bold">Safety Zone Assistant</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-500">
              <X size={18} />
            </Button>
          </CardHeader>
          <CardContent className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            
            {/* Quick Intent Buttons [cite: 71, 72] */}
            {messages.length === 1 && (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleOptionClick('Retail/B2C')} className="justify-start text-xs">
                  <User className="mr-2 w-3 h-3" /> Browse Products (Retail)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOptionClick('B2B')} className="justify-start text-xs">
                  <ShieldCheck className="mr-2 w-3 h-3" /> Dealer/B2B Program
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOptionClick('Support')} className="justify-start text-xs">
                  <Settings className="mr-2 w-3 h-3" /> Technical Support
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t bg-white">
            <div className="flex w-full gap-2">
              <Input 
                placeholder="Type your message..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-xs"
              />
              <Button size="icon" className="h-9 w-9 bg-blue-600">
                <Send size={16} />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}