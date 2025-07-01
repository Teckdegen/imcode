
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  AlertCircle
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  functions?: string[];
}

const CodeEditor = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedFile, setSelectedFile] = useState('token.move');
  const [consoleOutput, setConsoleOutput] = useState([
    { type: 'info', message: 'ImCode Blue & Black - Move Smart Contract IDE', timestamp: new Date() },
    { type: 'success', message: 'Connected to Umi Network Devnet', timestamp: new Date() },
    { type: 'info', message: 'Ready to compile and deploy Move contracts', timestamp: new Date() }
  ]);

  const projectFiles: FileNode[] = [
    {
      name: 'contracts',
      type: 'folder',
      children: [
        {
          name: 'MyToken',
          type: 'folder',
          children: [
            { name: 'Move.toml', type: 'file' },
            {
              name: 'sources',
              type: 'folder',
              children: [
                { 
                  name: 'token.move', 
                  type: 'file',
                  functions: ['initialize', 'mint', 'burn', 'transfer'],
                  content: `module example::Token {
    use std::signer;
    use aptos_framework::coin;

    struct Token has key, store {
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        supply: u64,
    }

    public entry fun initialize(
        account: &signer,
        name: vector<u8>,
        symbol: vector<u8>,
        decimals: u8,
        initial_supply: u64,
    ) {
        let account_addr = signer::address_of(account);
        
        let token = Token {
            name,
            symbol,
            decimals,
            supply: initial_supply,
        };
        
        move_to(account, token);
    }

    public entry fun mint(
        account: &signer,
        amount: u64,
    ) acquires Token {
        let account_addr = signer::address_of(account);
        let token = borrow_global_mut<Token>(account_addr);
        token.supply = token.supply + amount;
    }

    public entry fun burn(
        account: &signer,
        amount: u64,
    ) acquires Token {
        let account_addr = signer::address_of(account);
        let token = borrow_global_mut<Token>(account_addr);
        assert!(token.supply >= amount, 1);
        token.supply = token.supply - amount;
    }
}`
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'scripts',
      type: 'folder',
      children: [
        { 
          name: 'deploy_token.js', 
          type: 'file',
          content: `const { ethers } = require("hardhat");
const { AptosAccount, AptosClient, TxnBuilderTypes, BCS } = require("@aptos-labs/ts-sdk");

async function main() {
    console.log("Deploying MyToken to Umi Network...");
    
    const client = new AptosClient("https://devnet.moved.network");
    const account = new AptosAccount();
    
    const payload = {
        type: "entry_function_payload",
        function: "example::Token::initialize",
        arguments: [
            "MyToken",
            "MTK", 
            8,
            1000000
        ],
        type_arguments: []
    };
    
    const txnRequest = await client.generateTransaction(account.address(), payload);
    const signedTxn = await client.signTransaction(account, txnRequest);
    const txnResult = await client.submitTransaction(signedTxn);
    
    console.log("Transaction hash:", txnResult.hash);
    console.log("Contract deployed successfully!");
}

main().catch(console.error);`
        }
      ]
    },
    { name: 'hardhat.config.js', type: 'file' },
    { name: 'package.json', type: 'file' }
  ];

  const renderFileTree = (files: FileNode[], depth = 0) => {
    return files.map((file, index) => (
      <div key={index} className={`ml-${depth * 4}`}>
        <div 
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-electric-blue-500/10 ${
            selectedFile === file.name ? 'bg-electric-blue-500/20 text-electric-blue-100' : 'text-electric-blue-300'
          }`}
          onClick={() => file.type === 'file' && setSelectedFile(file.name)}
        >
          {file.type === 'folder' ? (
            <Folder className="w-4 h-4 text-electric-blue-400" />
          ) : (
            <FileText className="w-4 h-4 text-electric-blue-400" />
          )}
          <span className="text-sm">{file.name}</span>
          {file.functions && (
            <div className="ml-auto flex gap-1">
              {file.functions.slice(0, 2).map((func, i) => (
                <Badge key={i} variant="secondary" className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20">
                  {func}
                </Badge>
              ))}
              {file.functions.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20">
                  +{file.functions.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
        {file.children && renderFileTree(file.children, depth + 1)}
      </div>
    ));
  };

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

  const currentFile = projectFiles
    .flatMap(f => f.children || [])
    .flatMap(f => f.children?.flatMap(c => c.children || []) || [])
    .find(f => f.name === selectedFile);

  return (
    <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-electric-blue-100 flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Code Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10">
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <Button size="sm" variant="outline" className="border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" className="bg-electric-blue-500 hover:bg-electric-blue-600 text-white">
              <Play className="w-4 h-4 mr-1" />
              Deploy
            </Button>
          </div>
        </div>
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
                      {renderFileTree(projectFiles)}
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
                        {selectedFile}
                      </CardTitle>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <pre className="p-4 text-sm text-electric-blue-200 font-mono bg-cyber-black-100/30 overflow-x-auto">
                        <code>{currentFile?.content || '// Select a file to view its content'}</code>
                      </pre>
                    </ScrollArea>
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
  );
};

export default CodeEditor;
