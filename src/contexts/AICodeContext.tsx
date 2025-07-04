
import React, { createContext, useContext, useState, useCallback } from 'react';

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

  // Enhanced unique filename generation with comprehensive checking
  const getUniqueFileName = useCallback((fileName: string): string => {
    const existingNames = files.map(f => f.name.toLowerCase());
    const lowerFileName = fileName.toLowerCase();
    
    if (!existingNames.includes(lowerFileName)) {
      return fileName;
    }

    const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || ''; // Get extension
    
    let counter = 1;
    let uniqueName = fileName;
    
    while (existingNames.includes(uniqueName.toLowerCase())) {
      uniqueName = `${baseName}_${counter}${extension}`;
      counter++;
    }
    
    return uniqueName;
  }, [files]);

  // Check if a file name would create a duplicate
  const preventDuplicateFiles = useCallback((fileName: string): boolean => {
    const existingNames = files.map(f => f.name.toLowerCase());
    return existingNames.includes(fileName.toLowerCase());
  }, [files]);

  // Enhanced file finding with multiple matching strategies
  const findFileByName = useCallback((fileName: string): FileItem | undefined => {
    // Clean the filename (remove @ symbol if present)
    const cleanFileName = fileName.startsWith('@') ? fileName.substring(1) : fileName;
    
    // Try exact match first (case sensitive)
    let file = files.find(f => f.name === cleanFileName);
    if (file) return file;

    // Try case-insensitive exact match
    file = files.find(f => f.name.toLowerCase() === cleanFileName.toLowerCase());
    if (file) return file;

    // Try partial match (ends with) - useful for paths like contracts/Token.move
    file = files.find(f => f.name.endsWith(cleanFileName));
    if (file) return file;

    // Try partial match (contains) - useful for finding files in subdirectories
    file = files.find(f => f.name.includes(cleanFileName));
    if (file) return file;

    // Try without extension
    const nameWithoutExt = cleanFileName.replace(/\.[^/.]+$/, "");
    file = files.find(f => f.name.includes(nameWithoutExt));
    if (file) return file;

    // Try basename matching (last part of path)
    const baseName = cleanFileName.split('/').pop() || cleanFileName;
    file = files.find(f => {
      const fileBaseName = f.name.split('/').pop() || f.name;
      return fileBaseName.toLowerCase() === baseName.toLowerCase();
    });
    if (file) return file;

    return undefined;
  }, [files]);

  // Smart file organization based on content type and AI patterns
  const organizeFileIntoDirectory = useCallback((fileName: string, content: string, type: string): string => {
    // Don't reorganize if already has a path
    if (fileName.includes('/')) {
      return fileName;
    }

    // Analyze content to determine best folder
    const lowerContent = content.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // Move contracts
    if (fileName.endsWith('.move') || lowerContent.includes('module') || lowerContent.includes('struct')) {
      if (lowerContent.includes('token') || lowerFileName.includes('token')) {
        return `contracts/tokens/${fileName}`;
      }
      if (lowerContent.includes('nft') || lowerFileName.includes('nft')) {
        return `contracts/nft/${fileName}`;
      }
      if (lowerContent.includes('defi') || lowerContent.includes('liquidity') || lowerContent.includes('pool')) {
        return `contracts/defi/${fileName}`;
      }
      if (lowerContent.includes('governance') || lowerContent.includes('dao')) {
        return `contracts/governance/${fileName}`;
      }
      return `contracts/${fileName}`;
    }

    // JavaScript/TypeScript files
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      if (lowerContent.includes('deploy') || lowerFileName.includes('deploy')) {
        return `scripts/deployment/${fileName}`;
      }
      if (lowerContent.includes('test') || lowerFileName.includes('test')) {
        return `tests/${fileName}`;
      }
      if (lowerContent.includes('interact') || lowerFileName.includes('interact')) {
        return `scripts/interaction/${fileName}`;
      }
      if (lowerContent.includes('hardhat') || lowerFileName.includes('hardhat')) {
        return `config/${fileName}`;
      }
      return `scripts/${fileName}`;
    }

    // Configuration files
    if (fileName.endsWith('.json')) {
      if (lowerFileName.includes('package')) {
        return fileName; // Keep package.json at root
      }
      return `config/${fileName}`;
    }

    if (fileName.endsWith('.toml')) {
      return `config/${fileName}`;
    }

    // Documentation
    if (fileName.endsWith('.md')) {
      return `docs/${fileName}`;
    }

    // Utility files
    if (lowerFileName.includes('util') || lowerFileName.includes('helper')) {
      return `utils/${fileName}`;
    }

    // Types
    if (fileName.endsWith('.d.ts') || lowerContent.includes('interface') || lowerContent.includes('type ')) {
      return `types/${fileName}`;
    }

    return `misc/${fileName}`;
  }, []);

  const addFileFromAI = useCallback((fileName: string, content: string, type: string = 'move') => {
    // Check if file already exists and should be updated instead
    const existingFile = findFileByName(fileName);
    if (existingFile) {
      // Update existing file instead of creating duplicate
      setFiles(prev => prev.map(file => 
        file.id === existingFile.id 
          ? { ...file, content: content }
          : file
      ));
      setSelectedFileId(existingFile.id);
      
      // Update current project if exists
      if (currentProject) {
        const updatedFiles = files.map(file => 
          file.id === existingFile.id 
            ? { ...file, content: content }
            : file
        );
        const updatedProject = {
          ...currentProject,
          files: updatedFiles,
          updatedAt: new Date().toISOString()
        };
        setCurrentProject(updatedProject);
      }
      return;
    }

    // Organize file into appropriate directory structure
    const organizedPath = organizeFileIntoDirectory(fileName, content, type);
    const uniqueFileName = getUniqueFileName(organizedPath);
    const uniqueId = `${uniqueFileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFile: FileItem = {
      id: uniqueId,
      name: uniqueFileName,
      type: 'file',
      content: content,
      parentId: undefined
    };

    setFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
    
    // Update current project if exists
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        files: [...files, newFile],
        updatedAt: new Date().toISOString()
      };
      setCurrentProject(updatedProject);
    }
  }, [files, getUniqueFileName, organizeFileIntoDirectory, currentProject, findFileByName]);

  const updateFile = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, content } : file
    ));
    
    // Update current project if exists
    if (currentProject) {
      const updatedFiles = files.map(file => 
        file.id === fileId ? { ...file, content } : file
      );
      const updatedProject = {
        ...currentProject,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      };
      setCurrentProject(updatedProject);
    }
  }, [files, currentProject]);

  // Enhanced edit file by name with better matching and content merging
  const editFileByName = useCallback((fileName: string, content: string): boolean => {
    const file = findFileByName(fileName);
    if (!file) {
      console.warn(`File not found: ${fileName}. Available files:`, files.map(f => f.name));
      return false;
    }
    
    // Smart content merging - if content starts with "// ADD:" or similar, append instead of replace
    let finalContent = content;
    if (content.startsWith('// ADD:') || content.startsWith('// APPEND:')) {
      finalContent = (file.content || '') + '\n\n' + content.replace(/^\/\/ (ADD|APPEND):\s*/, '');
    } else if (content.startsWith('// PREPEND:')) {
      finalContent = content.replace(/^\/\/ PREPEND:\s*/, '') + '\n\n' + (file.content || '');
    }
    
    updateFile(file.id, finalContent);
    setSelectedFileId(file.id);
    return true;
  }, [findFileByName, updateFile]);

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
  }, []);

  const loadProject = useCallback((project: ProjectData) => {
    setCurrentProject(project);
    setFiles(project.files);
    setSelectedFileId(project.files.length > 0 ? project.files[0].id : '');
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
      preventDuplicateFiles
    }}>
      {children}
    </AICodeContext.Provider>
  );
};
