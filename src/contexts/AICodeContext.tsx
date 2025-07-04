
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

  // Generate a unique filename if duplicates exist
  const generateUniqueFileName = useCallback((fileName: string, existingFiles: FileItem[]): string => {
    const existingNames = existingFiles.map(f => f.name);
    
    if (!existingNames.includes(fileName)) {
      return fileName;
    }

    const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || ''; // Get extension
    
    let counter = 1;
    let uniqueName = fileName;
    
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${baseName}_${counter}${extension}`;
      counter++;
    }
    
    return uniqueName;
  }, []);

  // Enhanced file finding with multiple matching strategies
  const findFileByName = useCallback((fileName: string): FileItem | undefined => {
    // Try exact match first
    let file = files.find(f => f.name === fileName);
    if (file) return file;

    // Try case-insensitive exact match
    file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    if (file) return file;

    // Try partial match (ends with)
    file = files.find(f => f.name.endsWith(fileName));
    if (file) return file;

    // Try partial match (contains)
    file = files.find(f => f.name.includes(fileName));
    if (file) return file;

    // Try without extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    file = files.find(f => f.name.includes(nameWithoutExt));
    if (file) return file;

    return undefined;
  }, [files]);

  // Organize files into directories based on AI-generated content type
  const organizeFileIntoDirectory = useCallback((fileName: string, type: string): string => {
    if (fileName.endsWith('.move')) {
      return `contracts/${fileName}`;
    } else if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return `scripts/${fileName}`;
    } else if (fileName.endsWith('.json')) {
      return `config/${fileName}`;
    } else if (fileName.endsWith('.toml')) {
      return `config/${fileName}`;
    } else if (fileName.endsWith('.md')) {
      return `docs/${fileName}`;
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

    // Create new file with unique name
    const uniqueFileName = generateUniqueFileName(fileName, files);
    const organizedPath = organizeFileIntoDirectory(uniqueFileName, type);
    const finalUniqueName = generateUniqueFileName(organizedPath, files);
    const uniqueId = `${finalUniqueName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFile: FileItem = {
      id: uniqueId,
      name: finalUniqueName,
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
  }, [files, generateUniqueFileName, organizeFileIntoDirectory, currentProject, findFileByName]);

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

  // Edit file by name - returns true if successful, false if file not found
  const editFileByName = useCallback((fileName: string, content: string): boolean => {
    const file = findFileByName(fileName);
    if (!file) {
      return false;
    }
    
    updateFile(file.id, content);
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
      loadProject
    }}>
      {children}
    </AICodeContext.Provider>
  );
};
