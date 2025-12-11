import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback to provided project URL and anon key if env vars are not available
const supabaseUrl =
  envUrl && envUrl.length > 0
    ? envUrl
    : 'https://rehietifqyozzxsqiuro.supabase.co';

const supabaseAnonKey =
  envAnon && envAnon.length > 0
    ? envAnon
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlaGlldGlmcXlvenp4c3FpdXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjcyMjksImV4cCI6MjA2NTc0MzIyOX0.Ka7F3CiZiwHfBwq9qv3VJMbLkmjYvqxB__DQVtp6bSs';

if (!envUrl || !envAnon) {
  console.warn('Supabase environment variables are not set. Using fallback URL/key.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
