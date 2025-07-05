import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId?: string;
  displayName?: string;
}

interface ProjectData {
  id: string;
  name: string;
  files: FileItem[];
  createdAt: string;
  updatedAt: string;
}

interface AICodeContextType {
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  addFileFromAI: (fileName: string, content: string, type?: string) => void;
  updateFile: (fileId: string, content: string) => void;
  editFileByName: (fileName: string, content: string) => boolean;
  findFileByName: (fileName: string) => FileItem | undefined;
  deleteFile: (fileId: string) => void;
  selectedFileId: string;
  setSelectedFileId: (id: string) => void;
  currentProject: ProjectData | null;
  setCurrentProject: (project: ProjectData | null) => void;
  createNewProject: (name: string) => void;
  loadProject: (project: ProjectData) => void;
  getUniqueFileName: (fileName: string) => string;
  preventDuplicateFiles: (fileName: string) => boolean;
  saveProjectToStorage: () => void;
  loadProjectFromStorage: () => void;
}

const AICodeContext = createContext<AICodeContextType | undefined>(undefined);

export const useAICode = () => {
  const context = useContext(AICodeContext);
  if (!context) {
    throw new Error('useAICode must be used within an AICodeProvider');
  }
  return context;
};

interface AICodeProviderProps {
  children: React.ReactNode;
}

