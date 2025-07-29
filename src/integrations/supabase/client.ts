import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// Get these from: Supabase Dashboard → Settings → API
const SUPABASE_URL = "https://your-project-id.supabase.co"; // Replace with your Project URL
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key"; // Replace with your anon/public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);