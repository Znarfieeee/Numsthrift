import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wesdomdatchzehzqinul.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indlc2RvbWRhdGNoemVoenFpbnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTg3NzksImV4cCI6MjA3NjAzNDc3OX0.5NrWYmb67yMwPyLQ3vbSC_JfvKFrvN_pbMnLpc4e2i4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
