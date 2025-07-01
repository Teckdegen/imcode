
import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, AlertTriangle, Zap, Wallet } from 'lucide-react';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatInterface = () => {
  const { isConnected } = useAccount();
  const { userProfile, messagesRemaining, canSendMessage, incrementMessageCount } = useWalletAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Load initial welcome message when wallet is connected
    if (isConnected && userProfile && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'assistant',
        content: `Welcome to ImCode Blue & Black! I'm your AI assistant specialized in Move smart contract development for the Umi Network. I can help you create tokens, NFTs, DeFi protocols, governance systems, and more. You have ${messagesRemaining} questions remaining in this session.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isConnected, userProfile, messagesRemaining, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canSendMessage || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Increment message count first
      await incrementMessageCount();

      // Call AI function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputValue,
          context: messages.slice(-4).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (!isConnected) {
    return (
      <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm flex flex-col">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-electric-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-electric-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-electric-blue-100 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-electric-blue-300/80 mb-6 max-w-sm">
                Connect your wallet to start chatting with the AI assistant and access all features of ImCode Blue & Black.
              </p>
              <ConnectButton />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-electric-blue-100 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={messagesRemaining > 2 ? "default" : messagesRemaining > 0 ? "destructive" : "secondary"}
              className={`${
                messagesRemaining > 2 
                  ? "bg-electric-blue-500/20 text-electric-blue-300 border-electric-blue-500/30" 
                  : messagesRemaining > 0 
                    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}
            >
              <Zap className="w-3 h-3 mr-1" />
              {messagesRemaining} left
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div key={message.id}>
                <div className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-electric-blue-500/20 text-electric-blue-300' 
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-electric-blue-500/20 text-electric-blue-100 border border-electric-blue-500/30'
                        : 'bg-cyber-black-300/50 text-electric-blue-200 border border-electric-blue-500/10'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-electric-blue-400/60 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                {index < messages.length - 1 && <Separator className="my-4 bg-electric-blue-500/10" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 text-green-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-lg bg-cyber-black-300/50 border border-electric-blue-500/10">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-electric-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-electric-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-electric-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t border-electric-blue-500/20 flex-shrink-0">
          {messagesRemaining <= 0 ? (
            <div className="flex items-center gap-2 text-center w-full justify-center text-red-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Daily message limit reached. Limit resets in 24 hours.</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a token, NFT, DeFi protocol, or any Move contract..."
                className="flex-1 bg-cyber-black-300/50 border-electric-blue-500/20 text-electric-blue-100 placeholder:text-electric-blue-400/60 focus:border-electric-blue-500/40 focus:ring-electric-blue-500/20"
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !canSendMessage}
                className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
