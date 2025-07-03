
import { useState } from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import CodeEditor from '@/components/CodeEditor';
import EditorMode from '@/components/EditorMode';
import ProjectHistory from '@/components/ProjectHistory';
import { WalletProvider } from '@/providers/WalletProvider';
import { WalletAuthProvider } from '@/contexts/WalletAuthContext';
import { ChatHistoryProvider } from '@/contexts/ChatHistoryContext';
import { AICodeProvider } from '@/contexts/AICodeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Zap, Rocket, Shield } from 'lucide-react';

const Index = () => {
  const [activeView, setActiveView] = useState('builder');
  const [hasInteractedWithAI, setHasInteractedWithAI] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);

  const handleAIInteraction = () => {
    setHasInteractedWithAI(true);
  };

  const handleProjectEdit = () => {
    setIsEditingProject(true);
  };

  return (
    <WalletProvider>
      <WalletAuthProvider>
        <ChatHistoryProvider>
          <AICodeProvider>
            <div className="min-h-screen bg-gradient-to-br from-cyber-black-100 via-cyber-black-200 to-cyber-black-300 cyber-grid">
              <Header />
              
              <main className="container mx-auto p-4 lg:p-6">
                {/* Hero Section */}
                <div className="text-center mb-8 lg:mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 rounded-2xl flex items-center justify-center animate-float">
                        <Code className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 rounded-2xl opacity-20 animate-pulse-slow blur-xl"></div>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-electric-blue-400 via-electric-blue-500 to-electric-blue-600 bg-clip-text text-transparent">
                    ImCode Blue & Black
                  </h1>
                  <p className="text-xl lg:text-2xl text-electric-blue-300 mb-6 max-w-3xl mx-auto">
                    The ultimate Move smart contract IDE for Umi Network. Create, compile, and deploy with AI-powered assistance.
                  </p>
                  
                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                    <Card className="p-6 bg-cyber-black-400/30 border-electric-blue-500/20 backdrop-blur-sm hover:bg-cyber-black-400/50 transition-all duration-300 group">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-electric-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Zap className="w-6 h-6 text-electric-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-electric-blue-100 mb-2">AI-Powered</h3>
                        <p className="text-electric-blue-300 text-sm">AI integration for smart contract generation and assistance</p>
                      </div>
                    </Card>
                    
                    <Card className="p-6 bg-cyber-black-400/30 border-electric-blue-500/20 backdrop-blur-sm hover:bg-cyber-black-400/50 transition-all duration-300 group">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-electric-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Rocket className="w-6 h-6 text-electric-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-electric-blue-100 mb-2">One-Click Deploy</h3>
                        <p className="text-electric-blue-300 text-sm">Deploy directly to Umi Network devnet with integrated tooling</p>
                      </div>
                    </Card>
                    
                    <Card className="p-6 bg-cyber-black-400/30 border-electric-blue-500/20 backdrop-blur-sm hover:bg-cyber-black-400/50 transition-all duration-300 group">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-electric-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Shield className="w-6 h-6 text-electric-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-electric-blue-100 mb-2">Secure & Fast</h3>
                        <p className="text-electric-blue-300 text-sm">Built-in security best practices and optimized compilation</p>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Main Interface */}
                <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto mb-6 bg-cyber-black-400/50 border border-electric-blue-500/20">
                    <TabsTrigger 
                      value="builder" 
                      className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100"
                    >
                      AI Builder
                    </TabsTrigger>
                    <TabsTrigger 
                      value="editor" 
                      className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100"
                    >
                      Editor
                    </TabsTrigger>
                    <TabsTrigger 
                      value="projects" 
                      className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100"
                    >
                      Projects
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100"
                    >
                      AI Chat
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="builder" className="mt-0">
                    {!hasInteractedWithAI ? (
                      <div className="max-w-4xl mx-auto h-[800px]">
                        <ChatInterface onAIInteraction={handleAIInteraction} />
                      </div>
                    ) : (
                      <div className={`grid gap-6 h-[800px] transition-all duration-300 ${
                        isEditingProject ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3'
                      }`}>
                        <div className={`transition-all duration-300 ${
                          isEditingProject ? 'col-span-1' : 'xl:col-span-2'
                        }`}>
                          <CodeEditor onProjectEdit={handleProjectEdit} />
                        </div>
                        {!isEditingProject && (
                          <div className="xl:col-span-1">
                            <ChatInterface onAIInteraction={handleAIInteraction} />
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="editor" className="mt-0">
                    <div className="h-[800px]">
                      <EditorMode />
                    </div>
                  </TabsContent>

                  <TabsContent value="projects" className="mt-0">
                    <div className="max-w-4xl mx-auto">
                      <ProjectHistory />
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-0">
                    <div className="max-w-4xl mx-auto h-[800px]">
                      <ChatInterface onAIInteraction={handleAIInteraction} />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Footer */}
                <footer className="mt-16 text-center text-electric-blue-400/60 text-sm">
                  <p>© 2024 ImCode Blue & Black. Built for Umi Network developers with ❤️</p>
                </footer>
              </main>
            </div>
          </AICodeProvider>
        </ChatHistoryProvider>
      </WalletAuthProvider>
    </WalletProvider>
  );
};

export default Index;
