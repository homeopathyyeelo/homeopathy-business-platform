'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Bot, Sparkles, Send, Plus } from 'lucide-react';

interface Assistant {
  id: string;
  name: string;
  model: string;
  created_at: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>('');

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/ai/assistants');
      const data = await response.json();
      if (data.success) {
        setAssistants(data.assistants);
      }
    } catch (error) {
      console.error('Failed to load assistants:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAssistant) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistant_id: selectedAssistant,
          message: inputMessage,
          thread_id: threadId || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setThreadId(data.thread_id);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.error}`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Failed to send message. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setThreadId('');
  };

  const assistantDescriptions: Record<string, string> = {
    'erp-general': 'General ERP assistance for products, sales, and system guidance',
    'sales-forecast': 'Analyze sales trends and predict future demand',
    'prescription-advisor': 'Homeopathy remedy suggestions and dosage guidance',
    'marketing-ai': 'Create marketing campaigns and promotional content'
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="w-8 h-8 text-blue-600" />
          OpenAI Assistants
        </h1>
        <p className="text-muted-foreground mt-2">
          Specialized AI assistants for your ERP operations
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat">Chat with Assistant</TabsTrigger>
          <TabsTrigger value="manage">Manage Assistants</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assistant Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Select Assistant
                </CardTitle>
                <CardDescription>
                  Choose a specialized assistant for your task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an assistant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assistants.map((assistant) => (
                      <SelectItem key={assistant.id} value={assistant.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{assistant.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {assistantDescriptions[assistant.id]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAssistant && (
                  <div className="space-y-2">
                    <Badge variant="secondary">
                      Model: {assistants.find(a => a.id === selectedAssistant)?.model}
                    </Badge>
                    <Button onClick={startNewChat} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] border rounded-lg p-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Select an assistant and start chatting
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm">Thinking...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || !selectedAssistant || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Available Assistants</CardTitle>
              <CardDescription>
                Pre-configured assistants for different business functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assistants.map((assistant) => (
                  <Card key={assistant.id} className="border-l-4 border-l-blue-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{assistant.name}</CardTitle>
                      <Badge variant="outline">{assistant.model}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {assistantDescriptions[assistant.id]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(assistant.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