export const AICodeProvider: React.FC<AICodeProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);

  // FIXED: Aggressive persistence - save on every change
  const saveProjectToStorage = useCallback(() => {
    try {
      const projectToSave = currentProject || {
        id: `project_${Date.now()}`,
        name: 'Current Project',
        files: files,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedProject = {
        ...projectToSave,
        files: files,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('imcode-current-project', JSON.stringify(updatedProject));
      localStorage.setItem('imcode-selected-file', selectedFileId);
      localStorage.setItem('imcode-files-backup', JSON.stringify(files));
      
      console.log('✅ Project saved to localStorage:', updatedProject.name, 'with', files.length, 'files');
    } catch (error) {
      console.error('❌ Failed to save project to localStorage:', error);
    }
  }, [currentProject, files, selectedFileId]);

  const loadProjectFromStorage = useCallback(() => {
    try {
      // Try multiple sources for maximum reliability
      const savedProject = localStorage.getItem('imcode-current-project');
      const savedFiles = localStorage.getItem('imcode-files-backup');
      const savedSelectedFile = localStorage.getItem('imcode-selected-file');
      
      if (savedProject) {
        const project: ProjectData = JSON.parse(savedProject);
        console.log('✅ Loading project from localStorage:', project.name, 'with', project.files?.length || 0, 'files');
        
        setCurrentProject(project);
        if (project.files && project.files.length > 0) {
          setFiles(project.files);
          console.log('✅ Restored', project.files.length, 'files from project');
        }
        
        if (savedSelectedFile && project.files?.some(f => f.id === savedSelectedFile)) {
          setSelectedFileId(savedSelectedFile);
        } else if (project.files && project.files.length > 0) {
          setSelectedFileId(project.files[0].id);
        }
      } else if (savedFiles) {
        // Fallback to files backup
        const filesBackup: FileItem[] = JSON.parse(savedFiles);
        console.log('✅ Loading files from backup:', filesBackup.length, 'files');
        setFiles(filesBackup);
        
        if (savedSelectedFile && filesBackup.some(f => f.id === savedSelectedFile)) {
          setSelectedFileId(savedSelectedFile);
        } else if (filesBackup.length > 0) {
          setSelectedFileId(filesBackup[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load project from localStorage:', error);
    }
  }, []);

  // Load immediately on mount
  useEffect(() => {
    loadProjectFromStorage();
  }, [loadProjectFromStorage]);

  // ENHANCED: Save aggressively on every change
  useEffect(() => {
    if (files.length > 0) {
      const timeoutId = setTimeout(() => {
        saveProjectToStorage();
      }, 100); // Very short delay to batch rapid changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [files, saveProjectToStorage]);

  // Also save when selected file changes
  useEffect(() => {
    if (selectedFileId && files.length > 0) {
      const timeoutId = setTimeout(() => {
        saveProjectToStorage();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedFileId, files.length, saveProjectToStorage]);

  // STRICT unique filename generation - absolutely no duplicates allowed
  const getUniqueFileName = useCallback((fileName: string): string => {
    const existingNames = files.map(f => f.name.toLowerCase());
    const lowerFileName = fileName.toLowerCase();
    
    if (!existingNames.includes(lowerFileName)) {
      return fileName;
    }

    // More aggressive unique naming
    const pathParts = fileName.split('/');
    const fileNamePart = pathParts.pop() || fileName;
    const pathPrefix = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
    
    const baseName = fileNamePart.replace(/\.[^/.]+$/, "");
    const extension = fileNamePart.match(/\.[^/.]+$/)?.[0] || '';
    
    let counter = 1;
    let uniqueName = fileName;
    
    while (existingNames.includes((pathPrefix + baseName + (counter > 1 ? `_v${counter}` : '') + extension).toLowerCase())) {
      counter++;
      uniqueName = pathPrefix + baseName + `_v${counter}` + extension;
    }
    
    return uniqueName;
  }, [files]);

  // STRICT duplicate prevention - reject any potential duplicates
  const preventDuplicateFiles = useCallback((fileName: string): boolean => {
    const existingNames = files.map(f => f.name.toLowerCase());
    const lowerFileName = fileName.toLowerCase();
    
    // Check exact match
    if (existingNames.includes(lowerFileName)) {
      return true;
    }
    
    // Check similar names that could cause confusion
    const baseName = fileName.replace(/\.[^/.]+$/, "").toLowerCase();
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || '';
    
    const similarExists = existingNames.some(existingName => {
      const existingBase = existingName.replace(/\.[^/.]+$/, "");
      const existingExt = existingName.match(/\.[^/.]+$/)?.[0] || '';
      
      return existingBase === baseName && existingExt === extension;
    });
    
    return similarExists;
  }, [files]);

  // ENHANCED file finding with comprehensive matching strategies
  const findFileByName = useCallback((fileName: string): FileItem | undefined => {
    console.log('Searching for file:', fileName, 'in', files.length, 'files');
    
    // Clean the filename (remove @ symbol if present)
    const cleanFileName = fileName.startsWith('@') ? fileName.substring(1) : fileName;
    
    // Strategy 1: Exact match (case sensitive)
    let file = files.find(f => f.name === cleanFileName);
    if (file) {
      console.log('Found exact match:', file.name);
      return file;
    }

    // Strategy 2: Case-insensitive exact match
    file = files.find(f => f.name.toLowerCase() === cleanFileName.toLowerCase());
    if (file) {
      console.log('Found case-insensitive match:', file.name);
      return file;
    }

    // Strategy 3: Ends with match (for path-based files)
    file = files.find(f => f.name.endsWith(cleanFileName));
    if (file) {
      console.log('Found ends-with match:', file.name);
      return file;
    }

    // Strategy 4: Contains match
    file = files.find(f => f.name.includes(cleanFileName));
    if (file) {
      console.log('Found contains match:', file.name);
      return file;
    }

    // Strategy 5: Base name matching (without path and extension)
    const baseSearchName = cleanFileName.split('/').pop()?.replace(/\.[^/.]+$/, "") || cleanFileName;
    file = files.find(f => {
      const fileBaseName = f.name.split('/').pop()?.replace(/\.[^/.]+$/, "") || f.name;
      return fileBaseName.toLowerCase() === baseSearchName.toLowerCase();
    });
    if (file) {
      console.log('Found base name match:', file.name);
      return file;
    }

    // Strategy 6: Fuzzy matching for common typos
    file = files.find(f => {
      const fileName1 = f.name.toLowerCase().replace(/[_\-\.\/]/g, '');
      const fileName2 = cleanFileName.toLowerCase().replace(/[_\-\.\/]/g, '');
      return fileName1 === fileName2;
    });
    if (file) {
      console.log('Found fuzzy match:', file.name);
      return file;
    }

    console.log('File not found. Available files:', files.map(f => f.name));
    return undefined;
  }, [files]);

  // IMPROVED file organization with deeper, more logical structure
  const organizeFileIntoDirectory = useCallback((fileName: string, content: string, type: string): string => {
    // Don't reorganize if already has a deep path (3+ levels)
    const pathDepth = (fileName.match(/\//g) || []).length;
    if (pathDepth >= 2) {
      return fileName;
    }

    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // Move contracts with detailed categorization
    if (fileName.endsWith('.move') || lowerContent.includes('module') || lowerContent.includes('struct')) {
      // Core protocol contracts
      if (lowerContent.includes('core') || lowerContent.includes('main') || lowerContent.includes('primary')) {
        return `contracts/core/${fileName}`;
      }
      
      // Token-specific contracts
      if (lowerContent.includes('token') || lowerFileName.includes('token')) {
        if (lowerContent.includes('erc20') || lowerContent.includes('fungible')) {
          return `contracts/tokens/fungible/${fileName}`;
        }
        if (lowerContent.includes('nft') || lowerContent.includes('erc721')) {
          return `contracts/tokens/nft/${fileName}`;
        }
        return `contracts/tokens/${fileName}`;
      }
      
      // DeFi protocols
      if (lowerContent.includes('defi') || lowerContent.includes('liquidity') || lowerContent.includes('pool')) {
        if (lowerContent.includes('liquidity')) {
          return `contracts/defi/liquidity/${fileName}`;
        }
        if (lowerContent.includes('swap') || lowerContent.includes('exchange')) {
          return `contracts/defi/exchange/${fileName}`;
        }
        if (lowerContent.includes('lending') || lowerContent.includes('borrow')) {
          return `contracts/defi/lending/${fileName}`;
        }
        return `contracts/defi/${fileName}`;
      }
      
      // Governance and DAO
      if (lowerContent.includes('governance') || lowerContent.includes('dao') || lowerContent.includes('voting')) {
        return `contracts/governance/${fileName}`;
      }
      
      // NFT collections and marketplaces
      if (lowerContent.includes('nft') || lowerFileName.includes('nft')) {
        if (lowerContent.includes('marketplace')) {
          return `contracts/nft/marketplace/${fileName}`;
        }
        if (lowerContent.includes('collection')) {
          return `contracts/nft/collections/${fileName}`;
        }
        return `contracts/nft/${fileName}`;
      }
      
      // Utility and helper contracts
      if (lowerContent.includes('util') || lowerContent.includes('helper') || lowerContent.includes('library')) {
        return `contracts/utils/${fileName}`;
      }
      
      // Access control and permissions
      if (lowerContent.includes('access') || lowerContent.includes('role') || lowerContent.includes('permission')) {
        return `contracts/access/${fileName}`;
      }
      
      return `contracts/core/${fileName}`;
    }

    // Enhanced JavaScript/TypeScript organization
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      if (lowerContent.includes('deploy') || lowerFileName.includes('deploy')) {
        if (lowerContent.includes('mainnet') || lowerFileName.includes('mainnet')) {
          return `scripts/deployment/mainnet/${fileName}`;
        }
        if (lowerContent.includes('testnet') || lowerFileName.includes('testnet')) {
          return `scripts/deployment/testnet/${fileName}`;
        }
        return `scripts/deployment/${fileName}`;
      }
      
      if (lowerContent.includes('test') || lowerFileName.includes('test')) {
        if (lowerContent.includes('integration')) {
          return `tests/integration/${fileName}`;
        }
        if (lowerContent.includes('unit')) {
          return `tests/unit/${fileName}`;
        }
        return `tests/${fileName}`;
      }
      
      if (lowerContent.includes('interact') || lowerFileName.includes('interact')) {
        return `scripts/interaction/${fileName}`;
      }
      
      if (lowerContent.includes('config') || lowerFileName.includes('config')) {
        return `config/${fileName}`;
      }
      
      return `scripts/${fileName}`;
    }

    // Configuration files
    if (fileName.endsWith('.json')) {
      if (lowerFileName.includes('package')) {
        return fileName; // Keep package.json at root
      }
      if (lowerFileName.includes('network')) {
        return `config/networks/${fileName}`;
      }
      return `config/${fileName}`;
    }

    if (fileName.endsWith('.toml')) {
      return `config/${fileName}`;
    }

    // Documentation with categories
    if (fileName.endsWith('.md')) {
      if (lowerFileName.includes('readme')) {
        return fileName; // Keep README at root
      }
      if (lowerFileName.includes('api')) {
        return `docs/api/${fileName}`;
      }
      if (lowerFileName.includes('deploy')) {
        return `docs/deployment/${fileName}`;
      }
      return `docs/${fileName}`;
    }

    // TypeScript definitions
    if (fileName.endsWith('.d.ts')) {
      return `types/${fileName}`;
    }

    return `misc/${fileName}`;
  }, []);

  // ENHANCED: Strict empty file prevention
  const validateFileContent = useCallback((content: string, fileName: string): boolean => {
    if (!content || content.trim().length < 50) {
      console.warn('File content too short, rejecting:', fileName, content.substring(0, 30));
      return false;
    }
    
    // Additional validation for Move files
    if (fileName.endsWith('.move')) {
      if (!content.includes('module') && !content.includes('struct') && !content.includes('public fun')) {
        console.warn('Move file missing essential keywords:', fileName);
        return false;
      }
    }
    
    return true;
  }, []);

  const addFileFromAI = useCallback((fileName: string, content: string, type: string = 'move') => {
    console.log('Adding file:', fileName, 'Type:', type);
    
    // STRICT: Validate content is not empty
    if (!validateFileContent(content, fileName)) {
      console.warn('File rejected due to insufficient content:', fileName);
      return;
    }
    
    // STRICT duplicate prevention
    const existingFile = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    if (existingFile) {
      console.log('File exists, updating instead of creating:', existingFile.name);
      updateFile(existingFile.id, content);
      setSelectedFileId(existingFile.id);
      return;
    }

    const uniqueId = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFile: FileItem = {
      id: uniqueId,
      name: fileName,
      type: 'file',
      content: content,
      parentId: undefined
    };

    console.log('✅ Creating new file:', newFile.name, 'Content length:', content.length);
    setFiles(prev => {
      const updated = [...prev, newFile];
      console.log('✅ Files updated, total:', updated.length);
      return updated;
    });
    setSelectedFileId(newFile.id);
    
    // Update current project
    setCurrentProject(prev => ({
      ...prev,
      id: prev?.id || `project_${Date.now()}`,
      name: prev?.name || 'Current Project',
      files: [...files, newFile],
      createdAt: prev?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }, [files]);

  const updateFile = useCallback((fileId: string, content: string) => {
    console.log('✅ Updating file with ID:', fileId);
    
    setFiles(prev => {
      const updated = prev.map(file => 
        file.id === fileId ? { ...file, content } : file
      );
      console.log('✅ File updated, total files:', updated.length);
      return updated;
    });
  }, []);

  // ENHANCED edit file by name with comprehensive file finding
  const editFileByName = useCallback((fileName: string, content: string): boolean => {
    console.log('Attempting to edit file:', fileName);
    
    // Validate content first
    if (!validateFileContent(content, fileName)) {
      console.warn('Edit rejected due to insufficient content:', fileName);
      return false;
    }
    
    const file = findFileByName(fileName);
    
    if (!file) {
      console.error(`File not found: ${fileName}`);
      console.log('Available files:', files.map(f => f.name));
      return false;
    }
    
    console.log('Found file to edit:', file.name);
    
    // Enhanced content merging with better logic
    let finalContent = content;
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.startsWith('// add:') || lowerContent.startsWith('// append:')) {
      finalContent = (file.content || '') + '\n\n' + content.replace(/^\/\/ (add|append):\s*/i, '');
    } else if (lowerContent.startsWith('// prepend:')) {
      finalContent = content.replace(/^\/\/ prepend:\s*/i, '') + '\n\n' + (file.content || '');
    } else if (lowerContent.startsWith('// merge:')) {
      // Intelligent merge - try to combine without duplicating imports/modules
      const existingContent = file.content || '';
      const newContent = content.replace(/^\/\/ merge:\s*/i, '');
      finalContent = mergeCodeIntelligently(existingContent, newContent);
    }
    
    updateFile(file.id, finalContent);
    setSelectedFileId(file.id);
    return true;
  }, [findFileByName, updateFile, files, validateFileContent]);

  // Intelligent code merging function
  const mergeCodeIntelligently = (existing: string, newCode: string): string => {
    const existingLines = existing.split('\n');
    const newLines = newCode.split('\n');
    
    // Extract imports/use statements
    const existingImports = existingLines.filter(line => 
      line.trim().startsWith('use ') || 
      line.trim().startsWith('import ') ||
      line.trim().startsWith('const ') && line.includes('require(')
    );
    
    const newImports = newLines.filter(line => 
      line.trim().startsWith('use ') || 
      line.trim().startsWith('import ') ||
      line.trim().startsWith('const ') && line.includes('require(')
    );
    
    // Merge imports without duplicates
    const allImports = [...existingImports];
    newImports.forEach(newImport => {
      if (!existingImports.some(existing => existing.trim() === newImport.trim())) {
        allImports.push(newImport);
      }
    });
    
    // Get non-import content
    const existingCode = existingLines.filter(line => 
      !line.trim().startsWith('use ') && 
      !line.trim().startsWith('import ') &&
      !(line.trim().startsWith('const ') && line.includes('require('))
    ).join('\n');
    
    const newCodeContent = newLines.filter(line => 
      !line.trim().startsWith('use ') && 
      !line.trim().startsWith('import ') &&
      !(line.trim().startsWith('const ') && line.includes('require('))
    ).join('\n');
    
    return allImports.join('\n') + '\n\n' + existingCode + '\n\n' + newCodeContent;
  };

  const deleteFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId('');
    }
    
    // Update current project if exists
    if (currentProject) {
      const updatedFiles = files.filter(file => file.id !== fileId);
      const updatedProject = {
        ...currentProject,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      };
      setCurrentProject(updatedProject);
    }
  }, [selectedFileId, files, currentProject]);

  const createNewProject = useCallback((name: string) => {
    // Clear localStorage when creating new project
    localStorage.removeItem('imcode-current-project');
    localStorage.removeItem('imcode-selected-file');
    
    const newProject: ProjectData = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setCurrentProject(newProject);
    setFiles([]);
    setSelectedFileId('');
    console.log('Created new project:', name);
  }, []);

  const loadProject = useCallback((project: ProjectData) => {
    setCurrentProject(project);
    setFiles(project.files);
    setSelectedFileId(project.files.length > 0 ? project.files[0].id : '');
    console.log('Loaded project:', project.name, 'with', project.files.length, 'files');
  }, []);

  return (
    <AICodeContext.Provider value={{
      files,
      setFiles,
      addFileFromAI,
      updateFile,
      editFileByName,
      findFileByName,
      deleteFile,
      selectedFileId,
      setSelectedFileId,
      currentProject,
      setCurrentProject,
      createNewProject,
      loadProject,
      getUniqueFileName,
      preventDuplicateFiles,
      saveProjectToStorage,
      loadProjectFromStorage
    }}>
      {children}
    </AICodeContext.Provider>
  );
};
