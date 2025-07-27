import { createClient } from '@supabase/supabase-js';

// Get environment variables - these should be set in Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create the Supabase client with error handling
let supabase: ReturnType<typeof createClient>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  throw new Error('Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  throw new Error('Failed to initialize Supabase client');
}

export { supabase };

// Contact form submission with error handling
export const submitContactForm = async (data: {
  name: string;
  email: string;
  message: string;
}) => {
  try {
    if (!supabase || !supabase.from) {
      return { success: false, error: 'Supabase client not properly initialized' };
    }
    
    const { error } = await supabase.from('contact_submissions').insert([
      { ...data, timestamp: new Date().toISOString() }
    ]);

    if (error) {
      console.error('Error submitting contact form:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error submitting contact form:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Video management with error handling
export const getVideos = async () => {
  try {
    if (!supabase || !supabase.from) {
      return { success: false, error: 'Supabase client not properly initialized', videos: [] };
    }
    
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return { success: true, videos: data };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return { success: false, error, videos: [] };
  }
};