
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  FileText, 
  Folder, 
  Save, 
  Play,
  Trash2,
  Edit3,
  Code2,
  Download,
  FolderTree
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId?: string;
}

const EditorMode = () => {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'MyContract',
      type: 'folder'
    },
    {
      id: '2',
      name: 'Move.toml',
      type: 'file',
      parentId: '1',
      content: `[package]
name = "MyContract"
version = "1.0.0"
authors = ["Your Name <your.email@example.com>"]

[addresses]
example = "0x1"

[dev-addresses]
example = "0x1"

[dependencies]
MoveStdlib = { git = "https://github.com/move-language/move.git", subdir = "language/move-stdlib", rev = "main" }
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework", rev = "main" }`
    },
    {
      id: '3',
      name: 'contract.move',
      type: 'file',
      parentId: '1',
      content: `module example::MyContract {
    use std::signer;
    
    struct Counter has key {
        value: u64,
    }
    
    public entry fun initialize(account: &signer) {
        let counter = Counter { value: 0 };
        move_to(account, counter);
    }
    
    public entry fun increment(account: &signer) acquires Counter {
        let account_addr = signer::address_of(account);
        let counter = borrow_global_mut<Counter>(account_addr);
        counter.value = counter.value + 1;
    }
    
    public fun get_count(account_addr: address): u64 acquires Counter {
        borrow_global<Counter>(account_addr).value
    }
}`
    },
    {
      id: '4',
      name: 'hardhat.config.js',
      type: 'file',
      parentId: '1',
      content: `require("@nomicfoundation/hardhat-toolbox");
require("@moved/hardhat-plugin");

module.exports = {
  defaultNetwork: "devnet",
  networks: {
    devnet: {
      url: "https://devnet.uminetwork.com",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};`
    },
    {
      id: '5',
      name: 'scripts',
      type: 'folder',
      parentId: '1'
    },
    {
      id: '6',
      name: 'deploy.js',
      type: 'file',
      parentId: '5',
      content: `const { ethers } = require('hardhat');
const { AccountAddress, EntryFunction, FixedBytes, parseTypeTag } = require('@aptos-labs/ts-sdk');
const { TransactionPayloadEntryFunction, TypeTagSigner } = require('@aptos-labs/ts-sdk');

async function main() {
  const contractName = 'counter';
  const [deployer] = await ethers.getSigners();
  const moduleAddress = deployer.address.replace('0x', '0x000000000000000000000000');

  const Counter = await ethers.getContractFactory(contractName);
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  console.log(\`Counter is deployed to: \${deployer.address}::\${contractName}\`);

  const address = AccountAddress.fromString(moduleAddress);
  const addressBytes = [33, 0, ...address.toUint8Array()];
  const signer = new FixedBytes(new Uint8Array(addressBytes));

  const entryFunction = EntryFunction.build(
    \`\${moduleAddress}::\${contractName}\`,
    'initialize',
    [], // Use \`parseTypeTag(..)\` to get type arg from string
    [signer]
  );
  const transactionPayload = new TransactionPayloadEntryFunction(entryFunction);
  const payload = transactionPayload.bcsToHex();
  const request = {
    to: deployer.address,
    data: payload.toString(),
  };
  await deployer.sendTransaction(request);
  console.log('Initialize transaction sent');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });`
    },
    {
      id: '7',
      name: 'package.json',
      type: 'file',
      parentId: '1',
      content: `{
  "name": "umi-move-contract",
  "version": "1.0.0",
  "description": "Move smart contract for Umi Network",
  "main": "index.js",
  "scripts": {
    "compile": "hardhat compile",
    "deploy": "hardhat run scripts/deploy.js",
    "test": "hardhat test"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@moved/hardhat-plugin": "^1.0.0",
    "hardhat": "^2.19.0"
  },
  "dependencies": {
    "@aptos-labs/ts-sdk": "^1.0.0"
  }
}`
    },
    {
      id: '8',
      name: 'test',
      type: 'folder',
      parentId: '1'
    },
    {
      id: '9',
      name: 'Counter.test.js',
      type: 'file',
      parentId: '8',
      content: `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Counter", function () {
  it("Should initialize counter with zero value", async function () {
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();
    await counter.waitForDeployment();

    expect(await counter.get_count()).to.equal(0);
  });

  it("Should increment counter", async function () {
    const Counter = await ethers.getContractFactory("Counter");
    const counter = await Counter.deploy();
    await counter.waitForDeployment();

    await counter.increment();
    expect(await counter.get_count()).to.equal(1);
  });
});`
    },
    {
      id: '10',
      name: 'README.md',
      type: 'file',
      parentId: '1',
      content: `# Umi Network Move Smart Contract

This project demonstrates a Move smart contract deployment on Umi Network using Hardhat.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Configure your private key in \`hardhat.config.js\`

3. Compile the contract:
\`\`\`bash
npm run compile
\`\`\`

4. Deploy the contract:
\`\`\`bash
npm run deploy
\`\`\`

## Project Structure

- \`contract.move\` - Main Move smart contract
- \`Move.toml\` - Move project configuration
- \`hardhat.config.js\` - Hardhat configuration
- \`scripts/deploy.js\` - Deployment script
- \`test/\` - Test files
- \`package.json\` - Node.js dependencies

## Features

- Counter smart contract with initialize and increment functions
- Hardhat integration for deployment
- Test suite for contract validation
- Umi Network devnet configuration`
    }
  ]);
  
  const [selectedFileId, setSelectedFileId] = useState<string>('3');
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file');
  const [showFolderStructure, setShowFolderStructure] = useState(false);
  const { toast } = useToast();

  const selectedFile = files.find(f => f.id === selectedFileId);

  const createNewFile = () => {
    if (!newFileName.trim()) return;

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newFileName,
      type: newFileType,
      parentId: newFileType === 'file' ? '1' : undefined,
      content: newFileType === 'file' ? '// New Move contract\n\n' : undefined
    };

    setFiles(prev => [...prev, newFile]);
    setNewFileName('');
    setNewFileType('file');
    setIsNewFileDialogOpen(false);
    
    toast({
      title: "File Created",
      description: `${newFileType === 'file' ? 'File' : 'Folder'} "${newFileName}" has been created.`
    });
  };

  const updateFileContent = (content: string) => {
    if (!selectedFile) return;
    
    setFiles(prev => prev.map(file => 
      file.id === selectedFileId 
        ? { ...file, content }
        : file
    ));
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(files.find(f => f.id !== fileId)?.id || '');
    }
    
    toast({
      title: "File Deleted",
      description: "File has been deleted successfully."
    });
  };

  const saveProject = () => {
    toast({
      title: "Project Saved",
      description: "Your Move project has been saved successfully."
    });
  };

  const compileContract = () => {
    toast({
      title: "Compilation Started",
      description: "Your Move contract is being compiled..."
    });
  };

  const generateFolderStructure = () => {
    const structure = [];
    const processedFolders = new Set();

    const addToStructure = (file: FileItem, level: number = 0) => {
      const indent = '  '.repeat(level);
      if (file.type === 'folder') {
        structure.push(`${indent}📁 ${file.name}/`);
        processedFolders.add(file.id);
        
        const children = files.filter(f => f.parentId === file.id);
        children.forEach(child => addToStructure(child, level + 1));
      } else {
        const icon = file.name.endsWith('.move') ? '📄' :
                   file.name.endsWith('.js') ? '📄' :
                   file.name.endsWith('.json') ? '📄' :
                   file.name.endsWith('.toml') ? '📄' :
                   file.name.endsWith('.md') ? '📄' : '📄';
        structure.push(`${indent}${icon} ${file.name}`);
      }
    };

    // Start with root folders
    const rootFolders = files.filter(f => f.type === 'folder' && !f.parentId);
    rootFolders.forEach(folder => addToStructure(folder));

    return structure.join('\n');
  };

  const downloadProjectAsZip = async () => {
    const zip = new JSZip();
    
    // Create folder structure and add files
    const addFileToZip = (file: FileItem, currentPath: string = '') => {
      if (file.type === 'folder') {
        const folderPath = currentPath ? `${currentPath}/${file.name}` : file.name;
        zip.folder(folderPath);
        
        // Add children to this folder
        const children = files.filter(f => f.parentId === file.id);
        children.forEach(child => addFileToZip(child, folderPath));
      } else {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        zip.file(filePath, file.content || '');
      }
    };

    // Start with root folders and files
    const rootItems = files.filter(f => !f.parentId);
    rootItems.forEach(item => addFileToZip(item));

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'umi-move-contract.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your project is being downloaded as a ZIP file."
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderFileTree = () => {
    const rootFiles = files.filter(f => !f.parentId);
    const childFiles = files.filter(f => f.parentId);

    return (
      <div className="space-y-1">
        {rootFiles.map(file => (
          <div key={file.id}>
            <div 
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-electric-blue-500/10 ${
                selectedFileId === file.id ? 'bg-electric-blue-500/20 text-electric-blue-100' : 'text-electric-blue-300'
              }`}
              onClick={() => file.type === 'file' && setSelectedFileId(file.id)}
            >
              {file.type === 'folder' ? (
                <Folder className="w-4 h-4 text-electric-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-electric-blue-400" />
              )}
              <span className="text-sm flex-1">{file.name}</span>
              {file.type === 'file' && file.name.endsWith('.move') && (
                <Badge variant="secondary" className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20">
                  Move
                </Badge>
              )}
              {file.type === 'file' && file.name.endsWith('.js') && (
                <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                  JS
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFile(file.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            
            {file.type === 'folder' && (
              <div className="ml-4">
                {childFiles.filter(cf => cf.parentId === file.id).map(childFile => (
                  <div 
                    key={childFile.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-electric-blue-500/10 ${
                      selectedFileId === childFile.id ? 'bg-electric-blue-500/20 text-electric-blue-100' : 'text-electric-blue-300'
                    }`}
                    onClick={() => setSelectedFileId(childFile.id)}
                  >
                    <FileText className="w-4 h-4 text-electric-blue-400" />
                    <span className="text-sm flex-1">{childFile.name}</span>
                    {childFile.name.endsWith('.move') && (
                      <Badge variant="secondary" className="text-xs bg-electric-blue-500/10 text-electric-blue-300 border-electric-blue-500/20">
                        Move
                      </Badge>
                    )}
                    {childFile.name.endsWith('.js') && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                        JS
                      </Badge>
                    )}
                    {childFile.name.endsWith('.json') && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-300 border-green-500/20">
                        JSON
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(childFile.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* File Explorer */}
      <div className="lg:col-span-1">
        <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-electric-blue-200 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Project Files
              </CardTitle>
              <div className="flex gap-1">
                <Dialog open={showFolderStructure} onOpenChange={setShowFolderStructure}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10">
                      <FolderTree className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cyber-black-400 border-electric-blue-500/20 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-electric-blue-100">Project Structure</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <pre className="bg-cyber-black-300/50 p-4 rounded-lg text-electric-blue-200 text-sm overflow-x-auto">
                        {generateFolderStructure()}
                      </pre>
                      <div className="flex justify-end gap-2">
                        <Button onClick={downloadProjectAsZip} className="bg-electric-blue-500 hover:bg-electric-blue-600">
                          <Download className="w-4 h-4 mr-1" />
                          Download ZIP
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 border-electric-blue-500/30 text-electric-blue-300 hover:bg-electric-blue-500/10">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-cyber-black-400 border-electric-blue-500/20">
                    <DialogHeader>
                      <DialogTitle className="text-electric-blue-100">Create New File</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={newFileType === 'file' ? 'default' : 'outline'}
                          onClick={() => setNewFileType('file')}
                          className={newFileType === 'file' ? 'bg-electric-blue-500 hover:bg-electric-blue-600' : 'border-electric-blue-500/30 text-electric-blue-300'}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          File
                        </Button>
                        <Button
                          size="sm"
                          variant={newFileType === 'folder' ? 'default' : 'outline'}
                          onClick={() => setNewFileType('folder')}
                          className={newFileType === 'folder' ? 'bg-electric-blue-500 hover:bg-electric-blue-600' : 'border-electric-blue-500/30 text-electric-blue-300'}
                        >
                          <Folder className="w-4 h-4 mr-1" />
                          Folder
                        </Button>
                      </div>
                      <Input
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder={`Enter ${newFileType} name...`}
                        className="bg-cyber-black-300/50 border-electric-blue-500/20 text-electric-blue-100"
                      />
                      <Button onClick={createNewFile} className="w-full bg-electric-blue-500 hover:bg-electric-blue-600">
                        Create {newFileType === 'file' ? 'File' : 'Folder'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] px-4">
              {renderFileTree()}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Code Editor */}
      <div className="lg:col-span-3">
        <Card className="h-full bg-cyber-black-400/50 border-electric-blue-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-electric-blue-200 flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                {selectedFile?.name || 'Select a file'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={downloadProjectAsZip} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Download className="w-4 h-4 mr-1" />
                  ZIP
                </Button>
                <Button size="sm" onClick={saveProject} className="bg-green-600 hover:bg-green-700 text-white">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" onClick={compileContract} className="bg-electric-blue-500 hover:bg-electric-blue-600">
                  <Play className="w-4 h-4 mr-1" />
                  Compile
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-80px)]">
            {selectedFile ? (
              <Textarea
                value={selectedFile.content || ''}
                onChange={(e) => updateFileContent(e.target.value)}
                className="h-full resize-none bg-cyber-black-100/30 border-none text-electric-blue-200 font-mono text-sm focus:ring-electric-blue-500/20 focus:border-electric-blue-500/40"
                placeholder="Start writing your Move contract..."
              />
            ) : (
              <div className="h-full flex items-center justify-center text-electric-blue-400/60">
                <div className="text-center">
                  <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditorMode;
