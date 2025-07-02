
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured. Please add your OPENAI_API_KEY in the Supabase Edge Function Secrets.');
    }

    const { message, context } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    console.log('Received message:', message);
    console.log('Context length:', context?.length || 0);

    const systemPrompt = `You are ImCode Blue & Black AI Assistant, specialized in Move smart contract development for the Umi Network. You help developers create, understand, and deploy Move smart contracts.

Key capabilities:
- Generate Move smart contract code with detailed explanations
- Explain Move language concepts and best practices
- Help with Umi Network deployment strategies
- Provide smart contract security best practices
- Debug Move code issues and suggest improvements
- Create comprehensive contract examples with comments

Focus areas:
- Token contracts (fungible and non-fungible tokens)
- DeFi protocols (AMM, lending, staking)
- Governance systems and DAOs
- Multi-signature wallets and access control
- Cross-chain bridges and interoperability
- Gaming and NFT marketplaces

Always provide:
1. Working, production-ready code examples
2. Clear explanations of each function and module
3. Security considerations and best practices
4. Gas optimization tips
5. Testing strategies and examples
6. Deployment instructions for Umi Network

Be concise but comprehensive. Always include practical code examples when requested. Focus on creating secure, efficient, and well-documented Move contracts.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context || []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;
    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: 'Please check if your OpenAI API key is properly configured in Supabase Edge Function Secrets.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
