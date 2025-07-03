
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletAuth } from './WalletAuthContext';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeGenerated?: boolean;
  fileName?: string;
}

interface ChatHistoryContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  loadChatHistory: () => void;
  saveChatHistory: () => void;
  clearHistory: () => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};

interface ChatHistoryProviderProps {
  children: React.ReactNode;
}

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { userProfile } = useWalletAuth();

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('user_id', userProfile.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.messages) {
        const loadedMessages = (data.messages as any[]).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [userProfile]);

  const saveChatHistory = useCallback(async () => {
    if (!userProfile || messages.length === 0) return;

    try {
      // Convert messages to plain objects to ensure JSON compatibility
      const messagesJson = messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        codeGenerated: msg.codeGenerated,
        fileName: msg.fileName
      }));

      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          user_id: userProfile.id,
          messages: messagesJson,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving chat history:', error);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [userProfile, messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [userProfile]);

  useEffect(() => {
    if (messages.length > 0) {
      const saveTimer = setTimeout(saveChatHistory, 2000);
      return () => clearTimeout(saveTimer);
    }
  }, [messages, saveChatHistory]);

  return (
    <ChatHistoryContext.Provider value={{
      messages,
      addMessage,
      loadChatHistory,
      saveChatHistory,
      clearHistory
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
