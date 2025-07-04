
import React, { createContext, useContext, useState, useCallback } from 'react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId?: string;
  displayName?: string; // Add displayName property to fix TypeScript errors
}

interface AICodeContextType {
  files: FileItem[];
  setFiles: (files: FileItem[]) => void;
  addFileFromAI: (fileName: string, content: string, type?: string) => void;
  updateFile: (fileId: string, content: string) => void;
  deleteFile: (fileId: string) => void;
  selectedFileId: string;
  setSelectedFileId: (id: string) => void;
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

  const addFileFromAI = useCallback((fileName: string, content: string, type: string = 'move') => {
    // Generate a unique ID based on filename and timestamp to ensure uniqueness
    const uniqueId = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newFile: FileItem = {
      id: uniqueId,
      name: fileName,
      type: 'file',
      content: content,
      parentId: undefined
    };

    setFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
  }, []);

  const updateFile = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, content } : file
    ));
  }, []);

  const deleteFile = useCallback((fileId: string) => {
    // Only delete the specific file with the matching ID, not files with similar content
    setFiles(prev => prev.filter(file => file.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId('');
    }
  }, [selectedFileId]);

  return (
    <AICodeContext.Provider value={{
      files,
      setFiles,
      addFileFromAI,
      updateFile,
      deleteFile,
      selectedFileId,
      setSelectedFileId
    }}>
      {children}
    </AICodeContext.Provider>
  );
};
