import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to prevent undefined errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://irzgkacsptptspcozrrd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyemdrYWNzcHRwdHNwY296cnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzU5NzksImV4cCI6MjA2NDI1MTk3OX0.-QXjX32eMiRgRtYu57PrDyAdK06x1pRWl3NjnSvcoqQ';

// Create the Supabase client with error handling
let supabase: ReturnType<typeof createClient>;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Error initializing Supabase client:', error);
  // Create a minimal client as fallback
  supabase = createClient('https://irzgkacsptptspcozrrd.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyemdrYWNzcHRwdHNwY296cnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NzU5NzksImV4cCI6MjA2NDI1MTk3OX0.-QXjX32eMiRgRtYu57PrDyAdK06x1pRWl3NjnSvcoqQ');
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
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { success: false, error };
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