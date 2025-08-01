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
      return response as FaqResponse;
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
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span className="truncate">AI Help Assistant</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Get instant answers about TV installation, electronics, and streaming services
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 px-4 sm:px-6">
        {/* FAQ Suggestions */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Quick Questions:</p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            {FAQ_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs h-8 px-2 sm:px-3 text-left justify-start truncate w-full sm:w-auto sm:max-w-[200px]"
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
        <ScrollArea className="flex-1 pr-2 sm:pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {message.sender === 'user' ? <User className="h-3 w-3 sm:h-4 sm:w-4" /> : <Bot className="h-3 w-3 sm:h-4 sm:w-4" />}
                </div>
                <div className={`flex-1 min-w-0 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    {message.cached && (
                      <Badge variant="secondary" className="mt-1 sm:mt-2 text-xs">
                        Instant answer
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Loading message */}
            {askQuestionMutation.isPending && (
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-2 sm:p-3 rounded-lg bg-gray-100">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="text-xs sm:text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Ask about TV installation, electronics, or streaming services..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/how-it-works"}
              className="text-xs"
            >
              <Phone className="h-3 w-3 mr-1" />
              Contact Support
            </Button>
            <Button
              type="submit"
              disabled={!question.trim() || askQuestionMutation.isPending}
              size="sm"
            >
              {askQuestionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Ask
            </Button>
          </div>
        </form>

        {/* Contact Sales */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Need personalized help?</p>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.location.href = "/booking"}
            className="bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-4 w-4 mr-2" />
            Book Installation Service
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}