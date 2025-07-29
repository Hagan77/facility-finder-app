import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// Get these from: Supabase Dashboard → Settings → API
const SUPABASE_URL = "https://xuvrmdukjkgqrbqpsunf.supabase.co"; // Replace with your Project URL
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1dnJtZHVramtncXJicXBzdW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTMyMzEsImV4cCI6MjA2OTMyOTIzMX0.CaGGAoboD4GqGm3fkqEQkGz-uxEUa-p1fJFHM1DtZ0Q"; // Replace with your anon/public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);