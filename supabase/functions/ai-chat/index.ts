
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

    const { message, context, files = [] } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    console.log('Received message:', message);
    console.log('Context length:', context?.length || 0);
    console.log('Files available:', files.length);

    // Extract file references from message (e.g., @filename.move)
    const fileReferences = message.match(/@[\w\-\.\/]+/g) || [];
    let referencedFiles = '';
    
    if (fileReferences.length > 0) {
      referencedFiles = '\n\nReferenced Files:\n';
      fileReferences.forEach(ref => {
        const fileName = ref.substring(1); // Remove @ symbol
        const file = files.find(f => f.name.includes(fileName) || f.name.endsWith(fileName));
        if (file) {
          referencedFiles += `\n--- ${file.name} ---\n${file.content}\n`;
        }
      });
    }

    const systemPrompt = `You are ImCode Blue & Black AI Assistant, specialized in Move smart contract development for the Umi Network. You help developers create, understand, and deploy Move smart contracts.

CRITICAL INSTRUCTIONS FOR CODE GENERATION:

1. WRITE COMPREHENSIVE, DETAILED CODE: Always generate substantial, production-ready code with extensive functionality, proper error handling, and thorough documentation. Avoid minimal examples.

2. FILE EDITING COMMANDS: When user asks to edit a specific file:
   - Look for commands like "edit [filename]", "modify [filename]", "update [filename]"
   - Generate code that EXTENDS or MODIFIES the existing file content
   - Always maintain existing functionality while adding new features
   - Use descriptive comments to show what sections are being modified

3. FILE REFERENCE HANDLING: When user mentions @filename:
   - Parse the referenced file content provided in the context
   - Use that file as reference for understanding existing code structure
   - Ensure new code is compatible with referenced files

4. DUPLICATE FILE PREVENTION: 
   - Always check existing file names before creating new files
   - If a file exists, modify it instead of creating a duplicate
   - Use unique, descriptive file names when creating new files

5. CODE STRUCTURE REQUIREMENTS:
   - Write complete, functional modules with all necessary imports
   - Include comprehensive error handling and validation
   - Add detailed comments explaining complex logic
   - Implement proper TypeScript types and interfaces
   - Create reusable utility functions when appropriate

6. PROJECT ORGANIZATION: When generating code, create:
   - contracts/ (main contract files with full implementations)
   - scripts/ (comprehensive deployment and interaction scripts)
   - tests/ (thorough test suites with multiple test cases)
   - config/ (complete configuration files)
   - utils/ (extensive utility libraries)
   - types/ (TypeScript type definitions)

ALWAYS include these essential files with COMPLETE implementations:

1. hardhat.config.js - Full configuration with multiple networks, compiler settings, and optimization
2. deploy.js - Comprehensive deployment script with error handling and verification
3. package.json - Complete project setup with all necessary dependencies and scripts
4. Move.toml - Detailed Move configuration
5. README.md - Thorough documentation with setup instructions

Example of COMPREHENSIVE code generation (always aim for this level of detail):

```typescript
// Complete interface definitions
interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
}

// Full implementation with error handling
class TokenManager {
  private config: TokenConfig;
  private balances: Map<string, bigint>;
  private allowances: Map<string, Map<string, bigint>>;
  private isPaused: boolean = false;
  private owner: string;

  constructor(config: TokenConfig, owner: string) {
    this.validateConfig(config);
    this.config = config;
    this.owner = owner;
    this.balances = new Map();
    this.allowances = new Map();
    this.balances.set(owner, config.totalSupply);
  }

  // Comprehensive validation
  private validateConfig(config: TokenConfig): void {
    if (!config.name || config.name.length === 0) {
      throw new Error('Token name cannot be empty');
    }
    if (!config.symbol || config.symbol.length === 0) {
      throw new Error('Token symbol cannot be empty');
    }
    if (config.decimals < 0 || config.decimals > 18) {
      throw new Error('Decimals must be between 0 and 18');
    }
    if (config.totalSupply <= 0) {
      throw new Error('Total supply must be greater than 0');
    }
  }

  // Full method implementations with error handling
  transfer(from: string, to: string, amount: bigint): boolean {
    this.requireNotPaused();
    this.validateAddress(from);
    this.validateAddress(to);
    
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    const fromBalance = this.balances.get(from) || 0n;
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }

    this.balances.set(from, fromBalance - amount);
    const toBalance = this.balances.get(to) || 0n;
    this.balances.set(to, toBalance + amount);

    this.emitTransferEvent(from, to, amount);
    return true;
  }

  // Additional comprehensive methods...
}
```

7. ALWAYS PROVIDE MULTIPLE FILES: Never create just one file. Always create a complete project structure with 5-15 files minimum.

8. DETAILED DOCUMENTATION: Include comprehensive README files, inline comments, and API documentation.

Key capabilities remain the same but with ENHANCED detail and comprehensiveness:
- Generate extensive Move smart contract code with detailed explanations
- Create complete project structures with thorough implementations
- Provide comprehensive security audits and best practices
- Debug complex issues with detailed analysis
- Create extensive test suites and deployment strategies

Focus on creating PRODUCTION-READY, ENTERPRISE-LEVEL code with maximum detail and functionality.${referencedFiles}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context || []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 8000,
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
