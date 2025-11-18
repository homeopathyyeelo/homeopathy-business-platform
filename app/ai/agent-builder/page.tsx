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
import { MessageCircle, Bot, Sparkles, Send, Plus, Settings, Play, Trash2 } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  goal: string;
  model: string;
  tools: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AgentBuilderPage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      const response = await fetch('/api/ai/agents');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to load agent data:', error);
    }
  };

  const createAgent = async () => {
    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          agent_type: selectedTemplate || undefined,
          custom_config: selectedTemplate ? undefined : {
            name: customName,
            role: customRole,
            goal: customGoal,
            tools: [],
            model: 'gpt-4o-mini'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadAgentData();
        setSelectedAgent(data.agent.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const chatWithAgent = async () => {
    if (!inputMessage.trim() || !selectedAgent) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          agent_id: selectedAgent,
          message: inputMessage
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

  const deleteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/ai/agents?agent_id=${agentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await loadAgentData();
        if (selectedAgent === agentId) {
          setSelectedAgent('');
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-purple-600" />
          AI Agent Builder
        </h1>
        <p className="text-muted-foreground mt-2">
          Create custom AI agents for specific business workflows
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Agent</TabsTrigger>
          <TabsTrigger value="test">Test Agents</TabsTrigger>
          <TabsTrigger value="manage">Manage Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Choose Template
                </CardTitle>
                <CardDescription>
                  Start with a pre-configured agent template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {template.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTemplate && (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <h4 className="font-medium">
                      {templates.find(t => t.id === selectedTemplate)?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.goal}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {templates.find(t => t.id === selectedTemplate)?.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={createAgent}
                  disabled={!selectedTemplate}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent from Template
                </Button>
              </CardContent>
            </Card>

            {/* Custom Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Custom Agent
                </CardTitle>
                <CardDescription>
                  Create a custom agent with specific instructions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Agent name..."
                />
                <Input
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Agent role..."
                />
                <Textarea
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Agent goal and instructions..."
                  rows={4}
                />

                <Button
                  onClick={createAgent}
                  disabled={!customName || !customRole || !customGoal}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Agent</CardTitle>
                <CardDescription>Choose an agent to test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {agent.role}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAgent && (
                  <div className="space-y-2">
                    <Badge variant="secondary">
                      Status: {agents.find(a => a.id === selectedAgent)?.status}
                    </Badge>
                    <Button
                      onClick={() => setMessages([])}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Interface */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Test Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] border rounded-lg p-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Select an agent and start testing
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
                                ? 'bg-purple-600 text-white'
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
                            <p className="text-sm">Processing...</p>
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
                    placeholder="Test your agent..."
                    className="flex-1"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        chatWithAgent();
                      }
                    }}
                  />
                  <Button
                    onClick={chatWithAgent}
                    disabled={!inputMessage.trim() || !selectedAgent || isLoading}
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
              <CardTitle>Created Agents</CardTitle>
              <CardDescription>
                Manage your custom AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Card key={agent.id} className="border-l-4 border-l-purple-600">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAgent(agent.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Badge variant="outline">{agent.role}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        Status: {agent.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setMessages([]);
                        }}
                      >
                        Test Agent
                      </Button>
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
