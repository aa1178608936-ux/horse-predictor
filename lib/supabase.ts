import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqiutytdmaprybhbnpnl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xaXV0eXRkbWFwcnliaGJucG5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDQ5ODMsImV4cCI6MjA4OTU4MDk4M30.fb_mYxrKcC7Ku7bhxb7u2aDe02y8OFVrrVPnZda7AzE';

export const supabase = createClient(supabaseUrl, supabaseKey);