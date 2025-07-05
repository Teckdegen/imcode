import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, AlertTriangle, Zap, Wallet, Loader2, Code, FileText, Edit, RefreshCw, Shield } from 'lucide-react';
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
    // Much cleaner welcome message
    if (isConnected && userProfile && !isLoading && messages.length === 0) {
      addMessage({
        type: 'assistant',
        content: `🚀 Welcome to ImCode Blue & Black AI Assistant!

I'm specialized in creating comprehensive Move smart contracts for Umi Network with:
• **Strict file management** - No duplicates, no empty files
• **Smart editing** - Use "edit filename.move" to modify existing files  
• **File references** - Reference files with "@filename" in your messages
• **Comprehensive code** - Every file contains 200+ lines of production-ready code
• **Persistent storage** - Your work saves automatically and persists across reloads

You have **${messagesRemaining} questions** remaining.

What Move smart contract ecosystem would you like me to create?`,
      });
    }
  }, [isConnected, userProfile, messagesRemaining, messages.length, isLoading, addMessage]);

  const detectEditCommand = (message: string) => {
    const editPatterns = [
      /(?:edit|modify|update|change)\s+([^\s]+)/i,
      /(?:fix|repair|adjust)\s+([^\s]+)/i,
      /(?:add\s+to|append\s+to|extend)\s+([^\s]+)/i,
      /(?:refactor|improve|enhance)\s+([^\s]+)/i,
      /(?:work\s+on|update)\s+([^\s]+)/i
    ];
    
    for (const pattern of editPatterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const detectFileReferences = (message: string) => {
    const fileRefs = message.match(/@[\w\-\.\/]+/g) || [];
    return fileRefs.map(ref => ref.substring(1));
  };

  const extractCodeFromResponse = (response: string) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(response)) !== null) {
      const language = match[1] || 'move';
      const code = match[2];
      
      // STRICT: Reject any Rust code
      if (language.toLowerCase() === 'rust' || language.toLowerCase() === 'rs') {
        console.warn('Rust code detected and rejected:', code.substring(0, 100));
        continue;
      }
      
      // STRICT: Reject empty or minimal code blocks
      if (!code || code.trim().length < 50) {
        console.warn('Empty or minimal code block rejected:', code);
        continue;
      }
      
      codeBlocks.push({ language, code });
    }
    
    return codeBlocks;
  };

  const removeCodeBlocksFromText = (text: string) => {
    return text.replace(/```(\w+)?\n[\s\S]*?```/g, '').trim();
  };

  // Enhanced file name generation with better categorization and uniqueness
  const generateFileName = (code: string, language: string, index: number) => {
    const lowerCode = code.toLowerCase();
    
    // STRICT: Reject Rust files
    if (language.toLowerCase() === 'rust' || language.toLowerCase() === 'rs') {
      return null;
    }
    
    // STRICT: Reject if code is too short (empty file prevention)
    if (!code || code.trim().length < 50) {
      console.warn('Code too short for file generation:', code.substring(0, 30));
      return null;
    }
    
    // Configuration files with better organization
    if (code.includes('module.exports') && lowerCode.includes('hardhat')) {
      return getUniqueFileName('config/hardhat.config.js');
    }
    if (lowerCode.includes('hardhat run') && lowerCode.includes('deploy')) {
      return getUniqueFileName('scripts/deployment/deploy_main.js');
    }
    if (code.includes('"scripts"') && code.includes('"hardhat"')) {
      return getUniqueFileName('package.json');
    }
    if (code.includes('[dependencies]') || code.includes('[package]')) {
      return getUniqueFileName('config/Move.toml');
    }

    // Enhanced Move contract naming with better categorization
    if (language === 'move' || lowerCode.includes('module')) {
      // Core protocol contracts
      if (lowerCode.includes('core') || lowerCode.includes('main')) {
        return getUniqueFileName('contracts/core/CoreProtocol.move');
      }
      
      // Token contracts with detailed categorization
      if (lowerCode.includes('struct token') || lowerCode.includes('token_')) {
        if (lowerCode.includes('erc20') || lowerCode.includes('fungible')) {
          return getUniqueFileName('contracts/tokens/fungible/FungibleToken.move');
        }
        if (lowerCode.includes('staking') || lowerCode.includes('stake')) {
          return getUniqueFileName('contracts/tokens/TokenStaking.move');
        }
        if (lowerCode.includes('reward') || lowerCode.includes('incentive')) {
          return getUniqueFileName('contracts/tokens/RewardToken.move');
        }
        return getUniqueFileName('contracts/tokens/Token.move');
      }
      
      // NFT with subcategories
      if (lowerCode.includes('struct nft') || lowerCode.includes('nft_')) {
        if (lowerCode.includes('marketplace')) {
          return getUniqueFileName('contracts/nft/marketplace/NFTMarketplace.move');
        }
        if (lowerCode.includes('collection')) {
          return getUniqueFileName('contracts/nft/collections/NFTCollection.move');
        }
        return getUniqueFileName('contracts/nft/NFTCore.move');
      }
      
      // DeFi with detailed subcategories
      if (lowerCode.includes('liquidity') || lowerCode.includes('pool') || lowerCode.includes('defi')) {
        if (lowerCode.includes('liquidity')) {
          return getUniqueFileName('contracts/defi/liquidity/LiquidityPool.move');
        }
        if (lowerCode.includes('swap') || lowerCode.includes('exchange')) {
          return getUniqueFileName('contracts/defi/exchange/SwapEngine.move');
        }
        if (lowerCode.includes('lending') || lowerCode.includes('borrow')) {
          return getUniqueFileName('contracts/defi/lending/LendingProtocol.move');
        }
        if (lowerCode.includes('farm') || lowerCode.includes('yield')) {
          return getUniqueFileName('contracts/defi/farming/YieldFarm.move');
        }
        return getUniqueFileName('contracts/defi/DeFiCore.move');
      }
      
      // Governance with subcategories
      if (lowerCode.includes('governance') || lowerCode.includes('dao') || lowerCode.includes('proposal')) {
        if (lowerCode.includes('voting')) {
          return getUniqueFileName('contracts/governance/VotingMechanism.move');
        }
        if (lowerCode.includes('treasury')) {
          return getUniqueFileName('contracts/governance/Treasury.move');
        }
        return getUniqueFileName('contracts/governance/DAO.move');
      }
      
      // Utility and access control
      if (lowerCode.includes('access') || lowerCode.includes('role') || lowerCode.includes('permission')) {
        return getUniqueFileName('contracts/access/AccessControl.move');
      }
      
      if (lowerCode.includes('util') || lowerCode.includes('helper') || lowerCode.includes('library')) {
        return getUniqueFileName('contracts/utils/Utilities.move');
      }
      
      return getUniqueFileName(`contracts/core/Contract_${index + 1}.move`);
    }

    // Test files with better organization
    if (lowerCode.includes('test') || lowerCode.includes('#[test]') || language === 'test') {
      if (lowerCode.includes('integration')) {
        return getUniqueFileName(`tests/integration/integration_test_${index + 1}.${language === 'move' ? 'move' : 'js'}`);
      }
      return getUniqueFileName(`tests/unit/unit_test_${index + 1}.${language === 'move' ? 'move' : 'js'}`);
    }

    // Enhanced script categorization
    if (language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      if (lowerCode.includes('deploy') || lowerCode.includes('deployment')) {
        if (lowerCode.includes('mainnet')) {
          return getUniqueFileName('scripts/deployment/mainnet/deploy.js');
        }
        if (lowerCode.includes('testnet')) {
          return getUniqueFileName('scripts/deployment/testnet/deploy.js');
        }
        return getUniqueFileName('scripts/deployment/deploy.js');
      }
      
      if (lowerCode.includes('interact') || lowerCode.includes('interaction')) {
        return getUniqueFileName('scripts/interaction/interact.js');
      }
      
      if (lowerCode.includes('config') || lowerCode.includes('setup')) {
        return getUniqueFileName('config/setup.js');
      }
      
      return getUniqueFileName(`scripts/script_${index + 1}.js`);
    }

    // Documentation with categories
    if (language === 'markdown' || language === 'md') {
      if (lowerCode.includes('readme') || lowerCode.includes('# ')) {
        return getUniqueFileName('README.md');
      }
      if (lowerCode.includes('api')) {
        return getUniqueFileName('docs/api/API.md');
      }
      if (lowerCode.includes('deploy')) {
        return getUniqueFileName('docs/deployment/DEPLOYMENT.md');
      }
      return getUniqueFileName(`docs/documentation_${index + 1}.md`);
    }

    return getUniqueFileName(`misc/file_${index + 1}.${language || 'txt'}`);
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

    // Enhanced command detection with better error handling
    const editFileName = detectEditCommand(currentInput);
    const fileReferences = detectFileReferences(currentInput);
    let targetFile = null;
    
    if (editFileName) {
      targetFile = findFileByName(editFileName);
      if (!targetFile) {
        toast({
          title: "File Not Found",
          description: `Could not find file: ${editFileName}. Available files: ${files.map(f => f.name).slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`,
          variant: "destructive"
        });
        setIsSending(false);
        return;
      }
    }

    // Enhanced file reference validation
    const invalidRefs = fileReferences.filter(ref => !findFileByName(ref));
    if (invalidRefs.length > 0) {
      console.warn('Invalid file references:', invalidRefs);
      toast({
        title: "Some Referenced Files Not Found",
        description: `Cannot find: ${invalidRefs.slice(0, 3).join(', ')}${invalidRefs.length > 3 ? '...' : ''}`,
        variant: "destructive"
      });
    }

    if (onAIInteraction) {
      onAIInteraction();
    }

    try {
      await incrementMessageCount();

      const fileContext = files.map(file => ({
        name: file.name,
        content: file.content || '',
        type: file.type,
        size: (file.content || '').length,
        lastModified: new Date().toISOString()
      }));

      console.log('Sending message with enhanced context:', {
        message: currentInput,
        editTarget: editFileName,
        references: fileReferences,
        availableFiles: files.length,
        duplicatePreventionEnabled: true,
        emptyFilePreventionEnabled: true
      });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: currentInput,
          context: messages.slice(-8).map(msg => ({
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
      
      // Extract and process code blocks with strict filtering
      const codeBlocks = extractCodeFromResponse(aiResponse);
      
      let operationSummary = '';
      let createdFiles = 0;
      let updatedFiles = 0;
      
      if (codeBlocks.length > 0) {
        if (editFileName && targetFile) {
          // File editing mode
          if (codeBlocks.length === 1) {
            updateFile(targetFile.id, codeBlocks[0].code);
            updatedFiles = 1;
            operationSummary = `Updated: ${targetFile.name}`;
            toast({
              title: "File Updated Successfully",
              description: `${targetFile.name} has been enhanced with comprehensive new functionality`,
            });
          } else {
            // Update target + create additional files
            updateFile(targetFile.id, codeBlocks[0].code);
            updatedFiles = 1;
            
            codeBlocks.slice(1).forEach((block, index) => {
              const fileName = generateFileName(block.code, block.language, index + 1);
              if (fileName && !preventDuplicateFiles(fileName)) {
                addFileFromAI(fileName, block.code, block.language);
                createdFiles++;
              }
            });

            operationSummary = `Updated: ${targetFile.name} + ${createdFiles} new files`;
            toast({
              title: "Files Updated & Created",
              description: `Enhanced ${targetFile.name} and created ${createdFiles} additional comprehensive files`,
            });
          }
        } else {
          // Comprehensive project generation mode
          codeBlocks.forEach((block, index) => {
            const fileName = generateFileName(block.code, block.language, index);
            if (fileName && !preventDuplicateFiles(fileName)) {
              addFileFromAI(fileName, block.code, block.language);
              createdFiles++;
            } else if (fileName) {
              console.warn('Prevented duplicate file creation:', fileName);
            } else {
              console.warn('File generation skipped (empty/invalid content)');
            }
          });

          operationSummary = `Comprehensive project: ${createdFiles} files`;
          toast({
            title: "Comprehensive Project Generated",
            description: `Created ${createdFiles} files with professional organization, extensive functionality, and enterprise-level implementations. No empty files generated.`,
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
                Connect your wallet to access the AI assistant for Move smart contract development.
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
                Loading AI Assistant
              </h3>
              <p className="text-electric-blue-300/80">
                Setting up your Move smart contract development environment...
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
            Move AI Assistant
            <Shield className="w-4 h-4 text-green-400" />
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
        {files.length > 0 && (
          <div className="mt-2 p-2 bg-gradient-to-r from-electric-blue-500/10 to-green-500/10 border border-electric-blue-500/20 rounded-lg">
            <div className="text-xs text-electric-blue-300 flex items-center gap-2">
              <Code className="w-3 h-3" />
              <span>{files.length} files in project • Persistent storage enabled</span>
            </div>
          </div>
        )}
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
                            <span>{message.fileName?.includes('Updated:') ? 'Enhanced' : 'Generated'}</span>
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
                placeholder="Create Move ecosystems, edit files, or reference with @filename..."
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
