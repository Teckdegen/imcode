
import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, AlertTriangle, Zap, Wallet, Loader2, Code, FileText } from 'lucide-react';
import { useWalletAuth } from '@/contexts/WalletAuthContext';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { useAICode } from '@/contexts/AICodeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  onAIInteraction?: () => void;
}

const ChatInterface = ({ onAIInteraction }: ChatInterfaceProps) => {
  const { isConnected } = useAccount();
  const { userProfile, messagesRemaining, canSendMessage, incrementMessageCount, isLoading } = useWalletAuth();
  const { messages, addMessage } = useChatHistory();
  const { addFileFromAI } = useAICode();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Load initial welcome message when wallet is connected and profile is loaded
    if (isConnected && userProfile && !isLoading && messages.length === 0) {
      addMessage({
        type: 'assistant',
        content: `Welcome to ImCode Blue & Black! I'm your AI assistant specialized in Move smart contract development for the Umi Network. I can help you create tokens, NFTs, DeFi protocols, governance systems, and more. You have ${messagesRemaining} questions remaining in this session.

When I generate code, it will automatically be added to your editor with files created for you. Start by telling me what kind of smart contract you'd like to create!`,
      });
    }
  }, [isConnected, userProfile, messagesRemaining, messages.length, isLoading, addMessage]);

  const extractCodeFromResponse = (response: string) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      const language = match[1] || 'move';
      const code = match[2];
      codeBlocks.push({ language, code });
    }
    
    return codeBlocks;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canSendMessage || isSending) return;

    addMessage({
      type: 'user',
      content: inputValue,
    });

    const currentInput = inputValue;
    setInputValue('');
    setIsSending(true);

    // Trigger the AI interaction callback
    if (onAIInteraction) {
      onAIInteraction();
    }

    try {
      // Increment message count first
      await incrementMessageCount();

      // Call AI function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: currentInput,
          context: messages.slice(-4).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data.response;
      
      // Extract code blocks from the response
      const codeBlocks = extractCodeFromResponse(aiResponse);
      
      // Add files to editor if code blocks are found
      if (codeBlocks.length > 0) {
        codeBlocks.forEach((block, index) => {
          const fileName = block.language === 'move' 
            ? `contract_${Date.now()}_${index}.move`
            : `file_${Date.now()}_${index}.${block.language}`;
          
          addFileFromAI(fileName, block.code, block.language);
        });

        toast({
          title: "Code Generated",
          description: `${codeBlocks.length} file(s) have been added to your editor`,
        });
      }

      addMessage({
        type: 'assistant',
        content: aiResponse,
        codeGenerated: codeBlocks.length > 0,
        fileName: codeBlocks.length > 0 ? `${codeBlocks.length} file(s) created` : undefined
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
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

  // Show loading state while profile is being fetched
  if (isLoading) {
    return (
      <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm flex flex-col">
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-electric-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-electric-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-electric-blue-100 mb-2">
                Loading Your Profile
              </h3>
              <p className="text-electric-blue-300/80">
                Setting up your AI assistant session...
              </p>
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
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.codeGenerated && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <Code className="w-3 h-3" />
                            <span>Code added to editor</span>
                          </div>
                        )}
                      </div>
                      {message.fileName && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-electric-blue-400">
                          <FileText className="w-3 h-3" />
                          <span>{message.fileName}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-electric-blue-400/60 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
                {index < messages.length - 1 && <Separator className="my-4 bg-electric-blue-500/10" />}
              </div>
            ))}
            {isSending && (
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
                disabled={isSending}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isSending || !canSendMessage}
                className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white px-4"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
