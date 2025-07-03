
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  FileText, 
  Play, 
  Upload, 
  Download, 
  Terminal, 
  Folder,
  Code2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Save,
  Key,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAICode } from '@/contexts/AICodeContext';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAuth } from '@/contexts/WalletAuthContext';

interface CodeEditorProps {
  onProjectEdit?: () => void;
}

const CodeEditor = ({ onProjectEdit }: CodeEditorProps) => {
  const [activeTab, setActiveTab] = useState('editor');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showPrivateKeyDialog, setShowPrivateKeyDialog] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [deployedContractAddress, setDeployedContractAddress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { files, selectedFileId, setSelectedFileId, updateFile, deleteFile } = useAICode();
  const { userProfile } = useWalletAuth();
  const [consoleOutput, setConsoleOutput] = useState([
    { type: 'info', message: 'ImCode Blue & Black - Move Smart Contract IDE', timestamp: new Date() },
    { type: 'success', message: 'Connected to Umi Network Devnet', timestamp: new Date() },
    { type: 'info', message: 'Ready to compile and deploy Move contracts', timestamp: new Date() }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check if file is a text file
    const textFileTypes = [
      'text/plain',
      'text/javascript',
      'text/typescript',
      'application/json',
      'text/html',
      'text/css',
      'text/markdown',
      'application/x-javascript',
      'application/javascript'
    ];

    const isTextFile = textFileTypes.includes(file.type) || 
                      file.name.endsWith('.move') ||
                      file.name.endsWith('.js') ||
                      file.name.endsWith('.ts') ||
                      file.name.endsWith('.json') ||
                      file.name.endsWith('.toml') ||
                      file.name.endsWith('.md') ||
                      file.name.endsWith('.txt');

    if (!isTextFile) {
      toast({
        title: "Invalid File Type",
        description: "Only text files are allowed. Please upload .move, .js, .ts, .json, .toml, .md, or .txt files.",
        variant: "destructive"
      });
      return;
    }

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      console.log('File uploaded:', file.name, content);
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
    };
    reader.readAsText(file);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    if (onProjectEdit) {
      onProjectEdit();
    }
  };

  const handleSaveProject = async () => {
    if (!userProfile || files.length === 0) {
      toast({
        title: "Nothing to Save",
        description: "No files to save or user not authenticated.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert FileItem[] to JSON-compatible format
      const filesJson = files.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        content: file.content || '',
        parentId: file.parentId
      }));

      const projectData = {
        user_id: userProfile.id,
        name: `Project_${new Date().toISOString().split('T')[0]}`,
        type: 'move_contract',
        files: filesJson,
        status: 'draft'
      };

      const { error } = await supabase
        .from('projects')
        .insert(projectData);

      if (error) throw error;

      toast({
        title: "Project Saved",
        description: "Your Move project has been saved successfully."
      });

      setConsoleOutput(prev => [...prev, {
        type: 'success',
        message: 'Project saved to database',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeployClick = () => {
    if (!selectedFile || !selectedFile.content) {
      toast({
        title: "No Contract Selected",
        description: "Please select a Move contract file to deploy.",
        variant: "destructive"
      });
      return;
    }
    setShowPrivateKeyDialog(true);
  };

  const handleDeployWithPrivateKey = async () => {
    if (!privateKey.trim()) {
      toast({
        title: "Private Key Required",
        description: "Please enter your private key to deploy the contract.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedFile || !selectedFile.content) {
      toast({
        title: "No Contract Selected",
        description: "Please select a Move contract file to deploy.",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);
    setShowPrivateKeyDialog(false);
    
    setConsoleOutput(prev => [...prev, {
      type: 'info',
      message: 'Starting deployment to Umi Network...',
      timestamp: new Date()
    }]);

    try {
      // Call the deployment edge function with the private key and contract code
      const { data, error } = await supabase.functions.invoke('deploy-move-contract', {
        body: {
          privateKey: privateKey,
          contractCode: selectedFile.content,
          contractName: selectedFile.name.replace('.move', '')
        }
      });

      if (error) throw error;

      const { success, contractAddress, transactionHash, error: deployError } = data;
      
      if (!success) {
        throw new Error(deployError || 'Deployment failed');
      }

      setDeployedContractAddress(contractAddress);

      // Save deployment info to project
      if (userProfile) {
        const filesJson = files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          content: file.content || '',
          parentId: file.parentId
        }));

        const { error } = await supabase
          .from('projects')
          .insert({
            user_id: userProfile.id,
            name: selectedFile.name.replace('.move', ''),
            type: 'move_contract',
            files: filesJson,
            status: 'deployed',
            tx_hash: transactionHash,
            contract_address: contractAddress
          });

        if (error) console.error('Error saving deployment:', error);
      }

      setConsoleOutput(prev => [...prev, 
        {
          type: 'success',
          message: `Contract compiled successfully`,
          timestamp: new Date()
        },
        {
          type: 'success',
          message: `Deployed to Umi Network`,
          timestamp: new Date()
        },
        {
          type: 'info',
          message: `Transaction Hash: ${transactionHash}`,
          timestamp: new Date()
        },
        {
          type: 'info',
          message: `Contract Address: ${contractAddress}`,
          timestamp: new Date()
        }
      ]);

      toast({
        title: "Deployment Successful!",
        description: `Contract deployed at: ${contractAddress}`,
      });
    } catch (error) {
      console.error('Deployment error:', error);
      setConsoleOutput(prev => [...prev, {
        type: 'error',
        message: `Deployment failed: ${error}`,
        timestamp: new Date()
      }]);
      
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy contract. Please check your private key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
      setPrivateKey(''); // Clear private key for security
    }
  };

  const handleDeleteFile = (fileId: string) => {
    deleteFile(fileId);
    toast({
      title: "File Deleted",
      description: "File has been permanently removed.",
    });
  };

  const copyContractAddress = () => {
    navigator.clipboard.writeText(deployedContractAddress);
    toast({
      title: "Copied!",
      description: "Contract address copied to clipboard.",
    });
  };

  const selectedFile = files.find(f => f.id === selectedFileId);

  const getConsoleIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Terminal className="w-4 h-4 text-electric-blue-400" />;
    }
  };

  return (
    <>
      <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-electric-blue-100 flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Code Editor
            </CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".move,.js,.ts,.json,.toml,.md,.txt,text/*"
                style={{ display: 'none' }}
              />
              <Button 
                size="sm" 
                variant="outline" 
                className="border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10"
                onClick={handleSaveProject}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button 
                size="sm" 
                className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white"
                onClick={handleDeployClick}
                disabled={isDeploying || !selectedFile}
              >
                <Play className="w-4 h-4 mr-1" />
                {isDeploying ? 'Deploying...' : 'Deploy'}
              </Button>
            </div>
          </div>
          {deployedContractAddress && (
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-green-300 font-medium">Contract Deployed Successfully!</p>
                  <p className="text-xs text-green-400 font-mono">{deployedContractAddress}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                  onClick={copyContractAddress}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-80px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="mx-6 mb-4 bg-cyber-black-300/50 border border-electric-blue-500/20">
              <TabsTrigger value="editor" className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100">
                Editor
              </TabsTrigger>
              <TabsTrigger value="console" className="data-[state=active]:bg-electric-blue-500/20 data-[state=active]:text-electric-blue-100">
                Console
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 mx-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
                {/* File Navigator */}
                <div className="lg:col-span-1">
                  <Card className="h-full bg-cyber-black-300/30 border-electric-blue-500/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-electric-blue-200">Files</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px] px-4">
                        {files.length === 0 ? (
                          <div className="text-center text-electric-blue-400/60 py-8">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No files yet</p>
                            <p className="text-xs mt-1">Ask AI to generate code</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {files.map((file) => (
                              <div 
                                key={file.id}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-electric-blue-500/10 group ${
                                  selectedFileId === file.id ? 'bg-electric-blue-500/20 text-electric-blue-100' : 'text-electric-blue-300'
                                }`}
                                onClick={() => {
                                  setSelectedFileId(file.id);
                                  if (!isEditing) {
                                    handleStartEditing();
                                  }
                                }}
                              >
                                <FileText className="w-4 h-4 text-electric-blue-400" />
                                <span className="text-sm flex-1">{file.name}</span>
                                {file.name.endsWith('.move') && (
                                  <Badge variant="secondary" className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20">
                                    Move
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Code Area */}
                <div className="lg:col-span-3">
                  <Card className="h-full bg-cyber-black-300/30 border-electric-blue-500/10">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm text-electric-blue-200 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {selectedFile?.name || 'No file selected'}
                        </CardTitle>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {selectedFile ? (
                        <Textarea
                          value={selectedFile.content || ''}
                          onChange={(e) => updateFile(selectedFile.id, e.target.value)}
                          className="h-[400px] resize-none bg-cyber-black-100/30 border-none text-electric-blue-200 font-mono text-sm focus:ring-electric-blue-500/20 focus:border-electric-blue-500/40"
                          placeholder="Your Move contract code will appear here..."
                        />
                      ) : (
                        <div className="h-[400px] flex items-center justify-center text-electric-blue-400/60">
                          <div className="text-center">
                            <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Select a file to view its content</p>
                            <p className="text-sm mt-2">Or ask the AI to generate code for you</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="console" className="flex-1 mx-6 mt-0">
              <Card className="h-full bg-cyber-black-300/30 border-electric-blue-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-electric-blue-200 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Console Output
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[450px] p-4">
                    <div className="space-y-2">
                      {consoleOutput.map((log, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          {getConsoleIcon(log.type)}
                          <span className="text-electric-blue-300 text-xs">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span className={`flex-1 ${
                            log.type === 'error' ? 'text-red-300' :
                            log.type === 'success' ? 'text-green-300' :
                            log.type === 'warning' ? 'text-yellow-300' :
                            'text-electric-blue-200'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Private Key Dialog */}
      <Dialog open={showPrivateKeyDialog} onOpenChange={setShowPrivateKeyDialog}>
        <DialogContent className="bg-cyber-black-400 border-electric-blue-500/20">
          <DialogHeader>
            <DialogTitle className="text-electric-blue-100 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Enter Private Key for Deployment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-electric-blue-300 text-sm">
              Your private key is required to sign and deploy the contract to Umi Network. 
              This key is only used for this deployment and is not stored.
            </p>
            <Input
              type="password"
              placeholder="Enter your private key (0x...)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="bg-cyber-black-300/50 border-electric-blue-500/20 text-electric-blue-100"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPrivateKeyDialog(false)}
                className="border-electric-blue-500/30 text-electric-blue-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeployWithPrivateKey}
                disabled={!privateKey.trim() || isDeploying}
                className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white"
              >
                {isDeploying ? 'Deploying...' : 'Deploy Contract'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CodeEditor;
