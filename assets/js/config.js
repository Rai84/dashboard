const { createClient } = supabase;

// 🔑 Coloque aqui suas credenciais do Supabase
const SUPABASE_URL = "https://fprppmxfxwrswlhsxeww.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcnBwbXhmeHdyc3dsaHN4ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzQ0OTMsImV4cCI6MjA3NDk1MDQ5M30.Wv918OkNZoFL6lAVkxX-IAxzibyA6qqnqFjZGqb0kSI";

// Cliente global do Supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
