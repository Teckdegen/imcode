
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  wallet_address: string;
  messages_used: number;
  total_messages_allowed: number;
  last_message_reset: string;
}

interface WalletAuthContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  messagesRemaining: number;
  canSendMessage: boolean;
  incrementMessageCount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined);

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
};

interface WalletAuthProviderProps {
  children: ReactNode;
}

export const WalletAuthProvider = ({ children }: WalletAuthProviderProps) => {
  const { address, isConnected } = useAccount();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrCreateProfile = async (walletAddress: string) => {
    setIsLoading(true);
    try {
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingProfile) {
        setUserProfile(existingProfile);
      } else if (fetchError?.code === 'PGRST116') {
        // Profile doesn't exist, create new one
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert([{ wallet_address: walletAddress }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          setUserProfile(newProfile);
        }
      } else {
        console.error('Error fetching profile:', fetchError);
      }
    } catch (error) {
      console.error('Error in fetchOrCreateProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (address && isConnected) {
      await fetchOrCreateProfile(address);
    }
  };

  const incrementMessageCount = async () => {
    if (!userProfile) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        messages_used: userProfile.messages_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id);

    if (!error) {
      setUserProfile(prev => prev ? {
        ...prev,
        messages_used: prev.messages_used + 1
      } : null);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      fetchOrCreateProfile(address);
    } else {
      setUserProfile(null);
    }
  }, [address, isConnected]);

  const messagesRemaining = userProfile ? 
    Math.max(0, userProfile.total_messages_allowed - userProfile.messages_used) : 0;
  
  const canSendMessage = messagesRemaining > 0 && isConnected;

  return (
    <WalletAuthContext.Provider value={{
      userProfile,
      isLoading,
      messagesRemaining,
      canSendMessage,
      incrementMessageCount,
      refreshProfile
    }}>
      {children}
    </WalletAuthContext.Provider>
  );
};
