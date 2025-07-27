import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are not set
let supabase: ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project-id.supabase.co' || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('Supabase environment variables not configured. Using mock client.');
  // Create a mock supabase client for development
  supabase = ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
              })
            })
          })
        })
      })
    })
  }) as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export async function getLLMApiKey(provider: string): Promise<string> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('provider', provider)
    .eq('is_active', true)
    .order('usage_count', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data?.api_key || typeof data.api_key !== 'string') throw new Error('No active API key found for ' + provider);
  return data.api_key;
}

// Consolidated function to call OpenAI (replaces Gemini, DeepSeek, Grok)
export async function callOpenAI(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
  let apiKey: string;
  
  // Debug: Log what we're finding
  console.log('Environment variable check:', {
    hasViteOpenAI: !!import.meta.env.VITE_OPENAI_API_KEY,
    hasOpenAI: !!import.meta.env.OPENAI_API_KEY,
    viteOpenAIPrefix: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...',
    openAIPrefix: import.meta.env.OPENAI_API_KEY?.substring(0, 10) + '...'
  });
  
  // First try environment variable (check both VITE_ and regular prefix)
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    console.log('Using VITE_OPENAI_API_KEY');
  } else if (import.meta.env.OPENAI_API_KEY) {
    apiKey = import.meta.env.OPENAI_API_KEY;
    console.log('Using OPENAI_API_KEY');
  } else {
    try {
      // Fallback to Supabase
      apiKey = await getLLMApiKey('openai');
      console.log('Using Supabase API key');
    } catch {
      // Final fallback to demo key
      apiKey = "sk-proj-demo-key-placeholder";
      console.log('Using hardcoded demo key');
    }
  }
  
  const url = 'https://api.openai.com/v1/chat/completions';
  const messages = [...history, { role: 'user', content: prompt }];
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to get response from OpenAI');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Legacy function names that now use OpenAI (for backward compatibility)
export async function callGemini(prompt: string): Promise<string> {
  console.log('Gemini call redirected to OpenAI');
  return callOpenAI(prompt);
}

export async function callDeepseek(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
  console.log('DeepSeek call redirected to OpenAI');
  return callOpenAI(prompt, history);
}

export async function callGrok(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
  console.log('Grok call redirected to OpenAI');
  return callOpenAI(prompt, history);
}

// Test functions for API key validation
export async function testOpenAIApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function testGeminiApiKey(apiKey: string): Promise<boolean> {
  // Redirect to OpenAI test since we're consolidating
  return testOpenAIApiKey(apiKey);
}

export async function testGrokApiKey(apiKey: string): Promise<boolean> {
  // Redirect to OpenAI test since we're consolidating
  return testOpenAIApiKey(apiKey);
}

export async function testDeepseekApiKey(apiKey: string): Promise<boolean> {
  // Redirect to OpenAI test since we're consolidating
  return testOpenAIApiKey(apiKey);
}