import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, User, Bot, Loader2, Phone, HelpCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  cached?: boolean;
}

interface FaqResponse {
  answer: string;
  cached: boolean;
}

const FAQ_SUGGESTIONS = [
  "What's the difference between OLED and QLED TVs?",
  "Do I need a soundbar if my TV has built-in speakers?",
  "How do I set up RTÉ Player on my smart TV?",
  "What wall mount do I need for my TV size?",
  "How much does TV installation cost?",
];

export default function AIHelpWidget() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hi! I'm here to help with questions about TV installation, electronics, and streaming services. Ask me anything or choose from the suggestions below!",
      timestamp: new Date()
    }
  ]);
  const { toast } = useToast();

  // Fetch popular questions for dynamic suggestions
  const { data: popularQuestions } = useQuery({
    queryKey: ['/api/faq/popular'],
    select: (data: any[]) => data.slice(0, 3) // Limit to top 3
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: async (questionText: string): Promise<FaqResponse> => {
      const response = await apiRequest("POST", "/api/faq/ask", { question: questionText });
      return await response.json() as FaqResponse;
    },
    onSuccess: (response, questionText) => {
      const botMessage: Message = {
        id: Date.now().toString() + '_bot',
        sender: 'bot',
        text: response.answer,
        timestamp: new Date(),
        cached: response.cached
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error: any) => {
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        sender: 'bot',
        text: error.message || 'Sorry, I encountered an error. Please try again or contact our support team.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to get answer. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAskQuestion = (questionText: string) => {
    if (!questionText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString() + '_user',
      sender: 'user',
      text: questionText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setQuestion('');
    
    // Ask the question
    askQuestionMutation.mutate(questionText);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAskQuestion(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAskQuestion(question);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Card className="w-full h-full flex flex-col overflow-hidden border-0 shadow-none">
        <CardHeader className="pb-2 sm:pb-3 px-2 sm:px-4 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MessageCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="truncate">AI Help Assistant</span>
          </CardTitle>
          <p className="text-xs text-gray-600 hidden sm:block">
            Get instant answers about TV installation, electronics, and streaming services
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-2 sm:gap-3 px-2 sm:px-4 min-h-0 pb-2 sm:pb-4">
          {/* FAQ Suggestions */}
          <div className="space-y-2 flex-shrink-0">
            <p className="text-xs sm:text-sm font-medium text-gray-700">Quick Questions:</p>
            <div className="flex flex-col gap-1 sm:gap-2">
              {FAQ_SUGGESTIONS.slice(0, 2).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-7 sm:h-8 px-2 text-left justify-start w-full"
                  disabled={askQuestionMutation.isPending}
                  title={suggestion}
                >
                  <HelpCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Chat Messages */}
          <ScrollArea className="flex-1 pr-1 sm:pr-4 min-h-0">
            <div className="space-y-3 sm:space-y-4 px-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {message.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>
                  <div className={`flex-1 min-w-0 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 sm:p-3 rounded-lg max-w-[90%] sm:max-w-[85%] ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                      {message.cached && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Instant answer
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Loading message */}
              {askQuestionMutation.isPending && (
                <div className="flex gap-2 px-1">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Bot className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-2 sm:p-3 rounded-lg bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs sm:text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 flex-shrink-0">
            <Textarea
              placeholder="Ask about TV installation, electronics, or streaming services..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[50px] sm:min-h-[60px] resize-none text-sm"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={askQuestionMutation.isPending}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!question.trim() || askQuestionMutation.isPending}
                size="sm"
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                {askQuestionMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                    Asking...
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Ask
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Contact Sales */}
          <div className="text-center p-2 bg-gray-50 rounded-lg flex-shrink-0">
            <p className="text-xs text-gray-600 mb-1">Need personalized help?</p>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.href = "/consultation-booking"}
              className="bg-green-600 hover:bg-green-700 h-7 sm:h-8 text-xs"
            >
              <Phone className="h-3 w-3 mr-1" />
              Book Consultation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}