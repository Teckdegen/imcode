import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, AlertTriangle, Zap, Wallet, Loader2, Code, FileText, Edit, RefreshCw } from 'lucide-react';
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
  const { 
    files, 
    addFileFromAI, 
    updateFile, 
    editFileByName, 
    findFileByName,
    preventDuplicateFiles,
    getUniqueFileName 
  } = useAICode();
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
    // Load enhanced welcome message when wallet is connected
    if (isConnected && userProfile && !isLoading && messages.length === 0) {
      addMessage({
        type: 'assistant',
        content: `🚀 Welcome to ImCode Blue & Black AI Assistant! I'm your specialized Move smart contract development companion for the Umi Network.

✨ **ENHANCED CAPABILITIES:**

🔧 **Advanced File Management:**
• **Edit specific files**: Use commands like "edit Token.move" or "modify deploy.js"
• **File referencing**: Use @filename (e.g., "@Token.move") to reference existing files in your messages
• **Duplicate prevention**: I automatically prevent creating files with identical names
• **Smart organization**: Files are auto-organized into proper folder structures

📁 **Comprehensive Project Generation:**
• **Complete project structures** with 5-15+ files including contracts/, scripts/, tests/, config/, utils/, types/
• **Production-ready code** with extensive error handling, validation, and documentation
• **Multiple file types**: .move contracts, .js/.ts scripts, .json configs, .toml files, README.md docs

🎯 **Smart File Operations:**
• **Intelligent file finding**: I can locate files by partial names, paths, or content
• **Content-aware organization**: Files placed in appropriate directories based on their purpose
• **Version-safe editing**: Existing functionality preserved when modifying files

💡 **Usage Examples:**
• "Create a comprehensive DeFi liquidity pool project"
• "Edit Token.move and add burn functionality"
• "Look at @deploy.js and create a similar script for NFT deployment"
• "Modify the governance contract in @contracts/governance/"

You have **${messagesRemaining} questions** remaining in this session. Each interaction generates complete, enterprise-level code structures!

What kind of Move smart contract project would you like to create or modify today?`,
      });
    }
  }, [isConnected, userProfile, messagesRemaining, messages.length, isLoading, addMessage]);

  // Enhanced command detection with more patterns
  const detectEditCommand = (message: string) => {
    const editPatterns = [
      /(?:edit|modify|update|change)\s+([^\s]+)/i,
      /(?:fix|repair|adjust)\s+([^\s]+)/i,
      /(?:add\s+to|append\s+to|extend)\s+([^\s]+)/i,
      /(?:refactor|improve)\s+([^\s]+)/i
    ];
    
    for (const pattern of editPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Enhanced file reference detection
  const detectFileReferences = (message: string) => {
    const fileRefs = message.match(/@[\w\-\.\/]+/g) || [];
    return fileRefs.map(ref => ref.substring(1)); // Remove @ symbol
  };

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

  const removeCodeBlocksFromText = (text: string) => {
    return text.replace(/```(\w+)?\n[\s\S]*?```/g, '').trim();
  };

  // Enhanced file name generation with better categorization
  const generateFileName = (code: string, language: string, index: number) => {
    const lowerCode = code.toLowerCase();
    
    // Configuration files
    if (code.includes('module.exports') && lowerCode.includes('hardhat')) {
      return getUniqueFileName('hardhat.config.js');
    }
    if (lowerCode.includes('hardhat run') && lowerCode.includes('deploy')) {
      return getUniqueFileName('scripts/deploy.js');
    }
    if (code.includes('"scripts"') && code.includes('"hardhat"')) {
      return getUniqueFileName('package.json');
    }
    if (code.includes('[dependencies]') || code.includes('[package]')) {
      return getUniqueFileName('config/Move.toml');
    }

    // Smart Move contract naming
    if (language === 'move' || lowerCode.includes('module')) {
      if (lowerCode.includes('struct token') || lowerCode.includes('token_')) {
        if (lowerCode.includes('erc20') || lowerCode.includes('fungible')) {
          return getUniqueFileName('contracts/tokens/FungibleToken.move');
        }
        return getUniqueFileName('contracts/tokens/Token.move');
      }
      if (lowerCode.includes('struct nft') || lowerCode.includes('nft_')) {
        return getUniqueFileName('contracts/nft/NFTCollection.move');
      }
      if (lowerCode.includes('liquidity') || lowerCode.includes('pool') || lowerCode.includes('defi')) {
        return getUniqueFileName('contracts/defi/LiquidityPool.move');
      }
      if (lowerCode.includes('governance') || lowerCode.includes('dao') || lowerCode.includes('proposal')) {
        return getUniqueFileName('contracts/governance/DAO.move');
      }
      if (lowerCode.includes('event') || lowerCode.includes('emit')) {
        return getUniqueFileName('contracts/events/TokenEvents.move');
      }
      if (lowerCode.includes('config') || lowerCode.includes('admin')) {
        return getUniqueFileName('contracts/admin/AdminConfig.move');
      }
      return getUniqueFileName(`contracts/Contract_${index + 1}.move`);
    }

    // Test files
    if (lowerCode.includes('test') || lowerCode.includes('#[test]') || language === 'test') {
      return getUniqueFileName(`tests/test_${index + 1}.${language === 'move' ? 'move' : 'js'}`);
    }

    // Script categorization
    if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      if (lowerCode.includes('deploy') || lowerCode.includes('deployment')) {
        return getUniqueFileName('scripts/deployment/deploy.js');
      }
      if (lowerCode.includes('interact') || lowerCode.includes('interaction')) {
        return getUniqueFileName('scripts/interaction/interact.js');
      }
      if (lowerCode.includes('mint') || lowerCode.includes('transfer')) {
        return getUniqueFileName('scripts/interaction/tokenActions.js');
      }
      return getUniqueFileName(`scripts/script_${index + 1}.js`);
    }

    // Documentation
    if (language === 'markdown' || language === 'md') {
      if (lowerCode.includes('readme') || lowerCode.includes('# ')) {
        return getUniqueFileName('README.md');
      }
      return getUniqueFileName(`docs/documentation_${index + 1}.md`);
    }

    return getUniqueFileName(`${language || 'misc'}/file_${index + 1}.${language || 'txt'}`);
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

    // Enhanced command detection
    const editFileName = detectEditCommand(currentInput);
    const fileReferences = detectFileReferences(currentInput);
    let targetFile = null;
    
    if (editFileName) {
      targetFile = findFileByName(editFileName);
      if (!targetFile) {
        toast({
          title: "File Not Found",
          description: `Could not find file: ${editFileName}. Available files: ${files.map(f => f.name).join(', ')}`,
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
    }

    // Validate file references
    const invalidRefs = fileReferences.filter(ref => !findFileByName(ref));
    if (invalidRefs.length > 0) {
      toast({
        title: "Referenced Files Not Found",
        description: `Cannot find: ${invalidRefs.join(', ')}. Available files: ${files.map(f => f.name).join(', ')}`,
        variant: "destructive"
      });
    }

    // Trigger AI interaction callback
    if (onAIInteraction) {
      onAIInteraction();
    }

    try {
      // Increment message count
      await incrementMessageCount();

      // Prepare comprehensive file context
      const fileContext = files.map(file => ({
        name: file.name,
        content: file.content || '',
        type: file.type,
        size: (file.content || '').length
      }));

      console.log('Sending message with enhanced context:', {
        message: currentInput,
        editTarget: editFileName,
        references: fileReferences,
        availableFiles: files.length
      });

      // Call AI function with enhanced context
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: currentInput,
          context: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          files: fileContext
        }
      });

      if (error) {
        throw error;
      }

      const aiResponse = data.response;
      
      // Extract and process code blocks
      const codeBlocks = extractCodeFromResponse(aiResponse);
      
      let operationSummary = '';
      
      if (codeBlocks.length > 0) {
        if (editFileName && targetFile) {
          // File editing mode
          if (codeBlocks.length === 1) {
            updateFile(targetFile.id, codeBlocks[0].code);
            operationSummary = `Updated: ${targetFile.name}`;
            toast({
              title: "File Updated Successfully",
              description: `${targetFile.name} has been modified with new functionality`,
            });
          } else {
            // Update target + create additional files
            updateFile(targetFile.id, codeBlocks[0].code);
            
            codeBlocks.slice(1).forEach((block, index) => {
              const fileName = generateFileName(block.code, block.language, index + 1);
              addFileFromAI(fileName, block.code, block.language);
            });

            operationSummary = `Updated: ${targetFile.name} + ${codeBlocks.length - 1} new files`;
            toast({
              title: "Files Updated & Created",
              description: `Modified ${targetFile.name} and created ${codeBlocks.length - 1} additional files`,
            });
          }
        } else {
          // Project generation mode
          codeBlocks.forEach((block, index) => {
            const fileName = generateFileName(block.code, block.language, index);
            addFileFromAI(fileName, block.code, block.language);
          });

          operationSummary = `Complete project: ${codeBlocks.length} files`;
          toast({
            title: "Comprehensive Project Generated",
            description: `Created ${codeBlocks.length} files with professional folder structure and extensive functionality`,
          });
        }
      }

      // Add clean response to chat
      const cleanResponse = removeCodeBlocksFromText(aiResponse);
      
      addMessage({
        type: 'assistant',
        content: cleanResponse,
        codeGenerated: codeBlocks.length > 0,
        fileName: operationSummary || undefined
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Communication Error",
        description: "Failed to process your request. Please try again.",
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
                Connect your wallet to access the enhanced AI assistant with advanced file management capabilities.
              </p>
              <ConnectButton />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                Loading Enhanced AI Assistant
              </h3>
              <p className="text-electric-blue-300/80">
                Setting up advanced file management and comprehensive code generation...
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
            Enhanced AI Assistant
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
        <div className="mt-2 p-3 bg-gradient-to-r from-electric-blue-500/10 to-green-500/10 border border-electric-blue-500/20 rounded-lg">
          <div className="text-xs text-electric-blue-300 space-y-1">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              <strong>Advanced Features:</strong>
            </div>
            <div className="ml-5 space-y-1">
              <div>• <strong>File Editing:</strong> "edit filename.ext" to modify existing files</div>
              <div>• <strong>File References:</strong> "@filename" to reference files in your message</div>
              <div>• <strong>Smart Organization:</strong> Auto-organized folder structures</div>
              <div>• <strong>Comprehensive Projects:</strong> 5-15+ files with full implementations</div>
            </div>
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
                            {message.fileName?.includes('Updated:') ? <Edit className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                            <span>{message.fileName?.includes('Updated:') ? 'Modified' : 'Generated'}</span>
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
                placeholder="Create comprehensive projects, edit files (e.g., 'edit Token.move'), reference files (@filename), or ask for specific modifications..."
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
