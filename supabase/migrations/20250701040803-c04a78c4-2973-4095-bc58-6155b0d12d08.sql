
-- Create user profiles table to store wallet-connected users
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_message_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  messages_used INTEGER DEFAULT 0,
  total_messages_allowed INTEGER DEFAULT 5
);

-- Create projects table to store user projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  files JSONB DEFAULT '[]'::jsonb,
  contract_address TEXT,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat sessions table to track AI interactions
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles (users can only see/modify their own profile)
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Users can insert their own projects" ON public.projects
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- RLS policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Users can insert their own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

CREATE POLICY "Users can update their own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (user_id IN (SELECT id FROM public.user_profiles WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'));

-- Function to reset message limit after 24 hours
CREATE OR REPLACE FUNCTION reset_message_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if 24 hours have passed since last reset
  IF NEW.last_message_reset < NOW() - INTERVAL '24 hours' THEN
    NEW.messages_used := 0;
    NEW.total_messages_allowed := 5;
    NEW.last_message_reset := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically reset message limit
CREATE TRIGGER reset_message_limit_trigger
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_message_limit();
