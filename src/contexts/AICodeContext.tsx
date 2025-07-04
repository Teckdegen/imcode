
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
    const baseName = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || ''; // Get extension
    
    const existingNames = existingFiles.map(f => f.name);
    let counter = 0;
    let uniqueName = fileName;
    
    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName}_${counter}${extension}`;
    }
    
    return uniqueName;
  }, []);

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
    const uniqueFileName = generateUniqueFileName(fileName, files);
    const organizedPath = organizeFileIntoDirectory(uniqueFileName, type);
    const uniqueId = `${organizedPath.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFile: FileItem = {
      id: uniqueId,
      name: organizedPath,
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
  }, [files, generateUniqueFileName, organizeFileIntoDirectory, currentProject]);

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
